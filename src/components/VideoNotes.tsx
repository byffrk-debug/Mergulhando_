import { useState, useEffect } from 'react';
import { Pencil, Save, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  videoId: string;
  userId: string;
}

export function VideoNotes({ videoId, userId }: Props) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    setNote('');
    supabase
      .from('video_notes')
      .select('content')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle()
      .then(({ data }) => {
        setNote(data?.content ?? '');
        setLoading(false);
      });
  }, [videoId, userId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('video_notes').upsert(
      {
        user_id: userId,
        video_id: videoId,
        content: note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-5 bg-gray-900 border-t border-gray-800/60">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Pencil className="w-4 h-4 text-yellow-400" />
        Minhas Anotações
      </h4>

      {loading ? (
        <div className="animate-pulse h-20 bg-gray-800/60 rounded-xl" />
      ) : (
        <>
          <textarea
            value={note}
            onChange={e => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder="Escreva suas reflexões, insights e anotações desta aula…"
            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 resize-none min-h-[88px] placeholder-gray-600 custom-scrollbar"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar Anotação'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
