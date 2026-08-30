// services/supabaseServices.ts

// ==========================================
// SERVICE SUPABASE - TailorPro
// ==========================================
// Toutes les requêtes DB centralisées ici.
// Chaque fonction retourne { data, error }.

import { supabase } from '@/src/lib/supabase';
import type { Client, Order, Measurements, Payment, Statistics, CatalogModel, FicheMensuration, TypeVetement } from '../types';

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

    /** Récupère tous les clients du couturier connecté (hors supprimés) */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('couturier_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Crée un nouveau client */
    create: async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('clients')
            .insert({
                couturier_id:   userId,
                nom:            client.nom,
                telephone:          client.telephone,
                whatsapp:       client.whatsapp ?? null,
                email:          client.email ?? null,
                adresse:        client.adresse ?? null,
                sexe:           client.sexe ?? 'femme',
                date_naissance: client.dateNaissance
                    ? (client.dateNaissance instanceof Date
                        ? client.dateNaissance.toISOString().split('T')[0]
                        : client.dateNaissance)
                    : null,
                photo_url:      client.photo ?? null,
                notes_internes: client.notesInternes ?? null,
                is_favorite:    client.isFavorite ?? false,
                balance:        client.balance ?? 0,
            })
            .select()
            .single();
        return { data, error };
    },

    /** Met à jour un client */
    update: async (clientId: string, updates: Partial<Client>) => {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.nom            !== undefined) payload.nom            = updates.nom;
        if (updates.telephone      !== undefined) payload.phone          = updates.telephone;
        if (updates.whatsapp       !== undefined) payload.whatsapp       = updates.whatsapp;
        if (updates.email          !== undefined) payload.email          = updates.email;
        if (updates.adresse        !== undefined) payload.adresse        = updates.adresse;
        if (updates.sexe           !== undefined) payload.sexe           = updates.sexe;
        if (updates.dateNaissance  !== undefined) payload.date_naissance = updates.dateNaissance
            ? (updates.dateNaissance instanceof Date
                ? updates.dateNaissance.toISOString().split('T')[0]
                : updates.dateNaissance)
            : null;
        if (updates.photo          !== undefined) payload.photo_url      = updates.photo;
        if (updates.notesInternes  !== undefined) payload.notes_internes = updates.notesInternes;
        if (updates.isFavorite     !== undefined) payload.is_favorite    = updates.isFavorite;
        if (updates.balance        !== undefined) payload.balance        = updates.balance;

        const { data, error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', clientId)
            .select()
            .single();
        return { data, error };
    },

    /** Soft-delete : marque deleted_at plutôt que supprimer physiquement */
    delete: async (clientId: string) => {
        const { error } = await supabase
            .from('clients')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', clientId);
        return { error };
    },
};

// ==========================================
// COMMANDES
// ==========================================

/*export const orderService = {

    /** Récupère toutes les commandes de l'utilisateur
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Récupère les commandes d'un client
    getByClient: async (clientId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Crée une commande
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

    /** Met à jour une commande
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

    /** Supprime une commande
    delete: async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);
        return { error };
    },
};*/

// ==========================================
// COMMANDES (Mis à jour avec order_items)
// ==========================================

