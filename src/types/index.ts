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
// `type_vetement` est passé d'ENUM à TEXT côté DB (migration 014) pour rester extensible
// (garment_measurement_fields). Le "& {}" garde l'autocomplétion des valeurs connues
// tout en acceptant n'importe quelle string ajoutée par le couturier.
export type TypeVetement = 'robe' | 'costume' | 'chemise' | 'pantalon' | 'boubou' | 'autre' | (string & {});

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
  // ── Projets / commandes groupées ──────────────────────────────
  orderId?: string;              // non-null = copie figée pour CE vêtement (orders.id)
  sourceFicheId?: string;        // fiche bibliothèque d'origine dont celle-ci a été dupliquée
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
  // ── Projets / commandes groupées ──────────────────────────────
  projectId?: string;             // undefined/null = commande simple (comportement inchangé)
  participantId?: string;         // la personne du projet à qui appartient ce vêtement
  ficheMensurationId?: string;    // fiche de mensuration utilisée pour ce vêtement précis
  catalogId?: string;             // modèle de catalogue lié
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
  // orderId devient optionnel : un paiement peut être rattaché à un vêtement précis (orderId)
  // OU au projet global (projectId) — toujours au moins l'un des deux (CHECK en DB).
  orderId?: string;
  projectId?: string;
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
/*export interface CatalogModel {
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
}*/

export interface CatalogModel {
  id: string;
  couturierId: string;
  nom: string;                    // ← français
  categorie: CatalogCategory;     // ← français
  description?: string;
  photos: string[];
  prixIndicatif: number;          // ← français
  difficulte: 'facile' | 'moyen' | 'difficile';       // requis, pas optionnel
  tempsMoyenRealisation: number | null;                // requis
  tissusRecommandes: string[];                          // requis
  accessoiresNecessaires: string[];                     // requis
  statut: 'public' | 'prive';                           // requis
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
// PROJETS / COMMANDES GROUPÉES (Module 13)
// ==========================================

export type ProjectStatut =
    | 'brouillon'
    | 'confirme'
    | 'en_preparation'
    | 'en_confection'
    | 'essayage'
    | 'retouches'
    | 'partiellement_termine'
    | 'termine'
    | 'livre'
    | 'annule';

export interface Project {
  id: string;
  couturierId: string;
  clientId: string;              // contact principal du projet
  nom: string;                   // "Mariage Jean & Marie"
  typeProjet?: string;           // mariage / ceremonie / groupe / autre (libre)
  statut: ProjectStatut;
  dateEvenement?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/** Récapitulatif agrégé d'un projet — alimenté par la vue SQL `vue_projet_recap` */
export interface ProjectRecap {
  projectId: string;
  couturierId: string;
  nom: string;
  statut: ProjectStatut;
  dateEvenement?: Date;
  nbPersonnes: number;
  nbVetements: number;
  nbVetementsTermines: number;
  montantTotal: number;
  totalPaye: number;
  resteAPayer: number;
}

export type ParticipantRole =
    | 'mariee'
    | 'marie'
    | 'temoin_homme'
    | 'temoin_femme'
    | 'pere'
    | 'mere'
    | 'enfant'
    | 'garcon_honneur'
    | 'fille_honneur'
    | 'client'
    | 'autre'
    | (string & {});

export interface ProjectParticipant {
  id: string;
  projectId: string;
  couturierId: string;
  clientId?: string | null;      // lié à un client existant, ou undefined si temporaire
  nom: string;
  telephone?: string;
  role?: ParticipantRole;
  isTemporary: boolean;
  createdAt: Date;
}

/** Mesures configurables par type de vêtement (Module 3 étendu) */
export interface GarmentMeasurementField {
  id: string;
  couturierId?: string | null;   // undefined/null = champ global par défaut
  typeVetement: TypeVetement;
  fieldKey: string;              // 'tour_poitrine', 'longueur_manche', ...
  label: string;
  uniteDefaut: 'cm' | 'pouces';
  sortOrder: number;
  createdAt: Date;
}

/** Tous les champs d'un type de vêtement, triés — pour le formulaire dynamique */
export type MeasurementFieldsByType = Record<string, GarmentMeasurementField[]>;

/** Résultat du choix "utiliser une fiche existante" vs "prendre de nouvelles mesures" */
export type MeasurementChoiceMode = 'use_existing' | 'new_measurements';

export interface MeasurementChoiceResult {
  mode: MeasurementChoiceMode;
  sourceFicheId?: string;                 // si mode === 'use_existing'
  mesures?: Record<string, number>;       // si mode === 'new_measurements'
  unite?: 'cm' | 'pouces';
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

export interface ProjectFormData {
  nom: string;
  clientId: string;               // contact principal
  typeProjet?: string;
  dateEvenement?: string;         // ISO YYYY-MM-DD
  notes?: string;
}

export interface ParticipantFormData {
  nom: string;
  telephone?: string;
  role?: ParticipantRole;
  clientId?: string;              // si lié à un client existant
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
  AddOrder: { clientId?: string; projectId?: string; participantId?: string };
  EditOrder: { orderId: string };
  // Projets / commandes groupées
  ProjectList: undefined;
  ProjectDetails: { projectId: string };
  AddProject: undefined;
  ParticipantDetails: { participantId: string; projectId: string };
  AddParticipant: { projectId: string };
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