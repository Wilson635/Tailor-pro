// ==========================================
// TYPES PRINCIPAUX - TailorPro
// ==========================================

// Client
export interface Client {
  id: string;
  fullName: string;
  phone: string;
  neighborhood: string;
  address?: string;
  gender: 'male' | 'female';
  photo?: string;
  isFavorite: boolean;
  balance: number; // Solde (positif = dû par le client, négatif = crédit)
  createdAt: Date;
  updatedAt: Date;
}

// Mesures
export interface Measurements {
  id: string;
  clientId: string;
  recordedAt: Date;
  // Mesures en cm
  chestCircumference?: number;      // Tour de poitrine
  waistCircumference?: number;      // Tour de taille
  hipCircumference?: number;        // Tour de hanches
  backWidth?: number;               // Largeur dos
  shoulderWidth?: number;           // Longueur épaule
  sleeveLength?: number;            // Longueur manche
  armCircumference?: number;        // Tour de bras
  neckCircumference?: number;       // Tour de cou
  dressLength?: number;             // Longueur robe
  bustHeight?: number;              // Hauteur buste
  thighCircumference?: number;      // Tour de cuisse
}

// Commande
export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clothingType: ClothingType;
  description?: string;
  fabricPhotos: string[];
  inspirationPhotos: string[];
  deliveryDate: Date;
  urgencyLevel: UrgencyLevel;
  totalPrice: number;
  advancePayment: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UrgencyLevel =
    | 'low'
    | 'medium'
    | 'high';

// Paiement
export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  amount: number;
  date: Date;
  method?: 'cash' | 'mobile_money' | 'bank_transfer' | 'other';
  notes?: string;
}

// Modèle de catalogue
export interface CatalogModel {
  id: string;
  name: string;
  category: CatalogCategory;
  price: number;
  description?: string;
  photos: string[];
  isFavorite: boolean;
  createdAt: Date;
}

// Activité récente
export interface Activity {
  id: string;
  type: 'new_order' | 'payment_received' | 'order_completed' | 'new_client';
  title: string;
  subtitle: string;
  amount?: number;
  timestamp: Date;
  clientId?: string;
  orderId?: string;
}

// Statistiques
export interface Statistics {
  totalClients: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  ordersInProgress: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  completedOrders: number;
  totalExpenses: number;
  netProfit: number;
}

// ==========================================
// ENUMS ET TYPES UTILITAIRES
// ==========================================

export type ClothingType = 
  | 'robe_longue'
  | 'robe_courte'
  | 'costume'
  | 'chemise'
  | 'pantalon'
  | 'boubou'
  | 'ensemble'
  | 'robe_mariage'
  | 'tenue_enfant'
  | 'autre';

export type CatalogCategory = 
  | 'all'
  | 'robes'
  | 'costumes'
  | 'chemises'
  | 'enfants'
  | 'mariage'
  | 'traditionnel'
  | 'casual'
  | 'luxe';

export type PaymentStatus = 
  | 'unpaid'
  | 'partial'
  | 'paid';

export type OrderStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled';

// ==========================================
// TYPES DE FORMULAIRES
// ==========================================

export interface ClientFormData {
  fullName: string;
  phone: string;
  neighborhood: string;
  address?: string;
  gender: 'male' | 'female';
  photo?: string;
}

export interface MeasurementsFormData {
  chestCircumference?: string;
  waistCircumference?: string;
  hipCircumference?: string;
  backWidth?: string;
  shoulderWidth?: string;
  sleeveLength?: string;
  armCircumference?: string;
  neckCircumference?: string;
  dressLength?: string;
  bustHeight?: string;
  thighCircumference?: string;
}

export interface OrderFormData {
  clientId: string;
  clothingType: ClothingType;
  description?: string;
  deliveryDate: Date;
  totalPrice: string;
  advancePayment?: string;
}

export interface PaymentFormData {
  amount: string;
  method?: 'cash' | 'mobile_money' | 'bank_transfer' | 'other';
  notes?: string;
}

// ==========================================
// TYPES DE NAVIGATION
// ==========================================

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  // Main tabs
  MainTabs: undefined;
  // Clients
  ClientDetails: { clientId: string };
  AddClient: undefined;
  EditClient: { clientId: string };
  // Mesures
  ClientMeasurements: { clientId: string };
  AddMeasurements: { clientId: string };
  // Commandes
  OrderDetails: { orderId: string };
  AddOrder: { clientId?: string };
  EditOrder: { orderId: string };
  // Paiements
  ClientPayments: { clientId: string };
  AddPayment: { clientId: string; orderId?: string };
  // Catalogue
  ModelDetails: { modelId: string };
  AddModel: undefined;
  EditModel: { modelId: string };
  // Paramètres
  Settings: undefined;
  Profile: undefined;
  Statistics: undefined;
};

export type TabParamList = {
  Home: undefined;
  Clients: undefined;
  Orders: undefined;
  Catalog: undefined;
  More: undefined;
};
