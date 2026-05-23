import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getCleanStreak, getTierKeyFromStreak } from '../lib/utils';

export function useChallenge(user) {
  const [challengeData, setChallengeData] = useState(Array(30).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChallengeData(Array(30).fill(0));
      setLoading(false);
      return;
    }
    fetchChallenge();
  }, [user]);

  async function fetchChallenge() {
    setLoading(true);
    const { data, error } = await supabase
      .from('challenge_trades')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const arr = Array(30).fill(0);
      data.forEach(row => {
        if (row.trade_index >= 0 && row.trade_index < 30) {
          arr[row.trade_index] = row.status;
        }
      });
      setChallengeData(arr);
    }
    setLoading(false);
  }

  async function updateTrade(index, status) {
    if (!user) return;
    const { data, error } = await supabase
      .from('challenge_trades')
      .upsert(
        { user_id: user.id, trade_index: index, status },
        { onConflict: 'user_id,trade_index' }
      )
      .select()
      .single();

    if (!error) {
      setChallengeData(prev => {
        const next = [...prev];
        next[index] = status;
        return next;
      });
    }
  }

  async function resetChallenge() {
    if (!user) return;
    const { error } = await supabase
      .from('challenge_trades')
      .delete()
      .eq('user_id', user.id);

    if (!error) setChallengeData(Array(30).fill(0));
  }

  const cleanStreak = useMemo(() => getCleanStreak(challengeData), [challengeData]);
  const currentTierKey = useMemo(() => getTierKeyFromStreak(cleanStreak), [cleanStreak]);

  return {
    challengeData,
    loading,
    updateTrade,
    resetChallenge,
    cleanStreak,
    currentTierKey,
  };
}