export const orderService = {

    /** Récupère toutes les commandes de l'utilisateur */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('couturier_id', userId)
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

    /** Récupère les vêtements (orders) d'un projet, avec la personne concernée */
    getByProject: async (projectId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Récupère les vêtements d'une personne au sein d'un projet */
    getByParticipant: async (participantId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('participant_id', participantId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Crée une commande (simple si projectId absent, sinon un vêtement du projet) */
    create: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('orders')
            .insert({
                couturier_id: userId,
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
                // ── Projets / commandes groupées ──
                project_id: order.projectId ?? null,
                participant_id: order.participantId ?? null,
                fiche_mensuration_id: order.ficheMensurationId ?? null,
                catalog_id: order.catalogId ?? null,
            })
            .select()
            .single();
        return { data, error };
    },

    /** Met à jour une commande */
    update: async (orderId: string, updates: Partial<Order>) => {
        const patch: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (updates.clothingType        !== undefined) patch.clothing_type        = updates.clothingType;
        if (updates.description         !== undefined) patch.description          = updates.description;
        if (updates.deliveryDate        !== undefined) patch.delivery_date        = updates.deliveryDate?.toISOString();
        if (updates.urgencyLevel        !== undefined) patch.urgency_level        = updates.urgencyLevel;
        if (updates.totalPrice          !== undefined) patch.total_price          = updates.totalPrice;
        if (updates.advancePayment      !== undefined) patch.advance_payment      = updates.advancePayment;
        if (updates.remainingAmount     !== undefined) patch.remaining_amount     = updates.remainingAmount;
        if (updates.paymentStatus       !== undefined) patch.payment_status       = updates.paymentStatus;
        if (updates.orderStatus         !== undefined) patch.order_status         = updates.orderStatus;
        if (updates.projectId           !== undefined) patch.project_id           = updates.projectId ?? null;
        if (updates.participantId       !== undefined) patch.participant_id       = updates.participantId ?? null;
        if (updates.ficheMensurationId  !== undefined) patch.fiche_mensuration_id = updates.ficheMensurationId ?? null;
        if (updates.catalogId           !== undefined) patch.catalog_id           = updates.catalogId ?? null;

        const { data, error } = await supabase
            .from('orders')
            .update(patch)
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
// FICHES DE MENSURATION (Module 3)
// ==========================================

export const mapFiche = (row: Record<string, unknown>): FicheMensuration => ({
    id:           row.id as string,
    clientId:     row.client_id as string,
    couturierId:  row.couturier_id as string,
    typeVetement: row.type_vetement as TypeVetement,
    datePrise:    new Date(row.date_prise as string),
    mesures:      (row.mesures ?? {}) as Record<string, number>,
    unite:        row.unite as 'cm' | 'pouces',
    notes:        row.notes as string | undefined,
    isActive:     row.is_active as boolean,
    createdAt:    new Date(row.created_at as string),
    orderId:       (row.order_id as string) ?? undefined,
    sourceFicheId: (row.source_fiche_id as string) ?? undefined,
});

export const ficheService = {

    /** Récupère les fiches "bibliothèque" d'un client (réutilisables, hors copies figées par vêtement) */
    getAll: async (clientId: string) => {
        const { data, error } = await supabase
            .from('fiches_mensuration')
            .select('*')
            .eq('client_id', clientId)
            .is('order_id', null) // exclut les copies figées pour un vêtement précis
            .order('date_prise', { ascending: false });
        return { data, error };
    },

    /** Récupère la fiche bibliothèque active la plus récente pour (client, type de vêtement) */
    getActiveForType: async (clientId: string, typeVetement: TypeVetement) => {
        const { data, error } = await supabase
            .from('fiches_mensuration')
            .select('*')
            .eq('client_id', clientId)
            .eq('type_vetement', typeVetement)
            .is('order_id', null)
            .order('date_prise', { ascending: false })
            .limit(1)
            .maybeSingle();
        return { data, error };
    },

    /** Récupère la fiche (copie figée) utilisée pour un vêtement précis */
    getForOrder: async (orderId: string) => {
        const { data, error } = await supabase
            .from('fiches_mensuration')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();
        return { data, error };
    },

    /** Crée une nouvelle fiche */
    create: async (
        clientId: string,
        ficheData: Omit<FicheMensuration, 'id' | 'createdAt' | 'couturierId' | 'clientId'>,
    ) => {
        const userId = await getUserId();
        // Si la fiche est active, désactiver les autres du même type pour ce client
        if (ficheData.isActive) {
            await supabase
                .from('fiches_mensuration')
                .update({ is_active: false })
                .eq('client_id', clientId)
                .eq('type_vetement', ficheData.typeVetement)
                .is('order_id', null);
        }
        const { data, error } = await supabase
            .from('fiches_mensuration')
            .insert({
                client_id:     clientId,
                couturier_id:  userId,
                type_vetement: ficheData.typeVetement,
                date_prise:    ficheData.datePrise.toISOString().split('T')[0],
                mesures:       ficheData.mesures,
                unite:         ficheData.unite,
                notes:         ficheData.notes ?? null,
                is_active:     ficheData.isActive,
                order_id:      ficheData.orderId ?? null,
            })
            .select()
            .single();
        return { data, error };
    },

    /**
     * Crée les mesures d'un vêtement au sein d'un projet/commande.
     * - `Option A` (fiche existante) : appeler avec `sourceFicheId` → duplique la fiche
     *   bibliothèque en une copie figée liée à `orderId` (l'originale n'est jamais modifiée).
     * - `Option B` (nouvelles mesures) : appeler sans `sourceFicheId` → crée une nouvelle
     *   fiche bibliothèque (réutilisable plus tard) ET la lie directement à `orderId`.
     */
    createForOrder: async (params: {
        clientId: string;
        orderId: string;
        typeVetement: TypeVetement;
        sourceFicheId?: string;         // Option A : fiche bibliothèque à dupliquer
        mesures?: Record<string, number>; // Option B : nouvelles mesures
        unite?: 'cm' | 'pouces';
        notes?: string;
    }) => {
        const userId = await getUserId();

        if (params.sourceFicheId) {
            // Option A — copie figée, l'originale reste intacte
            const { data: source, error: fetchError } = await supabase
                .from('fiches_mensuration')
                .select('*')
                .eq('id', params.sourceFicheId)
                .single();
            if (fetchError || !source) return { data: null, error: fetchError };

            const { data, error } = await supabase
                .from('fiches_mensuration')
                .insert({
                    client_id:       params.clientId,
                    couturier_id:    userId,
                    type_vetement:   source.type_vetement,
                    date_prise:      new Date().toISOString().split('T')[0],
                    mesures:         source.mesures,
                    unite:           source.unite,
                    notes:           params.notes ?? source.notes ?? null,
                    is_active:       false,          // copie non-bibliothèque
                    order_id:        params.orderId,
                    source_fiche_id: params.sourceFicheId,
                })
                .select()
                .single();
            if (!error && data) {
                await supabase.from('orders').update({ fiche_mensuration_id: data.id }).eq('id', params.orderId);
            }
            return { data, error };
        }

        // Option B — nouvelles mesures : créée à la fois comme fiche bibliothèque
        // (is_active, réutilisable) et liée directement au vêtement.
        await supabase
            .from('fiches_mensuration')
            .update({ is_active: false })
            .eq('client_id', params.clientId)
            .eq('type_vetement', params.typeVetement)
            .is('order_id', null);

        const { data, error } = await supabase
            .from('fiches_mensuration')
            .insert({
                client_id:     params.clientId,
                couturier_id:  userId,
                type_vetement: params.typeVetement,
                date_prise:    new Date().toISOString().split('T')[0],
                mesures:       params.mesures ?? {},
                unite:         params.unite ?? 'cm',
                notes:         params.notes ?? null,
                is_active:     true,
                order_id:      null, // reste une fiche bibliothèque réutilisable
            })
            .select()
            .single();
        if (!error && data) {
            await supabase.from('orders').update({ fiche_mensuration_id: data.id }).eq('id', params.orderId);
        }
        return { data, error };
    },

    /** Duplique une fiche existante (nouvelle date = aujourd'hui, statut non actif) */
    duplicate: async (fiche: FicheMensuration) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('fiches_mensuration')
            .insert({
                client_id:     fiche.clientId,
                couturier_id:  userId,
                type_vetement: fiche.typeVetement,
                date_prise:    new Date().toISOString().split('T')[0],
                mesures:       fiche.mesures,
                unite:         fiche.unite,
                notes:         fiche.notes ? `Copie · ${fiche.notes}` : null,
                is_active:     false,
            })
            .select()
            .single();
        return { data, error };
    },

    /** Marque une fiche comme référence active (désactive les autres du même type) */
    setActive: async (ficheId: string, clientId: string, typeVetement: TypeVetement) => {
        await supabase
            .from('fiches_mensuration')
            .update({ is_active: false })
            .eq('client_id', clientId)
            .eq('type_vetement', typeVetement)
            .is('order_id', null);
        const { error } = await supabase
            .from('fiches_mensuration')
            .update({ is_active: true })
            .eq('id', ficheId);
        return { error };
    },

    /** Supprime définitivement une fiche */
    delete: async (ficheId: string) => {
        const { error } = await supabase
            .from('fiches_mensuration')
            .delete()
            .eq('id', ficheId);
        return { error };
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
            .order('date', { ascending: false });
        return { data, error };
    },

    /** Récupère les paiements rattachés au projet lui-même (hors paiements par vêtement) */
    getByProjectOnly: async (projectId: string) => {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: false });
        return { data, error };
    },

    /** Récupère TOUS les paiements d'un projet : ceux de ses vêtements + ceux au niveau projet */
    getByProject: async (projectId: string) => {
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .eq('project_id', projectId);
        if (ordersError) return { data: null, error: ordersError };

        const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .or(
                [
                    `project_id.eq.${projectId}`,
                    orderIds.length > 0 ? `order_id.in.(${orderIds.join(',')})` : null,
                ].filter(Boolean).join(',')
            )
            .order('date', { ascending: false });
        return { data, error };
    },

    /** Enregistre un paiement — lié à un vêtement (orderId) et/ou au projet (projectId) */
    create: async (payment: {
        orderId?: string;
        projectId?: string;
        clientId: string;
        amount: number;
        method: string;
        notes?: string;
    }) => {
        if (!payment.orderId && !payment.projectId) {
            return { data: null, error: new Error('Un paiement doit être lié à une commande ou à un projet') };
        }
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('payments')
            .insert({
                order_id:     payment.orderId ?? null,
                project_id:   payment.projectId ?? null,
                couturier_id: userId,
                client_id:    payment.clientId,
                amount:       payment.amount,
                method:       payment.method,
                notes:        payment.notes ?? null,
                date:         new Date().toISOString().slice(0, 10),
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
                supabase.from('clients').select('id', { count: 'exact' }).eq('couturier_id', userId),
                supabase.from('orders').select('*').eq('couturier_id', userId),
                supabase.from('payments').select('amount').eq('couturier_id', userId).gte('date', startOfMonth.slice(0, 10)),
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
// CATALOGUE
// ==========================================

export const catalogService = {

    /** Récupère tous les modèles non archivés du couturier */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('catalog')
            .select('*')
            .or(`couturier_id.eq.${userId},user_id.eq.${userId}`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /** Crée un nouveau modèle */
    create: async (model: Omit<CatalogModel, 'id' | 'createdAt' | 'couturierId' | 'deletedAt'>) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('catalog')
            .insert({
                couturier_id:             userId,
                name:                     model.nom,
                category:                 model.categorie,
                price:                    model.prixIndicatif,
                description:              model.description ?? null,
                photos:                   model.photos,
                is_favorite:              model.isFavorite ?? false,
                difficulte:               model.difficulte ?? 'moyen',
                temps_moyen_realisation:  model.tempsMoyenRealisation ?? null,
                tissus_recommandes:       model.tissusRecommandes ?? [],
                accessoires_necessaires:  model.accessoiresNecessaires ?? [],
                statut:                   model.statut ?? 'prive',
            })
            .select()
            .single();
        return { data, error };
    },

    /** Met à jour un modèle */
    update: async (modelId: string, updates: Partial<CatalogModel>) => {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.nom               !== undefined) payload.name                    = updates.nom;
        if (updates.categorie         !== undefined) payload.category                = updates.categorie;
        if (updates.prixIndicatif     !== undefined) payload.price                   = updates.prixIndicatif;
        if (updates.description       !== undefined) payload.description             = updates.description;
        if (updates.photos            !== undefined) payload.photos                  = updates.photos;
        if (updates.isFavorite        !== undefined) payload.is_favorite             = updates.isFavorite;
        if (updates.difficulte        !== undefined) payload.difficulte              = updates.difficulte;
        if (updates.tempsMoyenRealisation !== undefined) payload.temps_moyen_realisation = updates.tempsMoyenRealisation;
        if (updates.tissusRecommandes !== undefined) payload.tissus_recommandes      = updates.tissusRecommandes;
        if (updates.accessoiresNecessaires !== undefined) payload.accessoires_necessaires = updates.accessoiresNecessaires;
        if (updates.statut            !== undefined) payload.statut                  = updates.statut;
        if (updates.deletedAt         !== undefined) payload.deleted_at              = updates.deletedAt?.toISOString() ?? null;

        const { data, error } = await supabase
            .from('catalog')
            .update(payload)
            .eq('id', modelId)
            .select()
            .single();
        return { data, error };
    },

    /** Soft delete : archive le modèle (ne pas le supprimer physiquement si des commandes y font référence) */
    archive: async (modelId: string) => {
        const { error } = await supabase
            .from('catalog')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', modelId);
        return { error };
    },

    /** Suppression physique (admin uniquement, à n'utiliser que si aucune commande ne référence ce modèle) */
    delete: async (modelId: string) => {
        const { error } = await supabase
            .from('catalog')
            .delete()
            .eq('id', modelId);
        return { error };
    },

    /** Duplique un modèle → "Copie de …", statut privé */
    duplicate: async (model: CatalogModel) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('catalog')
            .insert({
                couturier_id:             userId,
                name:                     `Copie de ${model.nom}`,
                category:                 model.categorie,
                price:                    model.prixIndicatif,
                description:              model.description ?? null,
                photos:                   [...model.photos],
                is_favorite:              false,
                difficulte:               model.difficulte,
                temps_moyen_realisation:  model.tempsMoyenRealisation ?? null,
                tissus_recommandes:       [...model.tissusRecommandes],
                accessoires_necessaires:  [...model.accessoiresNecessaires],
                statut:                   'prive',
            })
            .select()
            .single();
        return { data, error };
    },

    /** Upload une image vers Supabase Storage et retourne l'URL publique */
    uploadPhoto: async (localUri: string, fileName: string): Promise<string | null> => {
        const userId = await getUserId();
        try {
            const response = await fetch(localUri);
            const blob = await response.blob();
            const path = `${userId}/catalog/${Date.now()}_${fileName}`;

            const { error } = await supabase.storage
                .from('catalog-photos')
                .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

            if (error) return null;

            const { data } = supabase.storage
                .from('catalog-photos')
                .getPublicUrl(path);

            return data.publicUrl;
        } catch {
            return null;
        }
    },
};

// ==========================================
// HELPER MAPPING — À AJOUTER en bas du fichier
// (avec mapClient, mapOrder, mapActivity)
// ==========================================

/** Convertit une ligne DB catalog → type CatalogModel de l'app */
export const mapCatalogModel = (row: any): CatalogModel => ({
    id:                      row.id,
    couturierId:             row.couturier_id ?? row.user_id ?? '',
    nom:                     row.name ?? '',
    categorie:               row.category ?? 'casual',
    description:             row.description ?? undefined,
    photos:                  Array.isArray(row.photos) ? row.photos : [],
    prixIndicatif:           Number(row.price ?? 0),
    difficulte:              row.difficulte ?? 'moyen',
    tempsMoyenRealisation:   row.temps_moyen_realisation ?? null,
    tissusRecommandes:       Array.isArray(row.tissus_recommandes) ? row.tissus_recommandes : [],
    accessoiresNecessaires:  Array.isArray(row.accessoires_necessaires) ? row.accessoires_necessaires : [],
    statut:                  row.statut ?? 'prive',
    isFavorite:              row.is_favorite ?? false,
    createdAt:               new Date(row.created_at),
    deletedAt:               row.deleted_at ? new Date(row.deleted_at) : null,
});


// ==========================================
// HELPERS — MAPPING DB → APP
// ==========================================

/** Convertit une ligne DB clients → type Client de l'app */
export const mapClient = (row: any): Client => ({
    id:            row.id,
    couturierId:   row.couturier_id ?? row.user_id ?? '',
    nom:           row.nom ?? row.full_name ?? '',
    telephone:     row.telephone ?? '',
    whatsapp:      row.whatsapp ?? null,
    email:         row.email ?? null,
    adresse:       row.adresse ?? row.neighborhood ?? null,
    sexe:          row.sexe ?? row.gender ?? 'femme',
    dateNaissance: row.date_naissance ? new Date(row.date_naissance) : null,
    photo:         row.photo_url ?? null,
    notesInternes: row.notes_internes ?? null,
    isFavorite:    row.is_favorite ?? false,
    balance:       Number(row.balance ?? 0),
    createdAt:     new Date(row.created_at),
    updatedAt:     new Date(row.updated_at ?? row.created_at),
    deletedAt:     row.deleted_at ? new Date(row.deleted_at) : null,
});

/** Convertit une ligne DB orders → type Order de l'app */
/*export const mapOrder = (row: any): Order => ({
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
});*/

/** Convertit une ligne DB orders → type Order de l'app */
export const mapOrder = (row: any): Order => {
    // Extraction des photos depuis les order_items imbriqués s'ils existent
    const items = row.order_items || [];

    const fabricPhotos = items
        .filter((item: any) => item.item_type === 'fabric')
        .map((item: any) => item.photo_url)
        .filter(Boolean);

    const inspirationPhotos = items
        .filter((item: any) => item.item_type === 'inspiration' || item.item_type === 'model')
        .map((item: any) => item.photo_url)
        .filter(Boolean);

    return {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        clothingType: row.clothing_type,
        description: row.description ?? '',
        fabricPhotos: fabricPhotos,            // Rempli dynamiquement
        inspirationPhotos: inspirationPhotos,  // Rempli dynamiquement
        deliveryDate: row.delivery_date ? new Date(row.delivery_date) : new Date(),
        urgencyLevel: row.urgency_level,
        totalPrice: Number(row.total_price ?? 0),
        advancePayment: Number(row.advance_payment ?? 0),
        remainingAmount: Number(row.remaining_amount ?? 0),
        paymentStatus: row.payment_status,
        orderStatus: row.order_status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        orderItems: (row.order_items ?? []).map((item: any) => ({
            id:        item.id,
            itemType:  item.item_type,   // 'fabric' | 'inspiration'
            photoUrl:  item.photo_url,
        })),
        // Module 7
        numeroCommande:      row.numero_commande       ?? undefined,
        dateLivraisonReelle: row.date_livraison_reelle ? new Date(row.date_livraison_reelle) : undefined,
        // Projets / commandes groupées
        projectId:            row.project_id            ?? undefined,
        participantId:        row.participant_id        ?? undefined,
        ficheMensurationId:   row.fiche_mensuration_id   ?? undefined,
        catalogId:            row.catalog_id             ?? undefined,
    };
};

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
// ==========================================
// RÉALISATIONS (Module 5)
// ==========================================

import type { Realisation, StatutRealisation } from '../types';

export const mapRealisation = (row: any): Realisation => ({
    id:                  row.id,
    couturierId:         row.couturier_id,
    clientId:            row.client_id,
    commandeId:          row.commande_id        ?? undefined,
    modeleId:            row.modele_id           ?? undefined,
    ficheMensurationId:  row.fiche_mensuration_id ?? undefined,
    tissuId:             row.tissu_id            ?? undefined,
    tissuLabel:          row.tissu_label         ?? undefined,
    couleur:             row.couleur             ?? '',
    accessoires:         row.accessoires         ?? [],
    photos:              row.photos              ?? [],
    observations:        row.observations        ?? undefined,
    statut:              row.statut as StatutRealisation,
    dateCreation:        row.date_creation,
    dateEssayage:        row.date_essayage       ?? undefined,
    dateLivraison:       row.date_livraison      ?? undefined,
    createdAt:           new Date(row.created_at),
});

export const realisationService = {
    getAll: async (clientId: string) => {
        const userId = await getUserId();
        return supabase
            .from('realisations')
            .select('*')
            .eq('couturier_id', userId)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
    },

    getByCommande: async (commandeId: string) => {
        const userId = await getUserId();
        return supabase
            .from('realisations')
            .select('*')
            .eq('couturier_id', userId)
            .eq('commande_id', commandeId)
            .order('created_at', { ascending: false });
    },

    create: async (
        clientId: string,
        data: Omit<Realisation, 'id' | 'createdAt' | 'couturierId' | 'clientId'>,
    ) => {
        const userId = await getUserId();
        return supabase
            .from('realisations')
            .insert({
                couturier_id:         userId,
                client_id:            clientId,
                commande_id:          data.commandeId          ?? null,
                modele_id:            data.modeleId            ?? null,
                fiche_mensuration_id: data.ficheMensurationId  ?? null,
                tissu_id:             data.tissuId             ?? null,
                tissu_label:          data.tissuLabel          ?? null,
                couleur:              data.couleur,
                accessoires:          data.accessoires,
                photos:               data.photos,
                observations:         data.observations        ?? null,
                statut:               data.statut,
                date_creation:        data.dateCreation,
                date_essayage:        data.dateEssayage        ?? null,
                date_livraison:       data.dateLivraison       ?? null,
            })
            .select()
            .single();
    },

    update: async (
        realisationId: string,
        data: Partial<Omit<Realisation, 'id' | 'createdAt' | 'couturierId'>>,
    ) => {
        const patch: Record<string, unknown> = {};
        if (data.modeleId           !== undefined) patch.modele_id            = data.modeleId ?? null;
        if (data.ficheMensurationId !== undefined) patch.fiche_mensuration_id = data.ficheMensurationId ?? null;
        if (data.tissuId            !== undefined) patch.tissu_id             = data.tissuId ?? null;
        if (data.tissuLabel         !== undefined) patch.tissu_label          = data.tissuLabel;
        if (data.couleur            !== undefined) patch.couleur              = data.couleur;
        if (data.accessoires        !== undefined) patch.accessoires          = data.accessoires;
        if (data.photos             !== undefined) patch.photos               = data.photos;
        if (data.observations       !== undefined) patch.observations         = data.observations ?? null;
        if (data.statut             !== undefined) patch.statut               = data.statut;
        if (data.dateEssayage       !== undefined) patch.date_essayage        = data.dateEssayage ?? null;
        if (data.dateLivraison      !== undefined) patch.date_livraison       = data.dateLivraison ?? null;
        return supabase.from('realisations').update(patch).eq('id', realisationId).select().single();
    },

    updateStatut: async (realisationId: string, statut: StatutRealisation) =>
        supabase.from('realisations').update({ statut }).eq('id', realisationId).select().single(),

    delete: async (realisationId: string) =>
        supabase.from('realisations').delete().eq('id', realisationId),

    addPhoto: async (realisationId: string, photoUrl: string) => {
        const { data } = await supabase
            .from('realisations').select('photos').eq('id', realisationId).single();
        const photos = [...((data?.photos as string[]) ?? []), photoUrl];
        return supabase.from('realisations').update({ photos }).eq('id', realisationId).select().single();
    },

    removePhoto: async (realisationId: string, photoUrl: string) => {
        const { data } = await supabase
            .from('realisations').select('photos').eq('id', realisationId).single();
        const photos = ((data?.photos as string[]) ?? []).filter(p => p !== photoUrl);
        return supabase.from('realisations').update({ photos }).eq('id', realisationId).select().single();
    },
};

// ── Supabase Storage — Photos réalisations ──────────────────────────
export const uploadRealisationPhoto = async (
    localUri: string,
    couturierId: string,
    realisationId: string,
): Promise<{ publicUrl: string | null; error: Error | null }> => {
    try {
        const ext      = (localUri.split('.').pop()?.toLowerCase() ?? 'jpg').split('?')[0];
        const fileName = `${couturierId}/${realisationId}/${Date.now()}.${ext}`;
        const response = await fetch(localUri);
        const blob     = await response.blob();
        const buffer   = await blob.arrayBuffer();
        const { error } = await supabase.storage
            .from('realisation-photos')
            .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: false });
        if (error) return { publicUrl: null, error };
        const { data } = supabase.storage.from('realisation-photos').getPublicUrl(fileName);
        return { publicUrl: data.publicUrl, error: null };
    } catch (e) {
        return { publicUrl: null, error: e as Error };
    }
};

export const deleteRealisationPhoto = async (
    publicUrl: string,
): Promise<{ error: Error | null }> => {
    try {
        const match = publicUrl.match(/realisation-photos\/(.+)$/);
        if (!match) return { error: new Error('URL invalide') };
        const { error } = await supabase.storage.from('realisation-photos').remove([match[1]]);
        return { error: error ?? null };
    } catch (e) {
        return { error: e as Error };
    }
};

// ==========================================
// TISSUS (Module 6)
// ==========================================

import type { Tissu } from '../types';

export const mapTissu = (row: any): Tissu => ({
    id:               row.id,
    couturierId:      row.couturier_id,
    typeTissu:        row.type_tissu,
    nomCommercial:    row.nom_commercial,
    couleur:          row.couleur       ?? '',
    fournisseur:      row.fournisseur   ?? undefined,
    prixUnitaire:     Number(row.prix_unitaire)       ?? 0,
    quantiteUtilisee: Number(row.quantite_utilisee)   ?? 0,
    photo:            row.photo         ?? undefined,
    createdAt:        new Date(row.created_at),
    updatedAt:        new Date(row.updated_at),
});

export const tissuService = {
    getAll: async () => {
        const userId = await getUserId();
        return supabase
            .from('tissus')
            .select('*')
            .eq('couturier_id', userId)
            .order('created_at', { ascending: false });
    },

    create: async (
        data: Omit<Tissu, 'id' | 'createdAt' | 'updatedAt' | 'couturierId'>,
    ) => {
        const userId = await getUserId();
        return supabase
            .from('tissus')
            .insert({
                couturier_id:      userId,
                type_tissu:        data.typeTissu,
                nom_commercial:    data.nomCommercial,
                couleur:           data.couleur,
                fournisseur:       data.fournisseur    ?? null,
                prix_unitaire:     data.prixUnitaire,
                quantite_utilisee: data.quantiteUtilisee,
                photo:             data.photo          ?? null,
            })
            .select()
            .single();
    },

    update: async (
        tissuId: string,
        data: Partial<Omit<Tissu, 'id' | 'createdAt' | 'updatedAt' | 'couturierId'>>,
    ) => {
        const patch: Record<string, unknown> = {};
        if (data.typeTissu        !== undefined) patch.type_tissu        = data.typeTissu;
        if (data.nomCommercial    !== undefined) patch.nom_commercial    = data.nomCommercial;
        if (data.couleur          !== undefined) patch.couleur           = data.couleur;
        if (data.fournisseur      !== undefined) patch.fournisseur       = data.fournisseur ?? null;
        if (data.prixUnitaire     !== undefined) patch.prix_unitaire     = data.prixUnitaire;
        if (data.quantiteUtilisee !== undefined) patch.quantite_utilisee = data.quantiteUtilisee;
        if (data.photo            !== undefined) patch.photo             = data.photo ?? null;
        return supabase.from('tissus').update(patch).eq('id', tissuId).select().single();
    },

    delete: async (tissuId: string) =>
        supabase.from('tissus').delete().eq('id', tissuId),
};

// ── Supabase Storage — Photos tissus ────────────────────────────────
export const uploadTissuPhoto = async (
    localUri: string,
    couturierId: string,
    tissuId: string,
): Promise<{ publicUrl: string | null; error: Error | null }> => {
    try {
        const ext      = (localUri.split('.').pop()?.toLowerCase() ?? 'jpg').split('?')[0];
        const fileName = `${couturierId}/${tissuId}/${Date.now()}.${ext}`;
        const response = await fetch(localUri);
        const blob     = await response.blob();
        const buffer   = await blob.arrayBuffer();
        const { error } = await supabase.storage
            .from('tissu-photos')
            .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: true });
        if (error) return { publicUrl: null, error };
        const { data } = supabase.storage.from('tissu-photos').getPublicUrl(fileName);
        return { publicUrl: data.publicUrl, error: null };
    } catch (e) {
        return { publicUrl: null, error: e as Error };
    }
};

