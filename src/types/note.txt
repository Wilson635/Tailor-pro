// types/index.ts

// ==========================================
// TYPES PRINCIPAUX - TailorPro
// ==========================================

// Client
export interface Client {
  id: string;
  couturierId: string;
  nom: string;
  telephone: string;
  whatsapp: string | null;
  email: string | null;
  adresse: string | null;
  sexe: 'homme' | 'femme' | 'autre';
  dateNaissance: Date | null;
  photo: string | null;
  notesInternes: string | null;
  isFavorite: boolean;
  balance: number; // Solde (positif = dû par le client)
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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

// ── Fiche Mensuration (Module 3) ────────────────────────────────
export type TypeVetement = 'robe' | 'costume' | 'chemise' | 'pantalon' | 'boubou' | 'autre';

export interface FicheMensuration {
  id: string;
  clientId: string;
  couturierId: string;
  typeVetement: TypeVetement;
  datePrise: Date;
  mesures: Record<string, number>; // JSON flexible : { tour_poitrine: 96, ... }
  unite: 'cm' | 'pouces';
  notes?: string;
  isActive: boolean;             // Référence actuelle pour ce type
  createdAt: Date;
}

// ── Réalisation (Module 5) ────────────────────────────────────────────
export type StatutRealisation =
    | 'en_cours'
    | 'essayage'
    | 'corrections'
    | 'terminee'
    | 'livree';

export interface Realisation {
  id: string;
  couturierId: string;
  clientId: string;
  commandeId?: string;           // nullable — Module 7
  modeleId?: string;             // nullable — catalogue optionnel
  ficheMensurationId?: string;   // nullable
  tissuId?: string;              // nullable — Module 6
  tissuLabel?: string;           // interim jusqu'au Module 6
  couleur: string;
  accessoires: string[];
  photos: string[];              // URLs Supabase Storage
  observations?: string;
  statut: StatutRealisation;
  dateCreation: string;          // ISO date "YYYY-MM-DD"
  dateEssayage?: string;
  dateLivraison?: string;
  createdAt: Date;
}

// ── Tissu (Module 6) ─────────────────────────────────────────────────
export interface Tissu {
  id: string;
  couturierId: string;
  typeTissu: string;
  nomCommercial: string;
  couleur: string;
  fournisseur?: string;
  prixUnitaire: number;
  quantiteUtilisee: number;  // mètres utilisés dans les réalisations
  photo?: string;            // URL Supabase Storage
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id:       string;
  itemType: 'fabric' | 'inspiration';
  photoUrl: string;
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
  orderItems?:     OrderItem[];
  // Module 7
  numeroCommande?: string;
  dateLivraisonReelle?: Date;
}

export type UrgencyLevel =
    | 'low'
    | 'medium'
    | 'high';

// Paiement
export type TypePaiement = 'acompte' | 'paiement_intermediaire' | 'solde_final';
export type StatutPaiement = 'payee' | 'partiellement_payee' | 'non_payee';

export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  amount: number;
  date: Date;
  method?: 'cash' | 'mobile_money' | 'bank_transfer' | 'other';
  typePaiement?: TypePaiement;  // Module 8
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Modèle de catalogue
export interface CatalogModel {
  id: string;
  couturierId: string;
  nom: string;
  categorie: CatalogCategory;
  description?: string;
  photos: string[];
  prixIndicatif: number;
  difficulte: 'facile' | 'moyen' | 'difficile';
  tempsMoyenRealisation: number | null;
  tissusRecommandes: string[];
  accessoiresNecessaires: string[];
  statut: 'public' | 'prive';
  isFavorite: boolean;
  createdAt: Date;
  deletedAt: Date | null;
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
    | 'homme'
    | 'femme'
    | 'enfant'
    | 'mariage'
    | 'traditionnel'
    | 'costume'
    | 'robe'
    | 'chemise'
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
    | 'cancelled'
    // Module 7 — statuts français
    | 'creee'
    | 'en_attente'
    | 'en_confection'
    | 'essayage'
    | 'retouches'
    | 'terminee'
    | 'livree'
    | 'annulee';

// Historique des changements de statut (Module 7)
export interface HistoriqueStatutCommande {
  id: string;
  commandeId: string;
  couturierId: string;
  ancienStatut?: string;
  nouveauStatut: string;
  commentaire?: string;
  createdAt: Date;
}

// ==========================================
// TYPES DE FORMULAIRES
// ==========================================

export interface ClientFormData {
  nom: string;
  telephone: string;
  whatsapp: string;
  email: string;
  adresse: string;
  sexe: 'homme' | 'femme' | 'autre';
  dateNaissance: string;  // ISO YYYY-MM-DD
  notesInternes: string;
  photo: string | null;
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
