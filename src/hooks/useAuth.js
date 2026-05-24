import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet, create it
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: userId, display_name: 'Trader', active_capital: 10000000, current_tier: 'survival_10m' })
        .select()
        .single();
      setProfile(newProfile);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }

  async function updateProfile(updates) {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (data) setProfile(data);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, profile, loading, signIn, signUp, signOut, updateProfile, updateGamificationState };
}
