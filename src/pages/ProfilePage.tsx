import React from 'react';
import { User as UserIcon, Award } from 'lucide-react';
import type { Video, User, UserRole } from '../types';

interface ProfilePageProps {
  user: User;
  role: UserRole;
  videos: Video[];
  userProgress: Record<string, boolean>;
  quizPassed: Record<string, boolean>;
}

export function ProfilePage({ user, role, videos, userProgress, quizPassed }: ProfilePageProps) {
  const completedCount = videos.filter(v => userProgress[v.id]).length;
  const totalVideos = videos.length;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  const modules = Array.from(new Set(videos.map(v => v.module)));
  const earnedCertificates = modules.filter(mod => {
    const modVids = videos.filter(v => v.module === mod);
    const allDone = modVids.length > 0 && modVids.every(v => userProgress[v.id]);
    return allDone && quizPassed[mod];
  });

  function getInitials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Meu Perfil</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-5 p-6 bg-gray-900 border border-gray-800 rounded-2xl mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
          {getInitials(user.name)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            role === 'admin' ? 'bg-cyan-500/20 text-cyan-300' :
            role === 'moderator' ? 'bg-purple-500/20 text-purple-300' :
            'bg-gray-700 text-gray-400'
          }`}>
            {role === 'admin' ? 'Administrador' : role === 'moderator' ? 'Moderador' : 'Aluno'}
          </span>
        </div>
      </div>

      {/* Progress */}
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

      {/* Overall progress bar */}
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
