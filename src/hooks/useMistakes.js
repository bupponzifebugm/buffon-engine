import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function useMistakes(user) {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMistakes([]);
      setLoading(false);
      return;
    }
    fetchMistakes();
  }, [user]);

  async function fetchMistakes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('mistake_receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setMistakes(data);
    setLoading(false);
  }

  async function addMistake(m) {
    if (!user) return;
    const { data, error } = await supabase
      .from('mistake_receipts')
      .insert({
        user_id: user.id,
        ticker: m.ticker,
        mistake_type: m.mistake_type,
        tuition_loss: m.tuition_loss,
        notes: m.notes,
        action_plan: m.action_plan,
      })
      .select()
      .single();

    if (!error && data) {
      setMistakes(prev => [data, ...prev]);
    }
  }

  async function deleteMistake(id) {
    const { error } = await supabase
      .from('mistake_receipts')
      .delete()
      .eq('id', id);

    if (!error) {
      setMistakes(prev => prev.filter(m => m.id !== id));
    }
  }

  const totalTuition = useMemo(
    () => mistakes.reduce((sum, m) => sum + (m.tuition_loss || 0), 0),
    [mistakes]
  );

  const mostCommonMistake = useMemo(() => {
    if (mistakes.length === 0) return '—';
    const counts = {};
    mistakes.forEach(m => {
      counts[m.mistake_type] = (counts[m.mistake_type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [mistakes]);

  return {
    mistakes,
    loading,
    addMistake,
    deleteMistake,
    totalTuition,
    mostCommonMistake,
  };
}
