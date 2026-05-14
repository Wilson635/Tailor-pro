// ==========================================
// STORE PRINCIPAL - TailorPro (Supabase)
// ==========================================

import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import {
  clientService, orderService, activityService,
  statisticsService, mapClient, mapOrder, mapActivity,
} from '@services/supabaseService';
import type { Client, Order, Measurements, Payment, CatalogModel, Activity, Statistics } from '../types';

// ==========================================
// TYPE PROFIL
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  atelier_name: string | null;
  phone: string | null;
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
  activities: Activity[];
  statistics: Statistics;
  measurements: Record<string, Measurements>;
  payments: Record<string, Payment[]>;

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

  // ── Actions Data (Supabase) ──
  loadClients: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadActivities: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  loadAll: () => Promise<void>;

  // ── Actions Clients (locales + sync) ──
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client | null>;
  updateClient: (clientId: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;

  // ── Actions Orders (locales + sync) ──
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order | null>;
  updateOrder: (orderId: string, data: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // ── Actions Measurements ──
  setMeasurements: (clientId: string, measurements: Measurements) => void;

  // ── Actions Payments ──
  addPayment: (clientId: string, payment: Payment) => void;

  // ── Actions Catalog (local uniquement pour l'instant) ──
  setCatalog: (catalog: CatalogModel[]) => void;
  addCatalogModel: (model: CatalogModel) => void;
  updateCatalogModel: (modelId: string, data: Partial<CatalogModel>) => void;
  deleteCatalogModel: (modelId: string) => void;
  toggleCatalogFavorite: (modelId: string) => void;

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
  payments: {},

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
    });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, atelier_name, phone')
        .eq('id', user.id)
        .single();

    if (!error && data) {
      set({ profile: data, userId: user.id, isAuthenticated: true });
    }
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
    const { data, error } = await orderService.getAll();
    if (error) { set({ error: error.message }); return; }
    set({ orders: (data ?? []).map(mapOrder) });
  },

  loadActivities: async () => {
    const { data, error } = await activityService.getRecent(20);
    if (error) { set({ error: error.message }); return; }
    set({ activities: (data ?? []).map(mapActivity) });
  },

  loadStatistics: async () => {
    const { data, error } = await statisticsService.compute();
    if (error || !data) return;
    set({ statistics: data });
  },

  /** Charge tout en parallèle au démarrage */
  loadAll: async () => {
    set({ isLoading: true, error: null });
    await Promise.all([
      get().fetchProfile(),
      get().loadClients(),
      get().loadOrders(),
      get().loadActivities(),
      get().loadStatistics(),
    ]);
    set({ isLoading: false });
  },

  // ==========================================
  // CLIENTS
  // ==========================================

  addClient: async (clientData) => {
    const { data, error } = await clientService.create(clientData);
    if (error || !data) { set({ error: error?.message }); return null; }

    const newClient = mapClient(data);

    // Mise à jour optimiste du store
    set(state => ({ clients: [newClient, ...state.clients] }));

    // Créer une activité
    await activityService.create({
      type: 'new_client',
      title: 'Nouveau client',
      subtitle: newClient.fullName,
      clientId: newClient.id,
    });

    // Rafraîchir les stats
    get().loadStatistics();
    get().loadActivities();

    return newClient;
  },

  updateClient: async (clientId, updates) => {
    const { error } = await clientService.update(clientId, updates);
    if (error) { set({ error: error.message }); return; }

    set(state => ({
      clients: state.clients.map(c =>
          c.id === clientId ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    }));
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

    // Créer une activité
    await activityService.create({
      type: 'new_order',
      title: 'Nouvelle commande',
      subtitle: newOrder.clientName,
      clientId: newOrder.clientId,
      orderId: newOrder.id,
    });

    // Mettre à jour le solde client
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

    return newOrder;
  },

  updateOrder: async (orderId, updates) => {
    const { error } = await orderService.update(orderId, updates);
    if (error) { set({ error: error.message }); return; }

    set(state => ({
      orders: state.orders.map(o =>
          o.id === orderId ? { ...o, ...updates, updatedAt: new Date() } : o
      ),
    }));

    // Si la commande est marquée comme terminée → créer une activité
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
      }
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
  // MEASUREMENTS & PAYMENTS (locaux)
  // ==========================================

  setMeasurements: (clientId, measurements) =>
      set(state => ({
        measurements: { ...state.measurements, [clientId]: measurements },
      })),

  addPayment: (clientId, payment) =>
      set(state => ({
        payments: {
          ...state.payments,
          [clientId]: [...(state.payments[clientId] ?? []), payment],
        },
      })),

  // ==========================================
  // CATALOG (local)
  // ==========================================

  setCatalog: (catalog) => set({ catalog }),
  addCatalogModel: (model) =>
      set(state => ({ catalog: [model, ...state.catalog] })),
  updateCatalogModel: (modelId, data) =>
      set(state => ({
        catalog: state.catalog.map(m => m.id === modelId ? { ...m, ...data } : m),
      })),
  deleteCatalogModel: (modelId) =>
      set(state => ({
        catalog: state.catalog.filter(m => m.id !== modelId),
      })),
  toggleCatalogFavorite: (modelId) =>
      set(state => ({
        catalog: state.catalog.map(m =>
            m.id === modelId ? { ...m, isFavorite: !m.isFavorite } : m
        ),
      })),

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
      get().payments[clientId] ?? [],
}));


