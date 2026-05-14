// ==========================================
// SERVICE SUPABASE - TailorPro
// ==========================================
// Toutes les requêtes DB centralisées ici.
// Chaque fonction retourne { data, error }.

import { supabase } from '@/src/lib/supabase';
import type { Client, Order, Measurements, Payment, Statistics } from '../types';

// ==========================================
// HELPERS INTERNES
// ==========================================

/** Récupère l'id de l'utilisateur connecté */
const getUserId = async (): Promise<string> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Utilisateur non connecté');
    return user.id;
};

// ==========================================
// CLIENTS
// ==========================================

export const clientService = {

    /** Récupère tous les clients de l'utilisateur */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Crée un nouveau client */
    create: async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                full_name: client.fullName,
                phone: client.phone,
                neighborhood: client.neighborhood,
                gender: client.gender,
                photo_url: client.photo ?? null,
                is_favorite: client.isFavorite ?? false,
                balance: client.balance ?? 0,
            })
            .select()
            .single();
        return { data, error };
    },

    /** Met à jour un client */
    update: async (clientId: string, updates: Partial<Client>) => {
        const { data, error } = await supabase
            .from('clients')
            .update({
                full_name: updates.fullName,
                phone: updates.phone,
                neighborhood: updates.neighborhood,
                gender: updates.gender,
                photo_url: updates.photo,
                is_favorite: updates.isFavorite,
                balance: updates.balance,
                updated_at: new Date().toISOString(),
            })
            .eq('id', clientId)
            .select()
            .single();
        return { data, error };
    },

    /** Supprime un client */
    delete: async (clientId: string) => {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);
        return { error };
    },
};

// ==========================================
// COMMANDES
// ==========================================

export const orderService = {

    /** Récupère toutes les commandes de l'utilisateur */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Récupère les commandes d'un client */
    getByClient: async (clientId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Crée une commande */
    create: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                client_id: order.clientId,
                client_name: order.clientName,
                clothing_type: order.clothingType,
                description: order.description,
                delivery_date: order.deliveryDate?.toISOString(),
                urgency_level: order.urgencyLevel,
                total_price: order.totalPrice,
                advance_payment: order.advancePayment,
                remaining_amount: order.remainingAmount,
                payment_status: order.paymentStatus,
                order_status: order.orderStatus,
            })
            .select()
            .single();
        return { data, error };
    },

    /** Met à jour une commande */
    update: async (orderId: string, updates: Partial<Order>) => {
        const { data, error } = await supabase
            .from('orders')
            .update({
                clothing_type: updates.clothingType,
                description: updates.description,
                delivery_date: updates.deliveryDate?.toISOString(),
                urgency_level: updates.urgencyLevel,
                total_price: updates.totalPrice,
                advance_payment: updates.advancePayment,
                remaining_amount: updates.remainingAmount,
                payment_status: updates.paymentStatus,
                order_status: updates.orderStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .select()
            .single();
        return { data, error };
    },

    /** Supprime une commande */
    delete: async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);
        return { error };
    },
};

// ==========================================
// MESURES
// ==========================================

export const measurementService = {

    /** Récupère les mesures d'un client */
    getByClient: async (clientId: string) => {
        const { data, error } = await supabase
            .from('measurements')
            .select('*')
            .eq('client_id', clientId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();
        return { data, error };
    },

    /** Crée ou met à jour les mesures */
    upsert: async (clientId: string, measurements: Omit<Measurements, 'id' | 'clientId'>) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('measurements')
            .upsert({
                client_id: clientId,
                user_id: userId,
                chest_circumference: measurements.chestCircumference,
                waist_circumference: measurements.waistCircumference,
                hip_circumference: measurements.hipCircumference,
                back_width: measurements.backWidth,
                shoulder_width: measurements.shoulderWidth,
                sleeve_length: measurements.sleeveLength,
                arm_circumference: measurements.armCircumference,
                neck_circumference: measurements.neckCircumference,
                dress_length: measurements.dressLength,
                bust_height: measurements.bustHeight,
                thigh_circumference: measurements.thighCircumference,
                recorded_at: new Date().toISOString(),
            })
            .select()
            .single();
        return { data, error };
    },
};

// ==========================================
// PAIEMENTS
// ==========================================

