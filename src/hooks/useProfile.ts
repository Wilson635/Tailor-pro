import { useEffect, useState } from 'react';
import { useAppStore, type UserProfile } from '@store/useAppStore';

export type { UserProfile };

export const useProfile = () => {
  const profile = useAppStore(s => s.profile);
  const fetchProfile = useAppStore(s => s.fetchProfile);
  const updateProfile = useAppStore(s => s.updateProfile);
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!useAppStore.getState().profile) {
          await fetchProfile();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
};
