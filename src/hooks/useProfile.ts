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
};