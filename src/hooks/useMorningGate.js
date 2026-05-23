import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getTodayString } from '../lib/utils';

export function useMorningGate(user) {
  const [todaysGate, setTodaysGate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTodaysGate(null);
      setLoading(false);
      return;
    }
    fetchTodaysGate();
  }, [user]);

  async function fetchTodaysGate() {
    setLoading(true);
    const today = getTodayString();
    const { data, error } = await supabase
      .from('morning_gates')
      .select('*')
      .eq('user_id', user.id)
      .eq('gate_date', today)
      .single();

    if (!error && data) {
      setTodaysGate(data);
    }
    setLoading(false);
  }

  const isGateCompleted = todaysGate !== null;

  async function submitGate(focusScore, usdIdr, macro) {
    if (!user) return;
    const today = getTodayString();
    const { data, error } = await supabase
      .from('morning_gates')
      .insert({
        user_id: user.id,
        gate_date: today,
        focus_score: focusScore,
        usd_idr_rate: usdIdr,
        macro_env: macro,
      })
      .select()
      .single();

    if (!error && data) {
      setTodaysGate(data);
    }
  }

  const gateHistory = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('morning_gates')
      .select('*')
      .eq('user_id', user.id)
      .order('gate_date', { ascending: false })
      .limit(30);

    if (!error && data) return data;
    return [];
  }, [user]);

  return {
    todaysGate,
    loading,
    isGateCompleted,
    submitGate,
    gateHistory,
  };
}
