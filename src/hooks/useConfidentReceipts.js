import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useConfidentReceipts(user) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReceipts([]);
      setLoading(false);
      return;
    }
    fetchReceipts();
  }, [user]);

  async function fetchReceipts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('confident_receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setReceipts(data);
    setLoading(false);
  }

  async function addReceipt(r) {
    if (!user) return;
    const { data, error } = await supabase
      .from('confident_receipts')
      .insert({
        user_id: user.id,
        title: r.title,
        description: r.description,
        image_url: r.image_url,
      })
      .select()
      .single();

    if (!error && data) {
      setReceipts(prev => [data, ...prev]);
    }
  }

  async function deleteReceipt(id) {
    const { error } = await supabase
      .from('confident_receipts')
      .delete()
      .eq('id', id);

    if (!error) {
      setReceipts(prev => prev.filter(r => r.id !== id));
    }
  }

  return {
    receipts,
    loading,
    addReceipt,
    deleteReceipt,
  };
}
