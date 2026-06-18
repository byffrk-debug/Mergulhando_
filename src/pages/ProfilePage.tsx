import React, { useRef, useState } from 'react';
import { Award, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { Video, User, UserRole } from '../types';

interface ProfilePageProps {
  user: User;
  role: UserRole;
  videos: Video[];
  userProgress: Record<string, boolean>;
  quizPassed: Record<string, boolean>;
  onAvatarUpdate: (url: string) => void;
}

export function ProfilePage({ user, role, videos, userProgress, quizPassed, onAvatarUpdate }: ProfilePageProps) {
  const completedCount = videos.filter(v => userProgress[v.id]).length;
  const totalVideos = videos.length;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  const modules = Array.from(new Set(videos.map(v => v.module)));
  const earnedCertificates = modules.filter(mod => {
    const modVids = videos.filter(v => v.module === mod);
    const allDone = modVids.length > 0 && modVids.every(v => userProgress[v.id]);
    return allDone && quizPassed[mod];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function getInitials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2 MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      // Upload para storage
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        toast.error('Erro ao enviar imagem: ' + uploadErr.message);
        return;
      }

      // URL pública
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`; // cache bust

      // Salvar em user_profiles (upsert: cria a linha se ainda não existir)
      const { error: dbErr } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, name: user.name, avatar_url: publicUrl }, { onConflict: 'user_id' });

      if (dbErr) {
        toast.error('Imagem enviada, mas erro ao salvar: ' + dbErr.message);
        return;
      }

      onAvatarUpdate(publicUrl);
      toast.success('Foto atualizada com sucesso!');
    } catch (err: unknown) {
      toast.error('Erro inesperado: ' + (err instanceof Error ? err.message : 'tente novamente'));
    } finally {
      setUploading(false);
      // Limpa o input para permitir re-upload da mesma imagem
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Meu Perfil</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-5 p-6 bg-gray-900 border border-gray-800 rounded-2xl mb-6">
        {/* Avatar clicável */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="relative w-20 h-20 rounded-full overflow-hidden group focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            title="Clique para trocar a foto"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                {getInitials(user.name)}
              </div>
            )}
            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />}
            </div>
          </button>

          {/* Ícone de câmera fixo no canto */}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-gray-900 pointer-events-none">
            <Camera className="w-3 h-3 text-gray-950" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400 text-sm truncate">{user.email}</p>
          <p className="text-xs text-gray-600 mt-1">Clique na foto para alterar</p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            role === 'admin' ? 'bg-cyan-500/20 text-cyan-300' :
            role === 'moderator' ? 'bg-purple-500/20 text-purple-300' :
            'bg-gray-700 text-gray-400'
          }`}>
            {role === 'admin' ? 'Administrador' : role === 'moderator' ? 'Moderador' : 'Aluno'}
          </span>
        </div>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl text-center">
          <p className="text-3xl font-bold text-cyan-400">{completedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Aulas concluídas</p>
        </div>
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl text-center">
          <p className="text-3xl font-bold text-pink-400">{progressPercent}%</p>
          <p className="text-sm text-gray-400 mt-1">Progresso geral</p>
        </div>
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl text-center">
          <p className="text-3xl font-bold text-yellow-400">{earnedCertificates.length}</p>
          <p className="text-sm text-gray-400 mt-1">Certificado{earnedCertificates.length !== 1 ? 's' : ''} obtido{earnedCertificates.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progresso total</span>
          <span className="text-sm font-medium text-white">{completedCount}/{totalVideos}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-cyan-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">* Necessário assistir 95% de cada aula para registrar como concluída.</p>
      </div>

      {/* Certificates */}
      {earnedCertificates.length > 0 && (
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Certificados conquistados
          </h3>
          <div className="space-y-2">
            {earnedCertificates.map(mod => (
              <div key={mod} className="flex items-center gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <Award className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">{mod}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
