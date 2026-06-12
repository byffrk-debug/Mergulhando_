import React, { useRef, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { normalizeImageUrl } from '../utils/driveImage';

interface CoverUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export function CoverUpload({ value, onChange, folder = 'misc', label = 'Capa 9:16' }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { return; }
    if (file.size > 5 * 1024 * 1024) { return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true });
      if (error) { console.error(error); return; }
      const { data } = supabase.storage.from('covers').getPublicUrl(path);
      onChange(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        {/* Preview 9:16 */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="relative flex-shrink-0 w-24 rounded-xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 hover:border-cyan-500 transition-colors group"
          style={{ aspectRatio: '9/16' }}
        >
          {value ? (
            <img src={normalizeImageUrl(value)} alt="Capa" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-600 group-hover:text-cyan-500 transition-colors">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  <span className="text-[9px] text-center leading-tight px-1">9:16<br/>Capa</span>
                </>
              )}
            </div>
          )}
          {value && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
          )}
        </button>

        {/* URL input */}
        <div className="flex-1 space-y-2">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Cole URL da imagem ou clique na área para fazer upload"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-xs"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Enviando...' : 'Upload arquivo'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-lg text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remover
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
