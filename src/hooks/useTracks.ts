import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Track, TrackModule } from '../types';

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackModules, setTrackModules] = useState<TrackModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = async () => {
    const [tracksRes, modulesRes] = await Promise.all([
      supabase.from('tracks').select('*').order('order_index'),
      supabase.from('track_modules').select('*').order('order_index'),
    ]);
    if (tracksRes.data) setTracks(tracksRes.data);
    if (modulesRes.data) setTrackModules(modulesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchTracks(); }, []);

  const addTrack = async (track: Omit<Track, 'id'>) => {
    const { data } = await supabase.from('tracks').insert([track]).select().single();
    if (data) setTracks(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
    return data;
  };

  const deleteTrack = async (id: string) => {
    await supabase.from('tracks').delete().eq('id', id);
    setTracks(prev => prev.filter(t => t.id !== id));
    setTrackModules(prev => prev.filter(tm => tm.track_id !== id));
  };

  const addModuleToTrack = async (trackId: string, moduleName: string, orderIndex: number) => {
    const { data } = await supabase
      .from('track_modules')
      .insert([{ track_id: trackId, module_name: moduleName, order_index: orderIndex }])
      .select()
      .single();
    if (data) setTrackModules(prev => [...prev, data]);
  };

  const removeModuleFromTrack = async (trackId: string, moduleName: string) => {
    await supabase
      .from('track_modules')
      .delete()
      .eq('track_id', trackId)
      .eq('module_name', moduleName);
    setTrackModules(prev =>
      prev.filter(tm => !(tm.track_id === trackId && tm.module_name === moduleName))
    );
  };

  const getTrackModules = (trackId: string) =>
    trackModules
      .filter(tm => tm.track_id === trackId)
      .sort((a, b) => a.order_index - b.order_index);

  return { tracks, trackModules, loading, addTrack, deleteTrack, addModuleToTrack, removeModuleFromTrack, getTrackModules, refetch: fetchTracks };
}
