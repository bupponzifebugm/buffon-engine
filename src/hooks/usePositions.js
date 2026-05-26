import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getTodayString, getWeekStartString, getMonthStartString } from '../lib/utils';
import { GAMIFICATION_CONFIG } from '../lib/constants';

export function usePositions(user, profile, updateGamificationState) {
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

  // Listen for real-time positions updates across devices
  useEffect(() => {
    if (!user) return;

    const positionsChannel = supabase
      .channel('positions-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'positions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('Realtime positions update received', payload);
          fetchPositions(); // Just refetch to keep logic simple and ensure sorting
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(positionsChannel);
    };
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

  async function processGamification(pos) {
    if (!profile || !updateGamificationState) return pos.rr_awarded || 0;
    if (pos.status === 'open' || pos.status === 'pending' || pos.status === 'withdrawn') return pos.rr_awarded || 0;

    let finalRR = pos.rr_awarded || 0;
    const gState = profile.gamification_state || {
      heavy_shield: 0, ult_points: 0, is_eco_round: false, is_ult_active: false,
      xp_patience: 0, xp_execution: 0, xp_risk: 0, custom_bounty: { current_rr: 0, target_rr: 500 }
    };

    let newShield = gState.heavy_shield;
    let newUlt = gState.ult_points;
    let newIsUltActive = gState.is_ult_active;
    let newEco = gState.is_eco_round;
    
    const isWin = pos.pnl > 0;
    const processScore = pos.process_score || 0;
    const isPerfectProcess = processScore === 100;

    const today = getTodayString();
    const isFirstTradeToday = !positions.some(p => p.trade_date === today);
    if (isFirstTradeToday && isPerfectProcess) {
      finalRR += GAMIFICATION_CONFIG.FIRST_WIN_BONUS;
    }

    if (gState.is_ult_active) {
      if (isWin && processScore >= 66) finalRR *= 2;
      newIsUltActive = false;
      newUlt = 0;
    } else if (processScore >= 66) {
      newUlt = Math.min(GAMIFICATION_CONFIG.ULT_MAX, newUlt + 1);
    }

    if (finalRR < 0 && gState.heavy_shield >= GAMIFICATION_CONFIG.SHIELD_MAX) {
      finalRR = 0;
      newShield = 0;
    } else if (isPerfectProcess) {
      newShield = Math.min(GAMIFICATION_CONFIG.SHIELD_MAX, newShield + GAMIFICATION_CONFIG.SHIELD_INCREMENT);
    }

    if (gState.is_eco_round && processScore >= 66) {
      finalRR += 15;
      newEco = false;
    }

    const xpGain = isPerfectProcess ? 30 : (processScore >= 66 ? 20 : (processScore >= 33 ? 10 : 0));
    
    await updateGamificationState({
      heavy_shield: newShield,
      ult_points: newUlt,
      is_ult_active: newIsUltActive,
      is_eco_round: newEco,
      xp_execution: gState.xp_execution + xpGain,
      xp_risk: gState.xp_risk + xpGain,
      custom_bounty: {
        ...gState.custom_bounty,
        current_rr: Math.max(0, (gState.custom_bounty.current_rr || 0) + finalRR)
      }
    });

    return finalRR;
  }

  async function addPosition(pos) {
    if (!user) return;
    const finalRR = await processGamification(pos);

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
        process_score: pos.process_score || 0,
        rr_awarded: finalRR,
      })
      .select()
      .single();

    if (!error && data) {
      setPositions(prev => [data, ...prev]);
    } else if (error) {
      console.error('Supabase Insert Error:', error);
      alert('Error saving position: ' + error.message);
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

  async function updatePosition(id, updates, isClosing = false) {
    if (isClosing) {
      updates.rr_awarded = await processGamification({ ...updates });
    }

    const { data, error } = await supabase
      .from('positions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setPositions(prev => prev.map(p => (p.id === id ? data : p)));
    } else if (error) {
      console.error('Supabase Update Error:', error);
      alert('Error updating position: ' + error.message);
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
