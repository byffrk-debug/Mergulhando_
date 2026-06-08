import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HomeConfig {
  id: number;
  banner_image_url: string | null;
  welcome_video_url: string | null;
  welcome_video_title: string | null;
}

const DEFAULT: HomeConfig = {
  id: 1,
  banner_image_url: null,
  welcome_video_url: null,
  welcome_video_title: 'Bem-vindo ao Mergulhando na Palavra',
};

export function useHomeConfig() {
  const [config, setConfig] = useState<HomeConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    const { data } = await supabase.from('home_config').select('*').eq('id', 1).maybeSingle();
    if (data) setConfig(data);
    setLoading(false);
  };

  useEffect(() => { fetchConfig(); }, []);

  const updateConfig = async (patch: Partial<Omit<HomeConfig, 'id'>>) => {
    const { error } = await supabase
      .from('home_config')
      .upsert({ id: 1, ...patch }, { onConflict: 'id' });
    if (!error) setConfig(prev => ({ ...prev, ...patch }));
    return error;
  };

  return { config, loading, updateConfig, refetch: fetchConfig };
}
