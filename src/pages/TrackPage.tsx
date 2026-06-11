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
  const { tracks, trackModules, getTrackModules } = useTracks();
  const track = tracks.find(t => t.id === trackId);

  // Sem trackId → mostra todas as trilhas; com trackId → mostra a trilha específica
  const isOverview = !trackId || !track;

  // Módulos da trilha selecionada
  const trackModuleList = isOverview ? [] : getTrackModules(trackId);

  // Para overview: todos os módulos únicos dos vídeos
  const allModuleNames = Array.from(new Set(videos.map(v => v.module)));

  function ModuleGrid({ moduleNames, showLock = false }: { moduleNames: string[]; showLock?: boolean }) {
    return moduleNames.length === 0 ? (
      <div className="text-center py-16 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhum módulo disponível ainda.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleNames.map((moduleName, index) => {
          const modVideos = videos.filter(v => v.module === moduleName);
          const completed = modVideos.filter(v => userProgress[v.id]).length;
          const percent = modVideos.length > 0 ? Math.round((completed / modVideos.length) * 100) : 0;

          const prevName = showLock && index > 0 ? moduleNames[index - 1] : null;
          const isLocked = showLock && prevName !== null && (() => {
            const prevVideos = videos.filter(v => v.module === prevName);
            return prevVideos.some(v => !userProgress[v.id]);
          })();

          return (
            <motion.button
              key={moduleName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isLocked && onNavigate({ name: 'modulo', moduleName })}
              disabled={!!isLocked}
              className={`group p-5 rounded-2xl border text-left transition-all ${
                isLocked
                  ? 'border-gray-800/50 bg-gray-900/30 opacity-60 cursor-not-allowed'
                  : 'border-gray-800 bg-gray-900 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)] cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                {isLocked ? <Lock className="w-6 h-6 text-gray-600" /> : <BookOpen className="w-6 h-6 text-cyan-400" />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  percent === 100 ? 'bg-cyan-500/20 text-cyan-400'
                  : percent > 0 ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-800 text-gray-500'
                }`}>
                  {percent === 100 ? 'Concluído ✓' : `${completed}/${modVideos.length} aulas`}
                </span>
              </div>
              <h3 className={`font-semibold mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                {moduleName}
              </h3>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-cyan-500 to-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${percent}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{percent}%</span>
                {!isLocked && <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // ── Vista geral (sem trackId) ───────────────────────────────────────────────
  if (isOverview) {
    // Se existem trilhas configuradas → mostra cada trilha com seus módulos
    // Se não → mostra todos os módulos diretamente
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-cyan-400" />
          Trilha de Estudos
        </h1>

        {tracks.length > 0 ? (
          // Trilhas cadastradas → seção por trilha
          <div className="space-y-10">
            {tracks.map(t => {
              const mods = trackModules
                .filter(tm => tm.track_id === t.id)
                .sort((a, b) => a.order_index - b.order_index)
                .map(tm => tm.module_name);
              return (
                <section key={t.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{t.name}</h2>
                      {t.description && <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>}
                    </div>
                    <button
                      onClick={() => onNavigate({ name: 'trilha', trackId: t.id })}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ModuleGrid moduleNames={mods} showLock />
                </section>
              );
            })}
          </div>
        ) : (
          // Sem trilhas → mostra todos os módulos dos vídeos cadastrados
          <ModuleGrid moduleNames={allModuleNames} />
        )}
      </div>
    );
  }

  // ── Vista de trilha específica ──────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => onNavigate({ name: 'trilha', trackId: '' })}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Trilha de Estudos
      </button>

      <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">{track!.name}</h1>
        </div>
        {track!.description && <p className="text-gray-400 mt-2">{track!.description}</p>}
        <p className="text-sm text-gray-500 mt-3">{trackModuleList.length} módulo{trackModuleList.length !== 1 ? 's' : ''}</p>
      </div>

      <ModuleGrid moduleNames={trackModuleList.map(tm => tm.module_name)} showLock />
    </div>
  );
}