// ==========================================
// HISTORIQUE STATUTS COMMANDE (Module 7)
// ==========================================

export const historiqueStatutService = {
    create: async (
        commandeId: string,
        ancienStatut: string | undefined,
        nouveauStatut: string,
        commentaire?: string,
    ) => {
        const userId = await getUserId();
        return supabase.from('historique_statuts_commande').insert({
            commande_id:    commandeId,
            couturier_id:   userId,
            ancien_statut:  ancienStatut ?? null,
            nouveau_statut: nouveauStatut,
            commentaire:    commentaire ?? null,
        });
    },

    getByCommande: async (commandeId: string) =>
        supabase
            .from('historique_statuts_commande')
            .select('*')
            .eq('commande_id', commandeId)
            .order('created_at', { ascending: false }),
};

// ==========================================
// PAIEMENTS — extensions Module 8
// ==========================================

/** Mapper enrichi (inclut type Module 8) */
const mapPaymentM8 = (row: any) => ({
    id:            row.id,
    orderId:       row.order_id,
    amount:        Number(row.amount),
    typePaiement:  (row.type ?? 'acompte') as string,
    paymentMethod: row.method,
    paymentDate:   row.date,
    notes:         row.notes ?? undefined,
});

/** Tous les paiements d'un client (toutes commandes) */
export const paiementClientService = {
    getByClient: async (clientId: string, allOrderIds: string[]) => {
        if (allOrderIds.length === 0) return { data: [], error: null };
        return supabase
            .from('payments')
            .select('*')
            .in('order_id', allOrderIds)
            .order('date', { ascending: false });
    },
};

