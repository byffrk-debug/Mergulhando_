import React from 'react';
import { BookOpen, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useTracks } from '../hooks/useTracks';
import type { Video, AppView } from '../types';

interface TrackPageProps {
  trackId: string;
  videos: Video[];
  userProgress: Record<string, boolean>;
  onNavigate: (view: AppView) => void;
}

export function TrackPage({ trackId, videos, userProgress, onNavigate }: TrackPageProps) {
  const { tracks, getTrackModules } = useTracks();
  const track = tracks.find(t => t.id === trackId);
  const modules = getTrackModules(trackId);

  if (!track) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Trilha não encontrada.</p>
        <button onClick={() => onNavigate({ name: 'home' })} className="mt-4 text-cyan-400 hover:underline">Voltar ao início</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => onNavigate({ name: 'home' })}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Track Header */}
      <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">{track.name}</h1>
        </div>
        {track.description && <p className="text-gray-400 mt-2">{track.description}</p>}
        <p className="text-sm text-gray-500 mt-3">{modules.length} módulo{modules.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Module Cards */}
      {modules.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum módulo adicionado a esta trilha ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((tm, index) => {
            const modVideos = videos.filter(v => v.module === tm.module_name);
            const completed = modVideos.filter(v => userProgress[v.id]).length;
            const percent = modVideos.length > 0 ? Math.round((completed / modVideos.length) * 100) : 0;

            // Check if previous module is complete to determine lock state
            const prevModule = index > 0 ? modules[index - 1] : null;
            const isLocked = prevModule !== null && (() => {
              const prevVideos = videos.filter(v => v.module === prevModule.module_name);
              return prevVideos.some(v => !userProgress[v.id]);
            })();

            return (
              <motion.button
                key={tm.module_name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => !isLocked && onNavigate({ name: 'modulo', moduleName: tm.module_name })}
                disabled={isLocked}
                className={`group p-5 rounded-2xl border text-left transition-all ${
                  isLocked
                    ? 'border-gray-800/50 bg-gray-900/30 opacity-60 cursor-not-allowed'
                    : 'border-gray-800 bg-gray-900 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)] cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  {isLocked ? <Lock className="w-6 h-6 text-gray-600" /> : <BookOpen className="w-6 h-6 text-cyan-400" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    percent === 100
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : percent > 0
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-800 text-gray-500'
                  }`}>
                    {percent === 100 ? 'Concluído ✓' : `${completed}/${modVideos.length} aulas`}
                  </span>
                </div>
                <h3 className={`font-semibold mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                  {tm.module_name}
                </h3>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{percent}%</span>
                  {!isLocked && <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
