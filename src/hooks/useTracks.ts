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
    // Remove campos undefined para não causar erros de schema no Supabase
    const payload: Record<string, unknown> = { name: track.name, order_index: track.order_index };
    if (track.description) payload.description = track.description;
    if (track.thumbnail_url) payload.thumbnail_url = track.thumbnail_url;
    if (track.banner_url) payload.banner_url = track.banner_url;

    const { data, error } = await supabase.from('tracks').insert([payload]).select().single();
    if (error) { console.error('addTrack error:', error); return null; }
    if (data) {
      setTracks(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
    }
    return data;
  };

  const updateTrack = async (id: string, patch: Partial<Omit<Track, 'id'>>) => {
    const { data, error } = await supabase.from('tracks').update(patch).eq('id', id).select().single();
    if (error) { console.error('updateTrack error:', error); return null; }
    if (data) {
      setTracks(prev => prev.map(t => (t.id === id ? data : t)).sort((a, b) => a.order_index - b.order_index));
    }
    return data;
  };

  const deleteTrack = async (id: string) => {
    const { error } = await supabase.from('tracks').delete().eq('id', id);
    if (error) { console.error('deleteTrack error:', error); return; }
    setTracks(prev => prev.filter(t => t.id !== id));
    setTrackModules(prev => prev.filter(tm => tm.track_id !== id));
  };

  const addModuleToTrack = async (trackId: string, moduleName: string, orderIndex: number) => {
    const { data, error } = await supabase
      .from('track_modules')
      .insert([{ track_id: trackId, module_name: moduleName, order_index: orderIndex }])
      .select()
      .single();
    if (error) { console.error('addModuleToTrack error:', error); return; }
    if (data) setTrackModules(prev => [...prev, data]);
  };

  const removeModuleFromTrack = async (trackId: string, moduleName: string) => {
    const { error } = await supabase
      .from('track_modules')
      .delete()
      .eq('track_id', trackId)
      .eq('module_name', moduleName);
    if (error) { console.error('removeModuleFromTrack error:', error); return; }
    setTrackModules(prev =>
      prev.filter(tm => !(tm.track_id === trackId && tm.module_name === moduleName))
    );
  };

  const getTrackModules = (trackId: string) =>
    trackModules
      .filter(tm => tm.track_id === trackId)
      .sort((a, b) => a.order_index - b.order_index);

  return { tracks, trackModules, loading, addTrack, updateTrack, deleteTrack, addModuleToTrack, removeModuleFromTrack, getTrackModules, refetch: fetchTracks };
}