/***************


// ==========================================
// STORE PRINCIPAL - TailorPro
// ==========================================

import { create } from 'zustand';
import type { Client, Order, Measurements, Payment, CatalogModel, Activity, Statistics } from '../types';
import {supabase} from "@/src/lib/supabase";

// ==========================================
// MOCK DATA POUR LE DÉVELOPPEMENT
// ==========================================

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    fullName: 'Aminata Diallo',
    phone: '+225 07 12 34 56 78',
    neighborhood: 'Cocody, Angré',
    gender: 'female',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
    isFavorite: true,
    balance: 0,
    createdAt: new Date('2023-03-12'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: '2',
    fullName: 'Koffi Yao',
    phone: '+225 05 56 78 90 12',
    neighborhood: 'Yopougon, Maroc',
    gender: 'male',
    isFavorite: false,
    balance: 50000,
    createdAt: new Date('2023-06-20'),
    updatedAt: new Date('2024-05-10'),
  },
  {
    id: '3',
    fullName: 'Mariama Koné',
    phone: '+225 07 89 01 23 45',
    neighborhood: 'Abobo, Avocatier',
    gender: 'female',
    isFavorite: true,
    balance: 80000,
    createdAt: new Date('2023-09-15'),
    updatedAt: new Date('2024-05-12'),
  },
  {
    id: '4',
    fullName: 'Bamba Traoré',
    phone: '+225 01 02 03 04 05',
    neighborhood: 'Treichville, Zone 3',
    gender: 'male',
    isFavorite: false,
    balance: 0,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-05-14'),
  },
  {
    id: '5',
    fullName: 'Fatoumata Barry',
    phone: '+225 07 67 89 10 11',
    neighborhood: 'Plateau, Dokui',
    gender: 'female',
    isFavorite: false,
    balance: 30000,
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-05-08'),
  },
];

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Aminata Diallo',
    clothingType: 'robe_longue',
    description: 'Robe longue avec manches bouffantes. Couleur rose poudré.',
    fabricPhotos: [],
    inspirationPhotos: [],
    deliveryDate: new Date('2024-05-25'),
    urgencyLevel: 'medium',
    totalPrice: 120000,
    advancePayment: 70000,
    remainingAmount: 50000,
    paymentStatus: 'partial',
    orderStatus: 'in_progress',
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Koffi Yao',
    clothingType: 'costume',
    description: 'Costume trois pièces pour mariage',
    fabricPhotos: [],
    inspirationPhotos: [],
    deliveryDate: new Date('2024-06-01'),
    urgencyLevel: 'high',
    totalPrice: 250000,
    advancePayment: 150000,
    remainingAmount: 100000,
    paymentStatus: 'partial',
    orderStatus: 'in_progress',
    createdAt: new Date('2024-05-08'),
    updatedAt: new Date('2024-05-12'),
  },
];

const MOCK_MEASUREMENTS: Record<string, Measurements> = {
  '1': {
    id: 'm1',
    clientId: '1',
    recordedAt: new Date('2024-05-15'),
    chestCircumference: 88,
    waistCircumference: 70,
    hipCircumference: 96,
    backWidth: 38,
    shoulderWidth: 12,
    sleeveLength: 58,
    armCircumference: 30,
    neckCircumference: 38,
    dressLength: 135,
    bustHeight: 45,
    thighCircumference: 56,
  },
};

const MOCK_CATALOG: CatalogModel[] = [
  {
    id: '1',
    name: 'Robe princesse',
    category: 'robes',
    price: 25000,
    description: 'Robe princesse en tissu damassé avec broderie et manches bouffantes.',
    photos: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'],
    isFavorite: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Boubou homme',
    category: 'traditionnel',
    price: 30000,
    description: 'Boubou traditionnel africain pour homme',
    photos: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'],
    isFavorite: false,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Robe longue',
    category: 'robes',
    price: 28000,
    description: 'Robe longue élégante',
    photos: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400'],
    isFavorite: false,
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: 'Ensemble 2 pièces',
    category: 'casual',
    price: 22000,
    description: 'Ensemble haut et jupe assorti',
    photos: ['https://images.unsplash.com/photo-1551803091-e20673f15770?w=400'],
    isFavorite: true,
    createdAt: new Date('2024-04-05'),
  },
];

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'new_order',
    title: 'Nouvelle commande',
    subtitle: 'Aminata Diallo',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
    clientId: '1',
    orderId: '1',
  },
  {
    id: '2',
    type: 'payment_received',
    title: 'Paiement reçu',
    subtitle: 'Koffi Yao',
    amount: 50000,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4h
    clientId: '2',
  },
  {
    id: '3',
    type: 'order_completed',
    title: 'Commande terminée',
    subtitle: 'Mariama Koné',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6h
    clientId: '3',
  },
];

const MOCK_STATISTICS: Statistics = {
  totalClients: 124,
  monthlyRevenue: 1250000,
  revenueGrowth: 18,
  ordersInProgress: 18,
  unpaidInvoices: 7,
  unpaidAmount: 520000,
  completedOrders: 36,
  totalExpenses: 320000,
  netProfit: 930000,
};

const MOCK_PAYMENTS: Record<string, Payment[]> = {
  '1': [
    {
      id: 'p1',
      orderId: '1',
      clientId: '1',
      amount: 50000,
      date: new Date('2024-05-15'),
      method: 'cash',
    },
    {
      id: 'p2',
      orderId: '1',
      clientId: '1',
      amount: 20000,
      date: new Date('2024-05-02'),
      method: 'mobile_money',
    },
  ],
};

// ==========================================
// TYPES DU STORE
// ==========================================

// ── Nouveau type profil ──
interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  atelier_name: string | null;
  phone: string | null;
}

interface AppState {
  // User
  isAuthenticated: boolean;
  userId: string | null;
  profile: UserProfile | null;

  // Données
  clients: Client[];
  orders: Order[];
  catalog: CatalogModel[];
  activities: Activity[];
  statistics: Statistics;
  measurements: Record<string, Measurements>;
  payments: Record<string, Payment[]>;

  // UI State
  isLoading: boolean;
  error: string | null;
  selectedClientFilter: 'all' | 'recent' | 'favorite';
  selectedCatalogCategory: string;
  searchQuery: string;

  // Actions - Auth
  setAuthenticated: (status: boolean, userId?: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;

  // Actions - Clients
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (clientId: string, data: Partial<Client>) => void;
  deleteClient: (clientId: string) => void;

  // Actions - Orders
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, data: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;

  // Actions - Measurements
  setMeasurements: (clientId: string, measurements: Measurements) => void;

  // Actions - Payments
  addPayment: (clientId: string, payment: Payment) => void;

  // Actions - Catalog
  setCatalog: (catalog: CatalogModel[]) => void;
  addCatalogModel: (model: CatalogModel) => void;
  updateCatalogModel: (modelId: string, data: Partial<CatalogModel>) => void;
  deleteCatalogModel: (modelId: string) => void;
  toggleCatalogFavorite: (modelId: string) => void;

  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setClientFilter: (filter: 'all' | 'recent' | 'favorite') => void;
  setCatalogCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;

  // Helpers
  getClientById: (clientId: string) => Client | undefined;
  getOrdersByClient: (clientId: string) => Order[];
  getMeasurementsByClient: (clientId: string) => Measurements | undefined;
  getPaymentsByClient: (clientId: string) => Payment[];
}

// ==========================================
// STORE
// ==========================================

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  isAuthenticated: true, // Pour le dev, on simule un utilisateur connecté
  userId: 'mock-user-id',
  profile: null,

  clients: MOCK_CLIENTS,
  orders: MOCK_ORDERS,
  catalog: MOCK_CATALOG,
  activities: MOCK_ACTIVITIES,
  statistics: MOCK_STATISTICS,
  measurements: MOCK_MEASUREMENTS,
  payments: MOCK_PAYMENTS,

  isLoading: false,
  error: null,
  selectedClientFilter: 'all',
  selectedCatalogCategory: 'all',
  searchQuery: '',

  // Auth Actions
  setAuthenticated: (status, userId) =>
      set({ isAuthenticated: status, userId: userId || null }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, userId: null, profile: null });
  },

  //  Nouvelle action fetchProfile
  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, atelier_name, phone')
        .eq('id', user.id)
        .single();

    if (!error && data) {
      set({ profile: data, userId: user.id, isAuthenticated: true });
    }
  },

  // Client Actions
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
  updateClient: (clientId, data) => set((state) => ({
    clients: state.clients.map((c) => c.id === clientId ? { ...c, ...data, updatedAt: new Date() } : c),
  })),
  deleteClient: (clientId) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== clientId),
  })),

  // Order Actions
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (orderId, data) => set((state) => ({
    orders: state.orders.map((o) => o.id === orderId ? { ...o, ...data, updatedAt: new Date() } : o),
  })),
  deleteOrder: (orderId) => set((state) => ({
    orders: state.orders.filter((o) => o.id !== orderId),
  })),

  // Measurements Actions
  setMeasurements: (clientId, measurements) => set((state) => ({
    measurements: { ...state.measurements, [clientId]: measurements },
  })),

  // Payment Actions
  addPayment: (clientId, payment) => set((state) => ({
    payments: {
      ...state.payments,
      [clientId]: [...(state.payments[clientId] || []), payment],
    },
  })),

  // Catalog Actions
  setCatalog: (catalog) => set({ catalog }),
  addCatalogModel: (model) => set((state) => ({ catalog: [model, ...state.catalog] })),
  updateCatalogModel: (modelId, data) => set((state) => ({
    catalog: state.catalog.map((m) => m.id === modelId ? { ...m, ...data } : m),
  })),
  deleteCatalogModel: (modelId) => set((state) => ({
    catalog: state.catalog.filter((m) => m.id !== modelId),
  })),
  toggleCatalogFavorite: (modelId) => set((state) => ({
    catalog: state.catalog.map((m) =>
        m.id === modelId ? { ...m, isFavorite: !m.isFavorite } : m
    ),
  })),

  // UI Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setClientFilter: (filter) => set({ selectedClientFilter: filter }),
  setCatalogCategory: (category) => set({ selectedCatalogCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Helpers
  getClientById: (clientId) => get().clients.find((c) => c.id === clientId),
  getOrdersByClient: (clientId) => get().orders.filter((o) => o.clientId === clientId),
  getMeasurementsByClient: (clientId) => get().measurements[clientId],
  getPaymentsByClient: (clientId) => get().payments[clientId] || [],
}));*/
