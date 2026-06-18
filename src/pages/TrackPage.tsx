import React from 'react';
import { BookOpen, Lock, ChevronLeft, ChevronRight, Play, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useTracks } from '../hooks/useTracks';
import { getThumbnail } from '../utils/thumbnail';
import { normalizeImageUrl } from '../utils/driveImage';
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {moduleNames.map((moduleName, index) => {
          const modVideos = videos.filter(v => v.module === moduleName);
          const completed = modVideos.filter(v => userProgress[v.id]).length;
          const percent = modVideos.length > 0 ? Math.round((completed / modVideos.length) * 100) : 0;

          const prevName = showLock && index > 0 ? moduleNames[index - 1] : null;
          const isLocked = showLock && prevName !== null && (() => {
            const prevVideos = videos.filter(v => v.module === prevName);
            return prevVideos.some(v => !userProgress[v.id]);
          })();

          const coverVideo = modVideos.find(v => v.thumbnail_url) ?? modVideos[0];
          const thumb = coverVideo ? (coverVideo.thumbnail_url || getThumbnail(coverVideo)) : null;

          return (
            <motion.button
              key={moduleName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isLocked && onNavigate({ name: 'modulo', moduleName })}
              disabled={!!isLocked}
              className={`group text-left focus:outline-none ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Capa 9:16 */}
              <div
                className={`relative w-full rounded-xl overflow-hidden bg-gray-800 border shadow-lg transition-all duration-200 ${
                  isLocked
                    ? 'border-gray-800/50'
                    : 'border-gray-700/50 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                }`}
                style={{ aspectRatio: '9/16' }}
              >
                {thumb ? (
                  <img src={normalizeImageUrl(thumb)} alt={moduleName} className={`absolute inset-0 w-full h-full object-cover ${isLocked ? 'grayscale' : ''}`} />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-gray-900 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-cyan-500/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent" />

                {/* Ícone de cadeado */}
                {isLocked && (
                  <div className="absolute top-2 right-2 w-7 h-7 bg-gray-900/80 rounded-full flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}

                {/* Play hover */}
                {!isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                      <Play className="w-5 h-5 text-gray-900 fill-current ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Badge de conclusão */}
                <div className="absolute top-2 left-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    percent === 100 ? 'bg-cyan-500/90 text-gray-950'
                    : percent > 0 ? 'bg-gray-800/90 text-gray-300'
                    : 'hidden'
                  }`}>
                    {percent === 100 ? '✓ Concluído' : `${percent}%`}
                  </span>
                </div>

                {/* Título e progresso na base */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <h3 className={`text-[11px] font-semibold leading-tight line-clamp-2 mb-1 ${
                    isLocked ? 'text-gray-500' : 'text-white group-hover:text-cyan-300 transition-colors'
                  }`}>
                    {moduleName}
                  </h3>
                  <p className="text-[9px] text-gray-500">{completed}/{modVideos.length} aulas</p>
                  {percent > 0 && (
                    <div className="w-full bg-gray-700/60 rounded-full h-0.5 mt-1">
                      <div className="bg-gradient-to-r from-cyan-500 to-pink-500 h-0.5 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // ── Vista geral (sem trackId) → trilhas como CARDS ─────────────────────────
  if (isOverview) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-cyan-400" />
          Trilha de Estudos
        </h1>
        <p className="text-sm text-gray-500 mb-8">Escolha uma trilha para começar a estudar.</p>

        {tracks.length > 0 ? (
          // Cada trilha = um card grande clicável
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {tracks.map((t, index) => {
              const mods = trackModules
                .filter(tm => tm.track_id === t.id)
                .sort((a, b) => a.order_index - b.order_index)
                .map(tm => tm.module_name);
              const trackVideos = videos.filter(v => mods.includes(v.module));
              const completed = trackVideos.filter(v => userProgress[v.id]).length;
              const percent = trackVideos.length > 0 ? Math.round((completed / trackVideos.length) * 100) : 0;
              const cover = normalizeImageUrl(t.thumbnail_url);

              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onNavigate({ name: 'trilha', trackId: t.id })}
                  className="group text-left focus:outline-none"
                >
                  {/* Capa da trilha (poster 9:16) */}
                  <div
                    className="relative w-full rounded-2xl overflow-hidden bg-gray-800 border border-gray-700/50 shadow-lg group-hover:scale-[1.03] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] group-hover:border-cyan-500/40 transition-all duration-200"
                    style={{ aspectRatio: '9/16' }}
                  >
                    {cover ? (
                      <img src={cover} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-gray-900 to-pink-900/20 flex items-center justify-center">
                        <Layers className="w-14 h-14 text-cyan-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />

                    {/* Play hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                        <Play className="w-6 h-6 text-gray-900 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Info na base */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h2 className="text-base font-bold text-white leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors">
                        {t.name}
                      </h2>
                      {t.description && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{mods.length} módulo{mods.length !== 1 ? 's' : ''}</span>
                      </div>
                      {percent > 0 && (
                        <div className="w-full bg-gray-700/60 rounded-full h-1 mt-2">
                          <div className="bg-gradient-to-r from-cyan-500 to-pink-500 h-1 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          // Sem trilhas cadastradas → mostra todos os módulos soltos
          <ModuleGrid moduleNames={allModuleNames} />
        )}

        {/* Aviso quando há trilhas mas estão vazias */}
        {tracks.length > 0 && trackModules.length === 0 && (
          <p className="text-center text-sm text-gray-600 mt-10">
            As trilhas ainda não têm módulos. Adicione módulos a cada trilha no Painel Admin.
          </p>
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

      {(() => {
        const banner = normalizeImageUrl(track!.banner_url);
        return banner ? (
          // Banner paisagem dedicado → imagem de topo bonita com texto sobreposto
          <div className="mb-8 relative rounded-2xl overflow-hidden border border-gray-800">
            <div className="w-full aspect-[16/6] sm:aspect-[16/5] relative">
              <img src={banner} alt={track!.name} className="absolute inset-0 w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{track!.name}</h1>
              {track!.description && <p className="text-gray-200 mt-1 text-sm max-w-2xl drop-shadow">{track!.description}</p>}
              <p className="text-xs text-gray-300 mt-2">{trackModuleList.length} módulo{trackModuleList.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ) : (
          // Sem banner → cabeçalho simples (sem esticar a capa 9:16)
          <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-7 h-7 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">{track!.name}</h1>
            </div>
            {track!.description && <p className="text-gray-400 mt-2">{track!.description}</p>}
            <p className="text-sm text-gray-500 mt-3">{trackModuleList.length} módulo{trackModuleList.length !== 1 ? 's' : ''}</p>
          </div>
        );
      })()}

      <ModuleGrid moduleNames={trackModuleList.map(tm => tm.module_name)} showLock />
    </div>
  );
}
