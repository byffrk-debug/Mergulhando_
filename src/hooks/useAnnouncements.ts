import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Announcement } from '../types';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('order_index')
      .then(({ data }) => { if (data) setAnnouncements(data); });
  }, []);

  const addAnnouncement = async (ann: Omit<Announcement, 'id'>) => {
    const { data } = await supabase.from('announcements').insert([ann]).select().single();
    if (data) setAnnouncements(prev => [...prev, data]);
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return { announcements, addAnnouncement, deleteAnnouncement };
}
