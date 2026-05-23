import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getTodayString, getWeekStartString, getMonthStartString } from '../lib/utils';

export function usePositions(user) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPositions([]);
      setLoading(false);
      return;
    }
    fetchPositions();
  }, [user]);

  async function fetchPositions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setPositions(data);
    setLoading(false);
  }

  async function addPosition(pos) {
    if (!user) return;
    const { data, error } = await supabase
      .from('positions')
      .insert({
        user_id: user.id,
        ticker: pos.ticker,
        lots: pos.lots,
        entry_price: pos.entry_price,
        sl_price: pos.sl_price,
        tp1_price: pos.tp1_price,
        tp2_price: pos.tp2_price,
        status: pos.status,
        exit_price: pos.exit_price,
        pnl: pos.pnl,
        trade_date: pos.trade_date,
        emotion: pos.emotion || 'calm',
        is_violation: pos.is_violation || false,
        violation_reason: pos.violation_reason || '',
      })
      .select()
      .single();

    if (!error && data) {
      setPositions(prev => [data, ...prev]);
    }
  }

  async function deletePosition(id) {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);

    if (!error) {
      setPositions(prev => prev.filter(p => p.id !== id));
    }
  }

  async function clearPositions() {
    if (!user) return;
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('user_id', user.id);

    if (!error) setPositions([]);
  }

  async function updatePosition(id, updates) {
    const { data, error } = await supabase
      .from('positions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setPositions(prev => prev.map(p => (p.id === id ? data : p)));
    }
  }

  const totalPnl = useMemo(
    () => positions.reduce((sum, p) => sum + (p.pnl || 0), 0),
    [positions]
  );

  const dailyPnl = useMemo(() => {
    const today = getTodayString();
    return positions
      .filter(p => p.trade_date === today)
      .reduce((sum, p) => sum + (p.pnl || 0), 0);
  }, [positions]);

  const weeklyPnl = useMemo(() => {
    const weekStart = getWeekStartString();
    return positions
      .filter(p => p.trade_date >= weekStart)
      .reduce((sum, p) => sum + (p.pnl || 0), 0);
  }, [positions]);

  const monthlyPnl = useMemo(() => {
    const monthStart = getMonthStartString();
    return positions
      .filter(p => p.trade_date >= monthStart)
      .reduce((sum, p) => sum + (p.pnl || 0), 0);
  }, [positions]);

  return {
    positions,
    loading,
    addPosition,
    deletePosition,
    clearPositions,
    updatePosition,
    totalPnl,
    dailyPnl,
    weeklyPnl,
    monthlyPnl,
  };
}