export const paymentService = {

    /** Récupère les paiements d'une commande */
    getByOrder: async (orderId: string) => {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .order('payment_date', { ascending: false });
        return { data, error };
    },

    /** Enregistre un paiement */
    create: async (payment: {
        orderId: string;
        amount: number;
        method: string;
        notes?: string;
    }) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('payments')
            .insert({
                order_id: payment.orderId,
                user_id: userId,
                amount: payment.amount,
                payment_method: payment.method,
                notes: payment.notes ?? null,
                payment_date: new Date().toISOString(),
            })
            .select()
            .single();
        return { data, error };
    },
};

// ==========================================
// ACTIVITÉS
// ==========================================

export const activityService = {

    /** Récupère les activités récentes */
    getRecent: async (limit = 10) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    /** Crée une activité */
    create: async (activity: {
        type: 'new_order' | 'payment_received' | 'order_completed' | 'new_client';
        title: string;
        subtitle?: string;
        amount?: number;
        clientId?: string;
        orderId?: string;
    }) => {
        const userId = await getUserId();
        const { error } = await supabase
            .from('activities')
            .insert({
                user_id: userId,
                activity_type: activity.type,
                title: activity.title,
                subtitle: activity.subtitle ?? null,
                amount: activity.amount ?? null,
                client_id: activity.clientId ?? null,
                order_id: activity.orderId ?? null,
            });
        return { error };
    },
};

// ==========================================
// STATISTIQUES
// ==========================================

export const statisticsService = {

    /** Calcule les statistiques du mois en cours */
    compute: async (): Promise<{ data: Statistics | null; error: any }> => {
        try {
            const userId = await getUserId();
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Exécution en parallèle pour la performance
            const [clientsRes, ordersRes, paymentsRes] = await Promise.all([
                supabase.from('clients').select('id', { count: 'exact' }).eq('user_id', userId),
                supabase.from('orders').select('*').eq('user_id', userId),
                supabase.from('payments').select('amount').eq('user_id', userId).gte('payment_date', startOfMonth),
            ]);

            const orders = ordersRes.data ?? [];
            const payments = paymentsRes.data ?? [];

            // Revenus du mois = somme des paiements reçus ce mois
            const monthlyRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

            // Commandes en cours / terminées ce mois
            const ordersInProgress = orders.filter(o => o.order_status === 'in_progress').length;
            const completedOrders = orders.filter(
                o => o.order_status === 'completed' || o.order_status === 'delivered'
            ).length;

            // Impayés
            const unpaidOrders = orders.filter(o => o.payment_status !== 'paid');
            const unpaidInvoices = unpaidOrders.length;
            const unpaidAmount = unpaidOrders.reduce((sum, o) => sum + Number(o.remaining_amount), 0);

            // Croissance (on compare avec le mois dernier — simplifié)
            const revenueGrowth = 0; // À implémenter avec une 2ème requête si besoin

            const stats: Statistics = {
                totalClients: clientsRes.count ?? 0,
                monthlyRevenue,
                revenueGrowth,
                ordersInProgress,
                completedOrders,
                unpaidInvoices,
                unpaidAmount,
                totalExpenses: 0, // à implémenter si tu ajoutes une table dépenses
                netProfit: monthlyRevenue,
            };

            return { data: stats, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
};

// ==========================================
// HELPERS — MAPPING DB → APP
// ==========================================

/** Convertit une ligne DB clients → type Client de l'app */
export const mapClient = (row: any): Client => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? '',
    neighborhood: row.neighborhood ?? '',
    gender: row.gender,
    photo: row.photo_url ?? undefined,
    isFavorite: row.is_favorite ?? false,
    balance: Number(row.balance ?? 0),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
});

/** Convertit une ligne DB orders → type Order de l'app */
export const mapOrder = (row: any): Order => ({
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clothingType: row.clothing_type,
    description: row.description ?? '',
    fabricPhotos: [],
    inspirationPhotos: [],
    deliveryDate: row.delivery_date ? new Date(row.delivery_date) : new Date(),
    urgencyLevel: row.urgency_level,
    totalPrice: Number(row.total_price ?? 0),
    advancePayment: Number(row.advance_payment ?? 0),
    remainingAmount: Number(row.remaining_amount ?? 0),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
});

/** Convertit une ligne DB activities → type Activity de l'app */
export const mapActivity = (row: any) => ({
    id: row.id,
    type: row.activity_type,
    title: row.title,
    subtitle: row.subtitle ?? '',
    amount: row.amount ? Number(row.amount) : undefined,
    clientId: row.client_id ?? undefined,
    orderId: row.order_id ?? undefined,
    timestamp: new Date(row.created_at),
});