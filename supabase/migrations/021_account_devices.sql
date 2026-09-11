-- Appareils du compte + historique de connexion (alerte nouvelle session)
-- À coller une fois dans Supabase → SQL Editor si la table n'existe pas encore.

create table if not exists public.account_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id text not null,
  name text not null default 'Appareil',
  os text not null default '',
  expo_push_token text,
  is_primary boolean not null default false,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, device_id)
);

create table if not exists public.account_login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id text,
  action text not null,
  location text,
  created_at timestamptz not null default now(),
  success boolean not null default true
);

create index if not exists account_devices_user_idx on public.account_devices (user_id);
create index if not exists account_login_events_user_idx on public.account_login_events (user_id, created_at desc);

alter table public.account_devices enable row level security;
alter table public.account_login_events enable row level security;

drop policy if exists account_devices_own on public.account_devices;
create policy account_devices_own on public.account_devices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists account_login_events_own on public.account_login_events;
create policy account_login_events_own on public.account_login_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.account_devices to authenticated;
grant select, insert on public.account_login_events to authenticated;
