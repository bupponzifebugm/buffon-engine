import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check if user was previously using Offline/Local mode
    if (localStorage.getItem('buffon_auth_offline') === 'true') {
      const offlineUser = { id: LOCAL_USER_ID, email: 'buffonfebugm@gmail.com' };
      const storedProfile = localStorage.getItem(`buffon_profile_${LOCAL_USER_ID}`);
      const offlineProfile = storedProfile ? JSON.parse(storedProfile) : {
        id: LOCAL_USER_ID,
        display_name: 'Buffon Trader',
        active_capital: 10000000,
        current_tier: 'survival_10m',
        gamification_state: {
          heavy_shield: 0,
          ult_points: 0,
          is_eco_round: false,
          is_ult_active: false,
          xp_patience: 0,
          xp_execution: 0,
          xp_risk: 0,
          unlocked_loots: ['theme_default'],
          active_loot: 'theme_default',
          custom_bounty: { name: 'Reward Name', target_rr: 500, current_rr: 0 }
        }
      };
      setUser(offlineUser);
      setProfile(offlineProfile);
      setLoading(false);
      return;
    }

    // Timeout safeguard: never let the app hang on loading spinner for more than 2.5s
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timed out, proceeding to UI');
        setLoading(false);
      }
    }, 2500);

    // Get initial session
    try {
      supabase.auth.getSession()
        .then(({ data: { session } = {} }) => {
          clearTimeout(timeout);
          if (!isMounted) return;
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('Supabase auth session error:', err);
          if (isMounted) setLoading(false);
        });
    } catch (err) {
      clearTimeout(timeout);
      console.error('Initial getSession threw:', err);
      if (isMounted) setLoading(false);
    }

    // Listen for auth changes
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
      subscription = data?.subscription;
    } catch (e) {
      console.error('onAuthStateChange error:', e);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Listen for real-time profile updates across devices
  useEffect(() => {
    if (!user) return;

    let profileChannel = null;
    try {
      profileChannel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            console.log('Realtime profile update received', payload.new);
            setProfile(payload.new);
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Realtime channel error:', err);
    }

    return () => {
      if (profileChannel) {
        try {
          supabase.removeChannel(profileChannel);
        } catch (e) {}
      }
    };
  }, [user]);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      let profileData = null;
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet, create it
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId, display_name: 'Trader', active_capital: 10000000, current_tier: 'survival_10m' })
          .select()
          .single();
        profileData = newProfile;
      } else {
        profileData = data;
      }

      if (profileData) {
        // Fallback: if gamification_state is null or empty, load from localStorage
        if (!profileData.gamification_state) {
          const stored = localStorage.getItem(`buffon_gamification_state_${userId}`);
          if (stored) {
            try {
              profileData.gamification_state = JSON.parse(stored);
            } catch (e) {
              console.error('Error parsing local gamification_state fallback:', e);
            }
          }
        }
        setProfile(profileData);
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
    } finally {
      setLoading(false);
    }
  }

  const LOCAL_USER_ID = 'local-trader';

  function loginOffline() {
    const offlineUser = { id: LOCAL_USER_ID, email: 'buffonfebugm@gmail.com' };
    const storedProfile = localStorage.getItem(`buffon_profile_${LOCAL_USER_ID}`);
    const offlineProfile = storedProfile ? JSON.parse(storedProfile) : {
      id: LOCAL_USER_ID,
      display_name: 'Buffon Trader',
      active_capital: 10000000,
      current_tier: 'survival_10m',
      gamification_state: {
        heavy_shield: 0,
        ult_points: 0,
        is_eco_round: false,
        is_ult_active: false,
        xp_patience: 0,
        xp_execution: 0,
        xp_risk: 0,
        unlocked_loots: ['theme_default'],
        active_loot: 'theme_default',
        custom_bounty: { name: 'Reward Name', target_rr: 500, current_rr: 0 }
      }
    };
    localStorage.setItem('buffon_auth_offline', 'true');
    localStorage.setItem(`buffon_profile_${LOCAL_USER_ID}`, JSON.stringify(offlineProfile));
    setUser(offlineUser);
    setProfile(offlineProfile);
    setLoading(false);
  }

  async function updateProfile(updates) {
    if (!user) return;
    if (user.id === LOCAL_USER_ID) {
      setProfile(prev => {
        const next = prev ? { ...prev, ...updates } : updates;
        localStorage.setItem(`buffon_profile_${LOCAL_USER_ID}`, JSON.stringify(next));
        return next;
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase profile update failed. Applying local fallback:', error);
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        if (updates.gamification_state) {
          localStorage.setItem(
            `buffon_gamification_state_${user.id}`,
            JSON.stringify(updates.gamification_state)
          );
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  }

  async function updateGamificationState(updates) {
    if (!profile) return;
    const currentState = profile.gamification_state || {
      heavy_shield: 0,
      ult_points: 0,
      is_eco_round: false,
      is_ult_active: false,
      xp_patience: 0,
      xp_execution: 0,
      xp_risk: 0,
      unlocked_loots: ['theme_default'],
      active_loot: 'theme_default',
      custom_bounty: { name: 'Reward Name', target_rr: 500, current_rr: 0 }
    };
    const newState = { ...currentState, ...updates };
    await updateProfile({ gamification_state: newState });
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error };
      }
      return { data, error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { 
        error: { 
          message: 'Supabase database is unreachable / paused. Click "Continue in Local Mode" below to open the dashboard immediately.' 
        } 
      };
    }
  }

  async function signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error };
      return { data, error: null };
    } catch (err) {
      console.error('Sign up exception:', err);
      return { 
        error: { 
          message: 'Supabase database is unreachable / paused. Click "Continue in Local Mode" below to open the dashboard immediately.' 
        } 
      };
    }
  }

  async function signOut() {
    localStorage.removeItem('buffon_auth_offline');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setProfile(null);
  }

  return { user, profile, loading, signIn, signUp, signOut, updateProfile, updateGamificationState, loginOffline };
}
