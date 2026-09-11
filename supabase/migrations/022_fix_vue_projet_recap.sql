-- Recréer vue_projet_recap : totaux = somme réelle des commandes (sans x nb personnes)
drop view if exists public.vue_projet_recap;

create view public.vue_projet_recap as
select
  pr.id as project_id,
  pr.couturier_id,
  pr.nom,
  pr.statut,
  pr.date_evenement,
  (select count(*) from public.project_participants pp where pp.project_id = pr.id) as nb_personnes,
  (select count(*) from public.orders o where o.project_id = pr.id) as nb_vetements,
  (
    select count(*)
    from public.orders o
    where o.project_id = pr.id
      and o.order_status in ('terminee', 'livree', 'completed', 'delivered')
  ) as nb_vetements_termines,
  coalesce((
    select sum(o.total_price)
    from public.orders o
    where o.project_id = pr.id
      and o.order_status not in ('cancelled', 'annulee')
  ), 0) as montant_total,
  coalesce((
    select sum(p.amount)
    from public.payments p
    where p.id in (
      select p2.id from public.payments p2 where p2.project_id = pr.id
      union
      select p3.id from public.payments p3
      where p3.order_id in (select o2.id from public.orders o2 where o2.project_id = pr.id)
    )
  ), 0) as total_paye,
  greatest(
    coalesce((
      select sum(o.total_price)
      from public.orders o
      where o.project_id = pr.id
        and o.order_status not in ('cancelled', 'annulee')
    ), 0)
    - coalesce((
      select sum(p.amount)
      from public.payments p
      where p.id in (
        select p2.id from public.payments p2 where p2.project_id = pr.id
        union
        select p3.id from public.payments p3
        where p3.order_id in (select o2.id from public.orders o2 where o2.project_id = pr.id)
      )
    ), 0),
    0
  ) as reste_a_payer
from public.projects pr
where pr.deleted_at is null;

grant select on public.vue_projet_recap to authenticated;