/** Crée un paiement avec type Module 8 */
export const createPaiementM8 = async (params: {
    orderId: string;
    clientId?: string;
    amount: number;
    method: string;
    typePaiement?: string;
    notes?: string;
}) => {
    const userId = await getUserId();

    // client_id est obligatoire dans la table `payments`. Si l'appelant ne
    // le fournit pas, on le récupère depuis la commande pour rester robuste.
    let clientId = params.clientId;
    if (!clientId) {
        const { data: orderRow, error: orderErr } = await supabase
            .from('orders')
            .select('client_id')
            .eq('id', params.orderId)
            .single();
        if (orderErr || !orderRow) {
            return { data: null, error: orderErr ?? new Error('Commande introuvable pour ce paiement.') };
        }
        clientId = orderRow.client_id;
    }

    return supabase
        .from('payments')
        .insert({
            order_id:     params.orderId,
            couturier_id: userId,
            client_id:    clientId,
            amount:       params.amount,
            method:       params.method,
            type:         params.typePaiement ?? 'acompte',
            notes:        params.notes ?? null,
            date:         new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();
};

// ==========================================
// COMPTABILITÉ (Module 9)
// ==========================================

export const comptabiliteService = {
    /** Charge tous les paiements du couturier (sans filtre date) */
    getAllPayments: async () => {
        const userId = await getUserId();
        return supabase
            .from('payments')
            .select('id, order_id, amount, type, method, date, notes, created_at')
            .eq('couturier_id', userId)
            .order('date', { ascending: false });
    },

    /** Charge toutes les commandes avec client_name, remaining_amount */
    getAllOrders: async () => {
        const userId = await getUserId();
        return supabase
            .from('orders')
            .select('id, client_id, client_name, total_price, remaining_amount, payment_status, order_status, created_at, numero_commande, advance_payment')
            .eq('couturier_id', userId)
            .neq('order_status', 'cancelled');
    },
};

// ==========================================
// RECHERCHE GLOBALE (Module 10)
// ==========================================

export interface ResultatRecherche {
    realisationId:  string;
    clientId:       string;
    clientNom:      string;
    tissuLabel?:    string;
    couleur?:       string;
    statut:         string;
    dateCreation:   string;     // ISO date
    commandeId?:    string;
    numeroCommande?: string;
    rank:           number;
}

export const rechercheService = {
    /**
     * Recherche full-text sur les réalisations.
     * Utilise la fonction PostgreSQL `rechercher_realisations`
     * qui s'appuie sur websearch_to_tsquery (PAS de LIKE).
     */
    search: async (params: {
        query?:    string;
        statut?:   string;
        dateFrom?: string;   // YYYY-MM-DD
        dateTo?:   string;   // YYYY-MM-DD
    }): Promise<{ data: ResultatRecherche[]; error: any }> => {
        try {
            const { data, error } = await supabase.rpc('rechercher_realisations', {
                p_query:     params.query     || null,
                p_couturier: null,             // resolved from JWT in the function
                p_statut:    params.statut    || null,
                p_date_from: params.dateFrom  || null,
                p_date_to:   params.dateTo    || null,
            });

            if (error) return { data: [], error };

            return {
                data: (data as any[]).map(r => ({
                    realisationId:  r.realisation_id,
                    clientId:       r.client_id,
                    clientNom:      r.client_nom ?? '—',
                    tissuLabel:     r.tissu_label ?? undefined,
                    couleur:        r.couleur     ?? undefined,
                    statut:         r.statut,
                    dateCreation:   r.date_creation,
                    commandeId:     r.commande_id   ?? undefined,
                    numeroCommande: r.numero_commande ?? undefined,
                    rank:           Number(r.rank ?? 0),
                })),
                error: null,
            };
        } catch (e) {
            return { data: [], error: e };
        }
    },
};

// ==========================================
// PROJETS / COMMANDES GROUPÉES (Module 13)
// ==========================================

import type { Project, ProjectRecap, ProjectParticipant, ProjectStatut, GarmentMeasurementField, TypeVetement as TypeVetementProjet } from '../types';

export const mapProject = (row: any): Project => ({
    id:            row.id,
    couturierId:   row.couturier_id,
    clientId:      row.client_id,
    nom:           row.nom,
    typeProjet:    row.type_projet ?? undefined,
    statut:        row.statut as ProjectStatut,
    dateEvenement: row.date_evenement ? new Date(row.date_evenement) : undefined,
    notes:         row.notes ?? undefined,
    createdAt:     new Date(row.created_at),
    updatedAt:     new Date(row.updated_at ?? row.created_at),
    deletedAt:     row.deleted_at ? new Date(row.deleted_at) : null,
});

export const mapProjectRecap = (row: any): ProjectRecap => ({
    projectId:           row.project_id,
    couturierId:         row.couturier_id,
    nom:                 row.nom,
    statut:              row.statut as ProjectStatut,
    dateEvenement:       row.date_evenement ? new Date(row.date_evenement) : undefined,
    nbPersonnes:         Number(row.nb_personnes ?? 0),
    nbVetements:         Number(row.nb_vetements ?? 0),
    nbVetementsTermines: Number(row.nb_vetements_termines ?? 0),
    montantTotal:        Number(row.montant_total ?? 0),
    totalPaye:           Number(row.total_paye ?? 0),
    resteAPayer:         Number(row.reste_a_payer ?? 0),
});

export const projectService = {

    /** Récupère tous les projets du couturier (non supprimés) */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('couturier_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    getById: async (projectId: string) => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        return { data, error };
    },

    /** Récapitulatif agrégé (personnes, vêtements, montants) — vue `vue_projet_recap` */
    getRecap: async (projectId: string) => {
        const { data, error } = await supabase
            .from('vue_projet_recap')
            .select('*')
            .eq('project_id', projectId)
            .single();
        return { data, error };
    },

    /** Récapitulatifs de tous les projets du couturier (pour la liste) */
    getAllRecaps: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('vue_projet_recap')
            .select('*')
            .eq('couturier_id', userId)
            .order('date_evenement', { ascending: true, nullsFirst: false });
        return { data, error };
    },

    create: async (project: {
        clientId: string;
        nom: string;
        typeProjet?: string;
        statut?: ProjectStatut;
        dateEvenement?: Date;
        notes?: string;
    }) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('projects')
            .insert({
                couturier_id:   userId,
                client_id:      project.clientId,
                nom:            project.nom,
                type_projet:    project.typeProjet ?? null,
                statut:         project.statut ?? 'brouillon',
                date_evenement: project.dateEvenement?.toISOString().split('T')[0] ?? null,
                notes:          project.notes ?? null,
            })
            .select()
            .single();
        return { data, error };
    },

    update: async (projectId: string, updates: Partial<Project>) => {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.nom            !== undefined) patch.nom            = updates.nom;
        if (updates.typeProjet     !== undefined) patch.type_projet    = updates.typeProjet;
        if (updates.statut         !== undefined) patch.statut         = updates.statut;
        if (updates.dateEvenement  !== undefined) patch.date_evenement = updates.dateEvenement?.toISOString().split('T')[0] ?? null;
        if (updates.notes          !== undefined) patch.notes          = updates.notes;
        const { data, error } = await supabase
            .from('projects')
            .update(patch)
            .eq('id', projectId)
            .select()
            .single();
        return { data, error };
    },

    /** Soft delete, cohérent avec `clients`/`catalog` */
    delete: async (projectId: string) => {
        const { error } = await supabase
            .from('projects')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', projectId);
        return { error };
    },
};

