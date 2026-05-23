import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useJournal(user) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setActiveNote(null);
      setLoading(false);
      return;
    }
    fetchNotes();
  }, [user]);

  async function fetchNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setNotes(data);
    setLoading(false);
  }

  async function createNote() {
    if (!user) return;
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: '',
        content: '',
      })
      .select()
      .single();

    if (!error && data) {
      setNotes(prev => [data, ...prev]);
      setActiveNote(data);
    }
  }

  function openNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) setActiveNote(note);
  }

  async function updateNote(id, updates) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setNotes(prev => prev.map(n => (n.id === id ? data : n)));
      if (activeNote && activeNote.id === id) {
        setActiveNote(data);
      }
    }
  }

  async function deleteNote(id) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNote && activeNote.id === id) {
        setActiveNote(null);
      }
    }
  }

  async function uploadImage(file) {
    if (!user) return null;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('journal-images')
      .upload(path, file);

    if (error) {
      console.error('Image upload failed:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('journal-images')
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  return {
    notes,
    activeNote,
    loading,
    createNote,
    openNote,
    updateNote,
    deleteNote,
    uploadImage,
  };
}
