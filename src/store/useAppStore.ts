// store/useAppStore.ts

// ==========================================
// STORE PRINCIPAL - TailorPro (Supabase)
// ==========================================

import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import {
  clientService, orderService, activityService, catalogService,
  statisticsService, measurementService, mapClient, mapOrder, mapActivity, mapCatalogModel, paymentService,
  ficheService, mapFiche,
  realisationService, mapRealisation, uploadRealisationPhoto, createPaiementM8,
  tissuService, mapTissu, uploadTissuPhoto,
  historiqueStatutService,
  projectService, mapProject, mapProjectRecap,
  participantService, mapParticipant,
  measurementFieldService, mapMeasurementField,
  resolveClientPhotoForSave, isRemotePhoto,
} from '@services/supabaseService';
import { isCancelledOrder } from '@constants/commandeConstants';
import { expectedClientBalance } from '@/src/utils/clientBalance';
import { splitGlobalAdvance } from '@/src/utils/splitGlobalAdvance';
import type {
  Client, Order, Measurements, Payment, CatalogModel, Activity, Statistics, FicheMensuration, TypeVetement, Realisation, StatutRealisation, Tissu,
  Project, ProjectRecap, ProjectStatut, ProjectParticipant, GarmentMeasurementField, MeasurementChoiceResult,
} from '../types';

// ==========================================
// TYPE PROFIL
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  atelier_name: string | null;
  role: 'tailor' | 'client';
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  adresse: string | null;
  description: string | null;
  specialities: string[] | null;
  horaires: Record<string, string> | null;
  reseaux_sociaux: { facebook?: string; instagram?: string; tiktok?: string } | null;
  statut_catalogue: 'public' | 'prive';
  plan_abonnement: 'gratuit' | 'pro' | 'business';
  devise: string | null;
  langue: string | null;
  unite_mesure: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