// ==========================================
// PARTICIPANTS DE PROJET (Module 13)
// ==========================================

export const mapParticipant = (row: any): ProjectParticipant => ({
    id:           row.id,
    projectId:    row.project_id,
    couturierId:  row.couturier_id,
    clientId:     row.client_id ?? null,
    nom:          row.nom,
    telephone:    row.telephone ?? undefined,
    role:         row.role ?? undefined,
    isTemporary:  row.is_temporary ?? true,
    createdAt:    new Date(row.created_at),
});

export const participantService = {

    getByProject: async (projectId: string) => {
        const { data, error } = await supabase
            .from('project_participants')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });
        return { data, error };
    },

    create: async (participant: {
        projectId: string;
        clientId?: string;
        nom: string;
        telephone?: string;
        role?: string;
        isTemporary?: boolean;
    }) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('project_participants')
            .insert({
                project_id:   participant.projectId,
                couturier_id: userId,
                client_id:    participant.clientId ?? null,
                nom:          participant.nom,
                telephone:    participant.telephone ?? null,
                role:         participant.role ?? null,
                is_temporary: participant.isTemporary ?? !participant.clientId,
            })
            .select()
            .single();
        return { data, error };
    },

    update: async (participantId: string, updates: Partial<ProjectParticipant>) => {
        const patch: Record<string, unknown> = {};
        if (updates.clientId    !== undefined) patch.client_id    = updates.clientId;
        if (updates.nom         !== undefined) patch.nom          = updates.nom;
        if (updates.telephone   !== undefined) patch.telephone    = updates.telephone;
        if (updates.role        !== undefined) patch.role         = updates.role;
        if (updates.isTemporary !== undefined) patch.is_temporary = updates.isTemporary;
        const { data, error } = await supabase
            .from('project_participants')
            .update(patch)
            .eq('id', participantId)
            .select()
            .single();
        return { data, error };
    },

    /**
     * "Promeut" un participant temporaire en client réel de l'atelier
     * (crée la fiche `clients` puis relie `client_id` sur le participant).
     */
    promoteToClient: async (participantId: string, clientData: { telephone: string; sexe?: 'homme' | 'femme' | 'autre' }) => {
        const userId = await getUserId();
        const { data: participant, error: fetchError } = await supabase
            .from('project_participants')
            .select('*')
            .eq('id', participantId)
            .single();
        if (fetchError || !participant) return { data: null, error: fetchError };

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                couturier_id: userId,
                nom:          participant.nom,
                telephone:    clientData.telephone,
                sexe:         clientData.sexe ?? 'autre',
            })
            .select()
            .single();
        if (clientError || !client) return { data: null, error: clientError };

        const { data, error } = await supabase
            .from('project_participants')
            .update({ client_id: client.id, is_temporary: false })
            .eq('id', participantId)
            .select()
            .single();
        return { data, error };
    },

    delete: async (participantId: string) => {
        const { error } = await supabase
            .from('project_participants')
            .delete()
            .eq('id', participantId);
        return { error };
    },
};

