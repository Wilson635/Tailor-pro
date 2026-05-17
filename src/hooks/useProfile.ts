// ==========================================
// HOOK PERSO - RECUPERATION DU PROFIL UTILISATEUR
// ==========================================

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

// Interface alignée avec le store et le Dashboard
export interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    atelier_name: string | null;
    phone: string | null;
    role: 'tailor' | 'client'; // <-- Ajout crucial pour le routage dynamique
}

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setLoading(false);
                    return;
                }

                // Sélection explicite des champs requis, incluant le rôle
                const { data, error } = await supabase
                    .from('users')
                    .select('id, email, display_name, atelier_name, phone, role')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setProfile(data as UserProfile);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
            } finally {
                // S'assure que le chargement se coupe dans tous les scénarios (succès ou échec)
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    return { profile, loading };
};

/****

// src/hooks/useProfile.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    atelier_name: string | null;
    phone: string | null;
}

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error) setProfile(data);
            setLoading(false);
        };

        fetchProfile();
    }, []);

    return { profile, loading };
};*/