async function applyOrderCancellationEffects(
  get: () => AppState,
  set: (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
  order: Order,
) {
  const due = Math.max(0, order.remainingAmount ?? 0);
  if (due > 0) {
    const client = get().getClientById(order.clientId);
    if (client) {
      const nextBalance = Math.max(0, (client.balance ?? 0) - due);
      await clientService.update(order.clientId, { balance: nextBalance });
      set(state => ({
        clients: state.clients.map(c =>
          c.id === order.clientId ? { ...c, balance: nextBalance } : c
        ),
      }));
    }
  }
  try {
    await activityService.create({
      type: 'order_completed',
      title: 'Commande annulée',
      subtitle: order.clientName,
      clientId: order.clientId,
      orderId: order.id,
    });
  } catch (_) {}
  get().loadActivities();
}

// ==========================================
// TYPES DU STORE
// ==========================================

interface AppState {
  // ── Auth & Profil ──
  isAuthenticated: boolean;
  userId: string | null;
  profile: UserProfile | null;

  // ── Données ──
  clients: Client[];
  orders: Order[];
  catalog: CatalogModel[];
  tissus: Tissu[];
  activities: Activity[];
  statistics: Statistics;
  measurements: Record<string, Measurements>;
  fiches: Record<string, FicheMensuration[]>;
  realisations: Record<string, Realisation[]>;
  payments: Record<string, Payment[]>;

  // ── Projets / commandes groupées (Module 13) ──
  projects: Project[];
  projectRecaps: Record<string, ProjectRecap>;         // keyed by projectId
  participants: Record<string, ProjectParticipant[]>;  // keyed by projectId
  measurementFields: Record<string, GarmentMeasurementField[]>; // keyed by typeVetement

  // ── UI ──
  isLoading: boolean;
  error: string | null;
  selectedClientFilter: 'all' | 'recent' | 'favorite';
  selectedCatalogCategory: string;
  searchQuery: string;

  // ── Actions Auth ──
  setAuthenticated: (status: boolean, userId?: string) => void;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;

  // ── Actions Data (Supabase) ──
  loadClients: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadActivities: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  loadAll: () => Promise<void>;
  reconcileCancelledOrderBalances: () => Promise<void>;

  // ── Actions Clients (locales + sync) ──
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client | null>;
  updateClient: (clientId: string, data: Partial<Client>) => Promise<boolean>;
  deleteClient: (clientId: string) => Promise<void>;

  // ── Actions Orders (locales + sync) ──
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order | null>;
  updateOrder: (orderId: string, data: Partial<Order>) => Promise<void>;
  updateOrderStatut: (orderId: string, newStatut: string, commentaire?: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // ── Actions Measurements (legacy) ──
  setMeasurements: (clientId: string, measurements: Measurements) => void;
  loadMeasurements: (clientId: string) => Promise<void>;
  saveMeasurements: (
      clientId: string,
      data: Omit<Measurements, 'id' | 'clientId'>
  ) => Promise<Measurements | null>;

  // ── Actions Fiches Mensuration (Module 3) ──
  loadFiches: (clientId: string) => Promise<void>;
  addFiche: (clientId: string, data: Omit<FicheMensuration, 'id' | 'createdAt' | 'couturierId' | 'clientId'>) => Promise<FicheMensuration | null>;
  duplicateFiche: (ficheId: string, clientId: string) => Promise<FicheMensuration | null>;
  setFicheActive: (ficheId: string, clientId: string, typeVetement: TypeVetement) => Promise<void>;
  deleteFiche: (ficheId: string, clientId: string) => Promise<void>;
  getFichesByType: (clientId: string, type: TypeVetement) => FicheMensuration[];
  getActiveFiche: (clientId: string, type: TypeVetement) => FicheMensuration | undefined;
  getFicheById: (ficheId: string, clientId: string) => FicheMensuration | undefined;

  // ── Actions Réalisations (Module 5) ──
  loadRealisations: (clientId: string) => Promise<void>;
  loadAllRealisations: () => Promise<void>;
  addRealisation: (
      clientId: string,
      data: Omit<Realisation, 'id' | 'createdAt' | 'couturierId' | 'clientId'>,
      localPhotoUris?: string[],
  ) => Promise<Realisation | null>;
  updateRealisation: (
      realisationId: string,
      clientId: string,
      data: Partial<Omit<Realisation, 'id' | 'createdAt' | 'couturierId'>>,
  ) => Promise<void>;
  updateRealisationStatut: (realisationId: string, clientId: string, statut: StatutRealisation) => Promise<void>;
  deleteRealisation: (realisationId: string, clientId: string) => Promise<void>;
  addRealisationPhoto: (realisationId: string, clientId: string, localUri: string) => Promise<boolean>;
  getRealisationById: (realisationId: string, clientId: string) => Realisation | undefined;
  getRealisationsByCommande: (commandeId: string, clientId: string) => Realisation[];
  getRealisationsByTissu: (tissuId: string) => Realisation[];

  // ── Actions Tissus (Module 6) ──
  loadTissus: () => Promise<void>;
  addTissu: (
      data: Omit<Tissu, 'id' | 'createdAt' | 'updatedAt' | 'couturierId'>,
      localPhotoUri?: string,
  ) => Promise<Tissu | null>;
  updateTissu: (
      tissuId: string,
      data: Partial<Omit<Tissu, 'id' | 'createdAt' | 'updatedAt' | 'couturierId'>>,
      newLocalPhotoUri?: string,
  ) => Promise<void>;
  deleteTissu: (tissuId: string) => Promise<void>;
  getTissuById: (tissuId: string) => Tissu | undefined;
  getTissusByType: (type: string) => Tissu[];
  getTissusByFournisseur: (fournisseur: string) => Tissu[];

  // ── Actions Payments ──
  ///addPayment: (clientId: string, payment: Payment) => void;
  addPayment: (params: {
    orderId?: string;
    projectId?: string;
    clientId: string;
    amount: number;
    method: 'cash' | 'mobile_money' | 'bank_transfer' | 'other';
    typePaiement?: 'acompte' | 'paiement_intermediaire' | 'solde_final';
    notes?: string;
  }) => Promise<Payment | null>;

  loadPaymentsForOrder: (orderId: string) => Promise<void>;

  // ── Actions Projets / Commandes groupées (Module 13) ──
  loadProjects: () => Promise<void>;
  loadProjectRecap: (projectId: string) => Promise<void>;
  addProject: (data: { clientId: string; nom: string; typeProjet?: string; statut?: ProjectStatut; dateEvenement?: Date; notes?: string }) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  updateProjectStatut: (projectId: string, statut: ProjectStatut) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectById: (projectId: string) => Project | undefined;

  loadParticipants: (projectId: string) => Promise<void>;
  addParticipant: (data: { projectId: string; clientId?: string; nom: string; telephone?: string; role?: string; isTemporary?: boolean }) => Promise<ProjectParticipant | null>;
  updateParticipant: (participantId: string, projectId: string, data: Partial<ProjectParticipant>) => Promise<void>;
  promoteParticipant: (participantId: string, projectId: string, clientData: { telephone: string; sexe?: 'homme' | 'femme' | 'autre' }) => Promise<void>;
  deleteParticipant: (participantId: string, projectId: string) => Promise<void>;
  getParticipantsByProject: (projectId: string) => ProjectParticipant[];

  /** Ajoute un vêtement à une personne d'un projet (= addOrder avec projectId/participantId), puis rafraîchit le récap */
  addGarmentToParticipant: (
      projectId: string,
      participantId: string,
      garmentData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'projectId' | 'participantId'>,
  ) => Promise<Order | null>;
  getOrdersByProject: (projectId: string) => Order[];
  getOrdersByParticipant: (participantId: string) => Order[];

  /** Applique le choix de mensuration (fiche existante ou nouvelles mesures) à un vêtement du projet */
  applyMeasurementChoice: (
      orderId: string,
      clientId: string,
      typeVetement: TypeVetement,
      choice: MeasurementChoiceResult,
  ) => Promise<FicheMensuration | null>;

  loadMeasurementFields: (typeVetement: TypeVetement) => Promise<void>;
  getMeasurementFields: (typeVetement: TypeVetement) => GarmentMeasurementField[];

  // ── Actions Catalog ──
  loadCatalog: () => Promise<void>;
  addCatalogModel: (model: Omit<CatalogModel, 'id' | 'createdAt' | 'couturierId' | 'deletedAt'>) => Promise<CatalogModel | null>;
  updateCatalogModel: (modelId: string, data: Partial<CatalogModel>) => Promise<void>;
  deleteCatalogModel: (modelId: string) => Promise<void>;
  archiveCatalogModel: (modelId: string) => Promise<void>;
  duplicateCatalogModel: (modelId: string) => Promise<CatalogModel | null>;
  toggleCatalogFavorite: (modelId: string) => Promise<void>;
  toggleCatalogStatut: (modelId: string) => Promise<void>;
  getModelById: (modelId: string) => CatalogModel | undefined;

  // ── Actions UI ──
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setClientFilter: (filter: 'all' | 'recent' | 'favorite') => void;
  setCatalogCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;

  // ── Helpers ──
  getClientById: (clientId: string) => Client | undefined;
  getOrdersByClient: (clientId: string) => Order[];
  getMeasurementsByClient: (clientId: string) => Measurements | undefined;
  getPaymentsByClient: (clientId: string) => Payment[];
}

// ==========================================
// STATISTIQUES PAR DÉFAUT
// ==========================================

const DEFAULT_STATISTICS: Statistics = {
  totalClients: 0,
  monthlyRevenue: 0,
  revenueGrowth: 0,
  ordersInProgress: 0,
  completedOrders: 0,
  unpaidInvoices: 0,
  unpaidAmount: 0,
  totalExpenses: 0,
  netProfit: 0,
};

// ==========================================
// HELPER : mappe une ligne Supabase → Measurements
// ==========================================

const mapMeasurements = (row: Record<string, unknown>): Measurements => ({
  id: row.id as string,
  clientId: row.client_id as string,
  recordedAt: new Date(row.recorded_at as string),
  chestCircumference: row.chest_circumference as number | undefined,
  waistCircumference: row.waist_circumference as number | undefined,
  hipCircumference: row.hip_circumference as number | undefined,
  backWidth: row.back_width as number | undefined,
  shoulderWidth: row.shoulder_width as number | undefined,
  sleeveLength: row.sleeve_length as number | undefined,
  armCircumference: row.arm_circumference as number | undefined,
  neckCircumference: row.neck_circumference as number | undefined,
  dressLength: row.dress_length as number | undefined,
  bustHeight: row.bust_height as number | undefined,
  thighCircumference: row.thigh_circumference as number | undefined,
});

// ==========================================
// STORE
// ==========================================

export const useAppStore = create<AppState>((set, get) => ({

  // ── État initial ──
  isAuthenticated: false,
  userId: null,
  profile: null,

  clients: [],
  orders: [],
  catalog: [],
  activities: [],
  statistics: DEFAULT_STATISTICS,
  measurements: {},
  fiches: {},
  realisations: {},
  tissus: [],
  payments: {},

  projects: [],
  projectRecaps: {},
  participants: {},
  measurementFields: {},

  isLoading: false,
  error: null,
  selectedClientFilter: 'all',
  selectedCatalogCategory: 'all',
  searchQuery: '',

  // ==========================================
  // AUTH
  // ==========================================

  setAuthenticated: (status, userId) =>
      set({ isAuthenticated: status, userId: userId ?? null }),

  logout: async () => {
    await supabase.auth.signOut();
    set({
      isAuthenticated: false,
      userId: null,
      profile: null,
      clients: [],
      orders: [],
      activities: [],
      statistics: DEFAULT_STATISTICS,
      measurements: {},
    });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, atelier_name, role, phone, whatsapp, city, adresse, description, specialities, horaires, reseaux_sociaux, statut_catalogue, plan_abonnement, devise, langue, unite_mesure, avatar_url, created_at')
        .eq('id', user.id)
        .single();

    if (!error && data) {
      set({ profile: data as UserProfile, userId: user.id, isAuthenticated: true });
    }
  },

  updateProfile: async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Utilisateur non connecté') };

    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (error) return { error: new Error(error.message) };

    const current = get().profile;
    if (current) {
      set({ profile: { ...current, ...updates } });
    } else {
      await get().fetchProfile();
    }
    return { error: null };
  },

  // ==========================================
  // CHARGEMENT DONNÉES (SUPABASE)
  // ==========================================

  loadClients: async () => {
    const { data, error } = await clientService.getAll();
    if (error) { set({ error: error.message }); return; }
    set({ clients: (data ?? []).map(mapClient) });
  },

  loadOrders: async () => {
    const { profile, userId } = get();
    if (!userId) return;

    if (profile?.role === 'client') {
      const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('client_id', userId);
      if (error) { set({ error: error.message }); return; }
      set({ orders: (data ?? []).map(mapOrder) });
    } else {
      const { data, error } = await orderService.getAll();
      if (error) { set({ error: error.message }); return; }
      set({ orders: (data ?? []).map(mapOrder) });
    }
  },

  loadActivities: async () => {
    const { profile, userId } = get();
    if (!userId) return;

    if (profile?.role === 'client') {
      const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
      if (error) { set({ error: error.message }); return; }
      set({ activities: (data ?? []).map(mapActivity) });
    } else {
      const { data, error } = await activityService.getRecent(20);
      if (error) { set({ error: error.message }); return; }
      set({ activities: (data ?? []).map(mapActivity) });
    }
  },

  loadStatistics: async () => {
    const { data, error } = await statisticsService.compute();
    if (error || !data) return;
    set({ statistics: data });
  },

  loadAll: async () => {
    set({ isLoading: true, error: null });
    await get().fetchProfile();
    const currentProfile = get().profile;

    if (currentProfile?.role === 'client') {
      await Promise.all([
        get().loadOrders(),
        get().loadActivities(),
      ]);
    } else {
      await Promise.all([
        get().loadClients(),
        get().loadOrders(),
        get().loadActivities(),
        get().loadCatalog(),
        get().loadStatistics(),
        get().loadProjects(),
      ]);
      await get().reconcileCancelledOrderBalances();
    }
    set({ isLoading: false });
  },

  reconcileCancelledOrderBalances: async () => {
    const { clients, orders, profile } = get();
    if (profile?.role === 'client' || !clients.length) return;
    const patches: { id: string; balance: number }[] = [];
    for (const client of clients) {
      const next = expectedClientBalance(orders, client.id);
      if (Math.abs(next - (client.balance ?? 0)) > 0.009) {
        patches.push({ id: client.id, balance: next });
      }
    }
    if (!patches.length) return;
    await Promise.all(patches.map((p) => clientService.update(p.id, { balance: p.balance })));
    const byId = new Map(patches.map((p) => [p.id, p.balance]));
    set(state => ({
      clients: state.clients.map(c =>
        byId.has(c.id) ? { ...c, balance: byId.get(c.id)! } : c
      ),
    }));
  },

  // ==========================================
  // CLIENTS
  // ==========================================

  addClient: async (clientData) => {
    const userId = get().profile?.id ?? get().userId ?? '';
    const { data, error } = await clientService.create({
      ...clientData,
      photo: isRemotePhoto(clientData.photo) ? clientData.photo : null,
    });
    if (error || !data) { set({ error: error?.message }); return null; }

    let newClient = mapClient(data);
    if (clientData.photo && !isRemotePhoto(clientData.photo)) {
      const photo = await resolveClientPhotoForSave(clientData.photo, userId || newClient.couturierId, newClient.id);
      if (photo) {
        const { data: updated } = await clientService.update(newClient.id, { photo });
        newClient = updated ? mapClient(updated) : { ...newClient, photo };
      }
    }

    set(state => ({ clients: [newClient, ...state.clients] }));

    await activityService.create({
      type: 'new_client',
      title: 'Nouveau client',
      subtitle: newClient.nom,
      clientId: newClient.id,
    });

    get().loadStatistics();
    get().loadActivities();
    return newClient;
  },

  updateClient: async (clientId, updates) => {
    const userId = get().profile?.id ?? get().userId ?? get().clients.find(c => c.id === clientId)?.couturierId ?? '';
    const next: Partial<Client> = { ...updates };
    let photoFailed = false;
    if (updates.photo !== undefined) {
      const resolved = await resolveClientPhotoForSave(updates.photo, userId, clientId);
      if (updates.photo && !resolved) {
        photoFailed = true;
        delete next.photo;
      } else {
        next.photo = resolved;
      }
    }
    const { data, error } = await clientService.update(clientId, next);
    if (error || !data) {
      set({ error: error?.message ?? 'Impossible de modifier le client' });
      return false;
    }

    const mapped = mapClient(data);
    set(state => ({
      clients: state.clients.map(c => (c.id === clientId ? mapped : c)),
      error: photoFailed ? "Fiche enregistrée, mais la photo n'a pas pu être envoyée." : null,
    }));
    return true;
  },

  deleteClient: async (clientId) => {
    const { error } = await clientService.delete(clientId);
    if (error) { set({ error: error.message }); return; }

    set(state => ({
      clients: state.clients.filter(c => c.id !== clientId),
    }));
    get().loadStatistics();
  },

  // ==========================================
  // COMMANDES
  // ==========================================

  addOrder: async (orderData) => {
    const { data, error } = await orderService.create(orderData);
    if (error || !data) { set({ error: error?.message }); return null; }

    const newOrder = mapOrder(data);
    set(state => ({ orders: [newOrder, ...state.orders] }));

    await activityService.create({
      type: 'new_order',
      title: 'Nouvelle commande',
      subtitle: newOrder.clientName,
      clientId: newOrder.clientId,
      orderId: newOrder.id,
    });

    const client = get().getClientById(newOrder.clientId);
    if (client) {
      await clientService.update(newOrder.clientId, {
        balance: client.balance + newOrder.remainingAmount,
      });
      set(state => ({
        clients: state.clients.map(c =>
            c.id === newOrder.clientId
                ? { ...c, balance: c.balance + newOrder.remainingAmount }
                : c
        ),
      }));
    }

    get().loadStatistics();
    get().loadActivities();

    // L'acompte saisi à la création doit exister comme encaissement (sans retraitoucher le solde).
    if (newOrder.advancePayment > 0) {
      try {
        await createPaiementM8({
          orderId: newOrder.id,
          clientId: newOrder.clientId,
          amount: newOrder.advancePayment,
          method: 'cash',
          typePaiement: 'acompte',
          notes: 'Acompte à la commande',
        });
      } catch (_e) { /* l'ordre est déjà créé ; l'encaissement pourra être resaisi */ }
    }

    // Auto-créer une Réalisation liée à cette commande (Module 7)
    try {
      await get().addRealisation(newOrder.clientId, {
        commandeId: newOrder.id,
        statut: 'en_cours' as StatutRealisation,
        photos: [],
        couleur: '',
        accessoires: [],
        dateCreation: new Date().toISOString().split('T')[0],
        dateLivraison: newOrder.deliveryDate instanceof Date
            ? newOrder.deliveryDate.toISOString().split('T')[0]
            : undefined,
        observations: newOrder.description ?? undefined,
      });
    } catch (_e) { /* non critique */ }
    return newOrder;
  },

  updateOrder: async (orderId, updates) => {
    const prev = get().orders.find(o => o.id === orderId);
    const { error } = await orderService.update(orderId, updates);
    if (error) { set({ error: error.message }); return; }

    set(state => ({
      orders: state.orders.map(o =>
          o.id === orderId ? { ...o, ...updates, updatedAt: new Date() } : o
      ),
    }));

    if (prev && isCancelledOrder(updates.orderStatus) && !isCancelledOrder(prev.orderStatus)) {
      await applyOrderCancellationEffects(get, set, prev);
    }

    if (updates.orderStatus === 'completed' || updates.orderStatus === 'delivered') {
      const order = get().orders.find(o => o.id === orderId);
      if (order) {
        await activityService.create({
          type: 'order_completed',
          title: 'Commande terminée',
          subtitle: order.clientName,
          clientId: order.clientId,
          orderId: order.id,
        });
        get().loadActivities();

        // Mettre à jour la réalisation associée au statut 'livree'
        const clientRealisations = get().realisations[order.clientId] || [];
        const associatedRealisation = clientRealisations.find(r => r.commandeId === orderId);
        if (associatedRealisation) {
          await get().updateRealisationStatut(
            associatedRealisation.id,
            order.clientId,
            updates.orderStatus === 'delivered' ? 'livree' : 'terminee'
          );
        }
      }
    }

    get().loadStatistics();
  },


  updateOrderStatut: async (orderId, newStatut, commentaire) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;
    if (isCancelledOrder(order.orderStatus)) return;
    const ancienStatut = String(order.orderStatus);
    const { error } = await orderService.update(orderId, { orderStatus: newStatut as any });
    if (error) { set({ error: error.message }); return; }
    try { await historiqueStatutService.create(orderId, ancienStatut, newStatut, commentaire); } catch (_) {}
    set(state => ({
      orders: state.orders.map(o =>
          o.id === orderId ? { ...o, orderStatus: newStatut as any, updatedAt: new Date() } : o
      ),
    }));
    if (isCancelledOrder(newStatut)) {
      await applyOrderCancellationEffects(get, set, order);
    }
    get().loadStatistics();
  },
  deleteOrder: async (orderId) => {
    const { error } = await orderService.delete(orderId);
    if (error) { set({ error: error.message }); return; }

    set(state => ({
      orders: state.orders.filter(o => o.id !== orderId),
    }));
    get().loadStatistics();
  },

  // ==========================================
  // MESURES
  // ==========================================

  /** Met à jour les mesures localement dans le store */
  setMeasurements: (clientId, measurements) =>
      set(state => ({
        measurements: { ...state.measurements, [clientId]: measurements },
      })),

  /** Charge les mesures d'un client depuis Supabase */
  loadMeasurements: async (clientId: string) => {
    const { data, error } = await measurementService.getByClient(clientId);
    // PGRST116 = aucune ligne trouvée (client sans mesures), ce n'est pas une erreur
    if (error && error.code !== 'PGRST116') {
      set({ error: error.message });
      return;
    }
    if (data) {
      const mapped = mapMeasurements(data as Record<string, unknown>);
      set(state => ({
        measurements: { ...state.measurements, [clientId]: mapped },
      }));
    }
  },

  /** Crée ou met à jour les mesures dans Supabase puis met à jour le store */
  saveMeasurements: async (clientId, data) => {
    const { data: saved, error } = await measurementService.upsert(clientId, data);
    if (error || !saved) {
      set({ error: error?.message ?? 'Erreur lors de l\'enregistrement des mesures' });
      return null;
    }
    const mapped = mapMeasurements(saved as Record<string, unknown>);
    set(state => ({
      measurements: { ...state.measurements, [clientId]: mapped },
    }));
    return mapped;
  },

  // ==========================================
  // FICHES MENSURATION (Module 3)
  // ==========================================

  loadFiches: async (clientId: string) => {
    const { data, error } = await ficheService.getAll(clientId);
    if (error) { set({ error: error.message }); return; }
    const mapped = (data ?? []).map(row => mapFiche(row as Record<string, unknown>));
    set(state => ({ fiches: { ...state.fiches, [clientId]: mapped } }));
  },

  addFiche: async (clientId: string, ficheData: Omit<FicheMensuration, 'id' | 'createdAt' | 'couturierId' | 'clientId'>) => {
    const { data, error } = await ficheService.create(clientId, ficheData);
    if (error || !data) { set({ error: error?.message }); return null; }
    const newFiche = mapFiche(data as Record<string, unknown>);
    set(state => {
      const existing = (state.fiches[clientId] ?? []).map(f =>
          f.typeVetement === newFiche.typeVetement && newFiche.isActive
              ? { ...f, isActive: false } : f
      );
      return { fiches: { ...state.fiches, [clientId]: [newFiche, ...existing] } };
    });
    return newFiche;
  },

  duplicateFiche: async (ficheId: string, clientId: string) => {
    const fiche = get().fiches[clientId]?.find(f => f.id === ficheId);
    if (!fiche) return null;
    const { data, error } = await ficheService.duplicate(fiche);
    if (error || !data) { set({ error: error?.message }); return null; }
    const copy = mapFiche(data as Record<string, unknown>);
    set(state => ({
      fiches: { ...state.fiches, [clientId]: [copy, ...(state.fiches[clientId] ?? [])] },
    }));
    return copy;
  },

  setFicheActive: async (ficheId: string, clientId: string, typeVetement: TypeVetement) => {
    const { error } = await ficheService.setActive(ficheId, clientId, typeVetement);
    if (error) { set({ error: error.message }); return; }
    set(state => ({
      fiches: {
        ...state.fiches,
        [clientId]: (state.fiches[clientId] ?? []).map(f =>
            f.typeVetement === typeVetement
                ? { ...f, isActive: f.id === ficheId }
                : f
        ),
      },
    }));
  },

  deleteFiche: async (ficheId: string, clientId: string) => {
    const { error } = await ficheService.delete(ficheId);
    if (error) { set({ error: error.message }); return; }
    set(state => ({
      fiches: {
        ...state.fiches,
        [clientId]: (state.fiches[clientId] ?? []).filter(f => f.id !== ficheId),
      },
    }));
  },

  getFichesByType: (clientId: string, type: TypeVetement) =>
      get().fiches[clientId]?.filter(f => f.typeVetement === type) ?? [],

  getActiveFiche: (clientId: string, type: TypeVetement) =>
      get().fiches[clientId]?.find(f => f.typeVetement === type && f.isActive),

  getFicheById: (ficheId: string, clientId: string) =>
      get().fiches[clientId]?.find(f => f.id === ficheId),

  // ==========================================
  // RÉALISATIONS (Module 5)
  // ==========================================

  loadRealisations: async (clientId: string) => {
    const { data, error } = await realisationService.getAll(clientId);
    if (error) { set({ error: (error as any).message }); return; }
    const mapped = (data ?? []).map((row: any) => mapRealisation(row));
    set(state => ({ realisations: { ...state.realisations, [clientId]: mapped } }));
  },

  loadAllRealisations: async () => {
    const { data, error } = await realisationService.getAllForCouturier();
    if (error) { set({ error: (error as any).message }); return; }
    const grouped: Record<string, ReturnType<typeof mapRealisation>[]> = {};
    for (const row of data ?? []) {
      const mapped = mapRealisation(row);
      (grouped[mapped.clientId] ??= []).push(mapped);
    }
    set({ realisations: grouped });
  },

  addRealisation: async (clientId, realisationData, localPhotoUris = []) => {
    const couturierId = get().userId ?? '';
    // Upload local photos to Supabase Storage first
    const uploadedUrls: string[] = [];
    for (const uri of localPhotoUris) {
      // Placeholder id for path — will be replaced with real id after insert
      const { publicUrl } = await uploadRealisationPhoto(uri, couturierId, 'tmp');
      if (publicUrl) uploadedUrls.push(publicUrl);
    }
    const { data, error } = await realisationService.create(clientId, {
      ...realisationData,
      photos: uploadedUrls,
    });
    if (error || !data) { set({ error: (error as any)?.message }); return null; }
    const created = mapRealisation(data as any);

    // Re-upload with real id for clean paths (best-effort)
    if (localPhotoUris.length > 0) {
      const finalUrls: string[] = [];
      for (const uri of localPhotoUris) {
        const { publicUrl } = await uploadRealisationPhoto(uri, couturierId, created.id);
        if (publicUrl) finalUrls.push(publicUrl);
      }
      if (finalUrls.length > 0) {
        const { data: updated } = await realisationService.update(created.id, { photos: finalUrls });
        if (updated) {
          const final = mapRealisation(updated as any);
          set(state => ({
            realisations: {
              ...state.realisations,
              [clientId]: [final, ...(state.realisations[clientId] ?? [])],
            },
          }));
          return final;
        }
      }
    }

    set(state => ({
      realisations: {
        ...state.realisations,
        [clientId]: [created, ...(state.realisations[clientId] ?? [])],
      },
    }));
    return created;
  },

  updateRealisation: async (realisationId, clientId, data) => {
    const { data: updated, error } = await realisationService.update(realisationId, data);
    if (error || !updated) { set({ error: (error as any)?.message }); return; }
    const mapped = mapRealisation(updated as any);
    set(state => ({
      realisations: {
        ...state.realisations,
        [clientId]: (state.realisations[clientId] ?? []).map(r =>
            r.id === realisationId ? mapped : r
        ),
      },
    }));
  },

  updateRealisationStatut: async (realisationId, clientId, statut) => {
    const { data: updated, error } = await realisationService.updateStatut(realisationId, statut);
    if (error || !updated) { set({ error: (error as any)?.message }); return; }
    const mapped = mapRealisation(updated as any);
    set(state => ({
      realisations: {
        ...state.realisations,
        [clientId]: (state.realisations[clientId] ?? []).map(r =>
            r.id === realisationId ? mapped : r
        ),
      },
    }));
  },

  deleteRealisation: async (realisationId, clientId) => {
    const { error } = await realisationService.delete(realisationId);
    if (error) { set({ error: (error as any).message }); return; }
    set(state => ({
      realisations: {
        ...state.realisations,
        [clientId]: (state.realisations[clientId] ?? []).filter(r => r.id !== realisationId),
      },
    }));
  },

  addRealisationPhoto: async (realisationId, clientId, localUri) => {
    const couturierId = get().userId ?? '';
    const { publicUrl, error } = await uploadRealisationPhoto(localUri, couturierId, realisationId);
    if (error || !publicUrl) { set({ error: error?.message ?? "Impossible d'envoyer la photo." }); return false; }
    const { data: updated } = await realisationService.addPhoto(realisationId, publicUrl);
    if (!updated) return false;
    const mapped = mapRealisation(updated as any);
    set(state => ({
      realisations: {
        ...state.realisations,
        [clientId]: (state.realisations[clientId] ?? []).map(r =>
            r.id === realisationId ? mapped : r
        ),
      },
    }));
    return true;
  },

  getRealisationById: (realisationId, clientId) =>
      get().realisations[clientId]?.find(r => r.id === realisationId),

  getRealisationsByCommande: (commandeId, clientId) =>
      get().realisations[clientId]?.filter(r => r.commandeId === commandeId) ?? [],

  getRealisationsByTissu: (tissuId: string) => {
    const all = get().realisations;
    return Object.values(all).flat().filter(r => r.tissuId === tissuId);
  },

  // ==========================================
  // TISSUS (Module 6)
  // ==========================================

  loadTissus: async () => {
    const { data, error } = await tissuService.getAll();
    if (error) { set({ error: (error as any).message }); return; }
    set({ tissus: (data ?? []).map((row: any) => mapTissu(row)) });
  },

  addTissu: async (tissuData, localPhotoUri) => {
    const couturierId = get().userId ?? '';
    let photoUrl: string | undefined;
    if (localPhotoUri) {
      const { publicUrl } = await uploadTissuPhoto(localPhotoUri, couturierId, 'tmp');
      if (publicUrl) photoUrl = publicUrl;
    }
    const { data, error } = await tissuService.create({ ...tissuData, photo: photoUrl });
    if (error || !data) { set({ error: (error as any)?.message }); return null; }
    const created = mapTissu(data as any);
    // Re-upload with real id
    if (localPhotoUri) {
      const { publicUrl } = await uploadTissuPhoto(localPhotoUri, couturierId, created.id);
      if (publicUrl) {
        const { data: updated } = await tissuService.update(created.id, { photo: publicUrl });
        if (updated) {
          const final = mapTissu(updated as any);
          set(state => ({ tissus: [final, ...state.tissus] }));
          return final;
        }
      }
    }
    set(state => ({ tissus: [created, ...state.tissus] }));
    return created;
  },

  updateTissu: async (tissuId, data, newLocalPhotoUri) => {
    const couturierId = get().userId ?? '';
    let photoUrl = data.photo;
    if (newLocalPhotoUri) {
      const { publicUrl } = await uploadTissuPhoto(newLocalPhotoUri, couturierId, tissuId);
      if (publicUrl) photoUrl = publicUrl;
    }
    const { data: updated, error } = await tissuService.update(tissuId, { ...data, photo: photoUrl });
    if (error || !updated) { set({ error: (error as any)?.message }); return; }
    const mapped = mapTissu(updated as any);
    set(state => ({ tissus: state.tissus.map(t => t.id === tissuId ? mapped : t) }));
  },

  deleteTissu: async (tissuId) => {
    const { error } = await tissuService.delete(tissuId);
    if (error) { set({ error: (error as any).message }); return; }
    set(state => ({ tissus: state.tissus.filter(t => t.id !== tissuId) }));
  },

  getTissuById: (tissuId) => get().tissus.find(t => t.id === tissuId),
  getTissusByType: (type) => get().tissus.filter(t => t.typeTissu === type),
  getTissusByFournisseur: (fournisseur) =>
      get().tissus.filter(t => t.fournisseur?.toLowerCase() === fournisseur.toLowerCase()),

  // ==========================================
  // PAIEMENTS
  // ==========================================

  /*addPayment: (clientId, payment) =>
      set(state => ({
        payments: {
          ...state.payments,
          [clientId]: [...(state.payments[clientId] ?? []), payment],
        },
      })),*/
  addPayment: async ({ orderId, projectId, clientId, amount, method, typePaiement, notes }) => {
    if (orderId) {
      const existing = get().orders.find(o => o.id === orderId);
      if (existing && isCancelledOrder(existing.orderStatus)) {
        set({ error: 'Impossible d’encaisser une commande annulée.' });
        return null;
      }
    }
    // 1. Persiste dans Supabase (order_id et/ou project_id)
    const { data, error } = await paymentService.create({
      orderId,
      projectId,
      clientId,
      amount,
      method,
      notes,
      typePaiement,
    });

    if (error || !data) {
      set({ error: error?.message ?? 'Erreur lors de l\'enregistrement du paiement' });
      return null;
    }

    const newPayment: Payment = {
      id:            data.id,
      orderId,
      projectId,
      clientId,
      amount,
      method,
      notes,
      date:          new Date(data.payment_date ?? data.date ?? data.created_at),
      createdAt:     new Date(data.created_at),
      updatedAt:     new Date(data.created_at),
    };

    // 2. Met à jour le store local
    if (orderId) {
      set(state => ({
        payments: {
          ...state.payments,
          [orderId]: [...(state.payments[orderId] ?? []), newPayment],
        },
      }));

      // 3. Recalcule remaining_amount et payment_status de la commande (uniquement si liée à un vêtement précis)
      const order = get().orders.find(o => o.id === orderId);
      if (order) {
        const newRemaining = Math.max(0, order.remainingAmount - amount);
        const newPayStatus =
            newRemaining <= 0 ? 'paid' :
                newRemaining < order.totalPrice ? 'partial' :
                    'unpaid';

        await get().updateOrder(orderId, {
          remainingAmount: newRemaining,
          paymentStatus:   newPayStatus,
        });

        await activityService.create({
          type:     'payment_received',
          title:    'Paiement reçu',
          subtitle: order.clientName,
          amount,
          clientId,
          orderId,
        });
      }
    } else if (projectId) {
      // Avance globale : répartie également entre les commandes actives du projet
      const allocations = splitGlobalAdvance(get().getOrdersByProject(projectId), amount);
      for (const { id, applied } of allocations) {
        const order = get().orders.find(o => o.id === id);
        if (!order || applied <= 0) continue;
        const newRemaining = Math.max(0, (order.remainingAmount ?? 0) - applied);
        const newPayStatus =
            newRemaining <= 0 ? 'paid' :
                newRemaining < order.totalPrice ? 'partial' :
                    'unpaid';
        const newAdvance = Math.min(order.totalPrice, (order.advancePayment ?? 0) + applied);
        await get().updateOrder(id, {
          remainingAmount: newRemaining,
          paymentStatus: newPayStatus,
          advancePayment: newAdvance,
        });
        const garmentClient = get().getClientById(order.clientId);
        if (garmentClient) {
          const nextBal = Math.max(0, (garmentClient.balance ?? 0) - applied);
          await clientService.update(order.clientId, { balance: nextBal });
          set(state => ({
            clients: state.clients.map(c =>
              c.id === order.clientId ? { ...c, balance: nextBal } : c
            ),
          }));
        }
      }
      await activityService.create({
        type:     'payment_received',
        title:    'Paiement reçu (projet)',
        subtitle: get().getProjectById(projectId)?.nom,
        amount,
        clientId,
      });
    } else {
      await activityService.create({
        type:     'payment_received',
        title:    'Paiement reçu (projet)',
        subtitle: get().getProjectById(projectId!)?.nom,
        amount,
        clientId,
      });
    }

    // 4. Solde du payeur : seulement pour un encaissement sur une commande précise.
    // L’avance globale a déjà été déduite des personnes du projet.
    if (orderId) {
      const client = get().getClientById(clientId);
      if (client) {
        await clientService.update(clientId, {
          balance: Math.max(0, client.balance - amount),
        });
        set(state => ({
          clients: state.clients.map(c =>
              c.id === clientId
                  ? { ...c, balance: Math.max(0, c.balance - amount) }
                  : c
          ),
        }));
      }
    }

    // 5. Rafraîchit le récap projet si concerné
    if (projectId) {
      get().loadProjectRecap(projectId);
    }

    get().loadStatistics();
    get().loadActivities();

    return newPayment;
  },

  loadPaymentsForOrder: async (orderId: string) => {
    const { data, error } = await paymentService.getByOrder(orderId);
    if (error || !data) return;

    const mapped: Payment[] = (data as any[]).map(p => ({
      id:        p.id,
      orderId:   p.order_id,
      clientId:  '', // non stocké dans payments table, à compléter si besoin
      amount:    Number(p.amount),
      method:    p.payment_method,
      notes:     p.notes ?? undefined,
      date:      new Date(p.payment_date),
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.created_at),
    }));

    set(state => ({
      payments: { ...state.payments, [orderId]: mapped },
    }));
  },

  // ==========================================
  // PROJETS / COMMANDES GROUPÉES (Module 13)
  // ==========================================

  loadProjects: async () => {
    const { data, error } = await projectService.getAll();
    if (error) { set({ error: error.message }); return; }
    set({ projects: (data ?? []).map(row => mapProject(row)) });

    // Charge aussi les récaps en une fois (compteurs/totaux pour la liste)
    const { data: recaps } = await projectService.getAllRecaps();
    if (recaps) {
      const byId: Record<string, ProjectRecap> = {};
      for (const row of recaps as any[]) {
        const recap = mapProjectRecap(row);
        byId[recap.projectId] = recap;
      }
      set(state => ({ projectRecaps: { ...state.projectRecaps, ...byId } }));
    }
  },

  loadProjectRecap: async (projectId: string) => {
    const { data, error } = await projectService.getRecap(projectId);
    if (error || !data) return;
    const recap = mapProjectRecap(data);
    set(state => ({ projectRecaps: { ...state.projectRecaps, [projectId]: recap } }));
  },

  addProject: async (data) => {
    const { data: row, error } = await projectService.create(data);
    if (error || !row) { set({ error: error?.message }); return null; }
    const newProject = mapProject(row);
    set(state => ({ projects: [newProject, ...state.projects] }));
    return newProject;
  },

  updateProject: async (projectId, updates) => {
    const { error } = await projectService.update(projectId, updates);
    if (error) { set({ error: error.message }); return; }
    set(state => ({
      projects: state.projects.map(p =>
          p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }));
    get().loadProjectRecap(projectId);
  },

  updateProjectStatut: async (projectId, statut) => {
    await get().updateProject(projectId, { statut });
  },

  deleteProject: async (projectId) => {
    const { error } = await projectService.delete(projectId);
    if (error) { set({ error: error.message }); return; }
    set(state => ({ projects: state.projects.filter(p => p.id !== projectId) }));
  },

  getProjectById: (projectId) => get().projects.find(p => p.id === projectId),

  loadParticipants: async (projectId: string) => {
    const { data, error } = await participantService.getByProject(projectId);
    if (error) { set({ error: error.message }); return; }
    const mapped = (data ?? []).map(row => mapParticipant(row));
    set(state => ({ participants: { ...state.participants, [projectId]: mapped } }));
  },

  addParticipant: async (data) => {
    const { data: row, error } = await participantService.create(data);
    if (error || !row) { set({ error: error?.message }); return null; }
    const newParticipant = mapParticipant(row);
    set(state => ({
      participants: {
        ...state.participants,
        [data.projectId]: [...(state.participants[data.projectId] ?? []), newParticipant],
      },
    }));
    get().loadProjectRecap(data.projectId);
    return newParticipant;
  },

  updateParticipant: async (participantId, projectId, updates) => {
    const { error } = await participantService.update(participantId, updates);
    if (error) { set({ error: error.message }); return; }
    set(state => ({
      participants: {
        ...state.participants,
        [projectId]: (state.participants[projectId] ?? []).map(p =>
            p.id === participantId ? { ...p, ...updates } : p
        ),
      },
    }));
  },

  promoteParticipant: async (participantId, projectId, clientData) => {
    const { data, error } = await participantService.promoteToClient(participantId, clientData);
    if (error || !data) { set({ error: error?.message }); return; }
    const updated = mapParticipant(data);
    set(state => ({
      participants: {
        ...state.participants,
        [projectId]: (state.participants[projectId] ?? []).map(p =>
            p.id === participantId ? updated : p
        ),
      },
    }));
    // Le nouveau client n'est pas encore dans `clients` localement : recharge la liste
    get().loadClients();
  },

  deleteParticipant: async (participantId, projectId) => {
    const { error } = await participantService.delete(participantId);
    if (error) { set({ error: error.message }); return; }
    set(state => ({
      participants: {
        ...state.participants,
        [projectId]: (state.participants[projectId] ?? []).filter(p => p.id !== participantId),
      },
    }));
    get().loadProjectRecap(projectId);
  },

  getParticipantsByProject: (projectId) => get().participants[projectId] ?? [],

  addGarmentToParticipant: async (projectId, participantId, garmentData) => {
    const newOrder = await get().addOrder({
      ...garmentData,
      projectId,
      participantId,
    });
    if (newOrder) get().loadProjectRecap(projectId);
    return newOrder;
  },

  getOrdersByProject: (projectId) => get().orders.filter(o => o.projectId === projectId),

  getOrdersByParticipant: (participantId) => get().orders.filter(o => o.participantId === participantId),

  applyMeasurementChoice: async (orderId, clientId, typeVetement, choice) => {
    const { data, error } = await ficheService.createForOrder({
      clientId,
      orderId,
      typeVetement,
      sourceFicheId: choice.mode === 'use_existing' ? choice.sourceFicheId : undefined,
      mesures:       choice.mode === 'new_measurements' ? choice.mesures : undefined,
      unite:         choice.unite,
    });
    if (error || !data) { set({ error: error?.message }); return null; }
    const fiche = mapFiche(data as Record<string, unknown>);

    // Reflète la fiche liée sur la commande localement
    set(state => ({
      orders: state.orders.map(o =>
          o.id === orderId ? { ...o, ficheMensurationId: fiche.id } : o
      ),
      fiches: {
        ...state.fiches,
        [clientId]: choice.mode === 'new_measurements'
            ? [fiche, ...(state.fiches[clientId] ?? [])]
            : (state.fiches[clientId] ?? []), // copie figée : n'entre pas dans la bibliothèque affichée
      },
    }));
    return fiche;
  },

  loadMeasurementFields: async (typeVetement: TypeVetement) => {
    const { data, error } = await measurementFieldService.getForType(typeVetement);
    if (error) { set({ error: error.message }); return; }
    const mapped = (data ?? []).map(row => mapMeasurementField(row));
    set(state => ({ measurementFields: { ...state.measurementFields, [typeVetement]: mapped } }));
  },

  getMeasurementFields: (typeVetement) => get().measurementFields[typeVetement] ?? [],

  // ==========================================
  // CATALOG (local)
  // ==========================================

  loadCatalog: async () => {
    const { data, error } = await catalogService.getAll();
    if (error) { set({ error: error.message }); return; }
    set({ catalog: (data ?? []).map(mapCatalogModel) });
  },

  /*addCatalogModel: async (modelData) => {
    const { data, error } = await catalogService.create(modelData);
    if (error || !data) { set({ error: error?.message }); return null; }
    const newModel = mapCatalogModel(data);
    set((state: any) => ({ catalog: [newModel, ...state.catalog] }));
    return newModel;
  },*/

  addCatalogModel: async (modelData) => {
    const { data, error } = await catalogService.create(modelData);
    if (error || !data) {
      console.error('❌ Erreur création catalogue:', JSON.stringify(error, null, 2)); // ← ajoute cette ligne
      set({ error: error?.message });
      return null;
    }
    const newModel = mapCatalogModel(data);
    set((state: any) => ({ catalog: [newModel, ...state.catalog] }));
    return newModel;
  },

  updateCatalogModel: async (modelId: string, updates: Partial<CatalogModel>) => {
    const { error } = await catalogService.update(modelId, updates);
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    set((state: any) => ({
      catalog: state.catalog.map((m: CatalogModel) =>
          m.id === modelId ? { ...m, ...updates } : m
      ),
    }));
  },

  deleteCatalogModel: async (modelId: string) => {
    const { error } = await catalogService.archive(modelId);
    if (error) { set({ error: error.message }); return; }
    set((state: any) => ({
      catalog: state.catalog.filter((m: CatalogModel) => m.id !== modelId),
    }));
  },

  archiveCatalogModel: async (modelId: string) => {
    const { error } = await catalogService.archive(modelId);
    if (error) { set({ error: error.message }); return; }
    set((state: any) => ({
      catalog: state.catalog.filter((m: CatalogModel) => m.id !== modelId),
    }));
  },

  duplicateCatalogModel: async (modelId: string) => {
    const model = get().catalog.find((m: CatalogModel) => m.id === modelId);
    if (!model) return null;
    const { data, error } = await catalogService.duplicate(model);
    if (error || !data) { set({ error: error?.message }); return null; }
    const newModel = mapCatalogModel(data);
    set((state: any) => ({ catalog: [newModel, ...state.catalog] }));
    return newModel;
  },

  toggleCatalogFavorite: async (modelId: string) => {
    const model = get().catalog.find((m: CatalogModel) => m.id === modelId);
    if (!model) return;
    const newFav = !model.isFavorite;
    set((state: any) => ({
      catalog: state.catalog.map((m: CatalogModel) =>
          m.id === modelId ? { ...m, isFavorite: newFav } : m
      ),
    }));
    await catalogService.update(modelId, { isFavorite: newFav });
  },

  toggleCatalogStatut: async (modelId: string) => {
    const model = get().catalog.find((m: CatalogModel) => m.id === modelId);
    if (!model) return;
    const newStatut: 'public' | 'prive' = model.statut === 'public' ? 'prive' : 'public';
    set((state: any) => ({
      catalog: state.catalog.map((m: CatalogModel) =>
          m.id === modelId ? { ...m, statut: newStatut } : m
      ),
    }));
    await catalogService.update(modelId, { statut: newStatut });
  },
  // ==========================================
  // UI
  // ==========================================

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setClientFilter: (filter) => set({ selectedClientFilter: filter }),
  setCatalogCategory: (category) => set({ selectedCatalogCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ==========================================
  // HELPERS
  // ==========================================

  getClientById: (clientId) =>
      get().clients.find(c => c.id === clientId),

  getOrdersByClient: (clientId) =>
      get().orders.filter(o => o.clientId === clientId),

  getMeasurementsByClient: (clientId) =>
      get().measurements[clientId],

  getPaymentsByClient: (clientId) =>
      Object.values(get().payments).flat().filter(p => p.clientId === clientId),
  getModelById: (modelId) =>
      get().catalog.find(m => m.id === modelId),
}));