// ==========================================
// MESURES CONFIGURABLES PAR TYPE DE VÊTEMENT (Module 13)
// ==========================================

export const mapMeasurementField = (row: any): GarmentMeasurementField => ({
    id:           row.id,
    couturierId:  row.couturier_id ?? null,
    typeVetement: row.type_vetement,
    fieldKey:     row.field_key,
    label:        row.label,
    uniteDefaut:  row.unite_defaut,
    sortOrder:    row.sort_order ?? 0,
    createdAt:    new Date(row.created_at),
});

export const measurementFieldService = {

    /** Récupère les champs de mesure d'un type de vêtement (globaux + personnalisés par le couturier), triés */
    getForType: async (typeVetement: TypeVetementProjet) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('garment_measurement_fields')
            .select('*')
            .eq('type_vetement', typeVetement)
            .or(`couturier_id.is.null,couturier_id.eq.${userId}`)
            .order('sort_order', { ascending: true });
        return { data, error };
    },

    /** Récupère tous les champs, groupés côté client par type de vêtement */
    getAll: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('garment_measurement_fields')
            .select('*')
            .or(`couturier_id.is.null,couturier_id.eq.${userId}`)
            .order('type_vetement', { ascending: true })
            .order('sort_order', { ascending: true });
        return { data, error };
    },

    /** Ajoute un champ de mesure personnalisé (ou un nouveau type de vêtement complet) */
    create: async (field: {
        typeVetement: string;
        fieldKey: string;
        label: string;
        uniteDefaut?: 'cm' | 'pouces';
        sortOrder?: number;
    }) => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('garment_measurement_fields')
            .insert({
                couturier_id:  userId, // champ personnalisé du couturier (jamais global)
                type_vetement: field.typeVetement,
                field_key:     field.fieldKey,
                label:         field.label,
                unite_defaut:  field.uniteDefaut ?? 'cm',
                sort_order:    field.sortOrder ?? 0,
            })
            .select()
            .single();
        return { data, error };
    },

    delete: async (fieldId: string) => {
        const { error } = await supabase
            .from('garment_measurement_fields')
            .delete()
            .eq('id', fieldId);
        return { error };
    },
};