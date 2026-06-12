import React, { useRef } from 'react';
import { Play, CheckCircle, Clock, BookOpen, ChevronRight, Megaphone, AlertTriangle, Handshake, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useTracks } from '../hooks/useTracks';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useHomeConfig } from '../hooks/useHomeConfig';
import { getThumbnail } from '../utils/thumbnail';
import { normalizeImageUrl } from '../utils/driveImage';
import type { Video, AppView } from '../types';

interface HomePageProps {
  videos: Video[];
  userProgress: Record<string, boolean>;
  videoPositions: Record<string, number>;
  onNavigate: (view: AppView) => void;
  onPlayVideo: (video: Video) => void;
}

const ANNOUNCEMENT_ICONS: Record<string, React.ReactNode> = {
  megaphone: <Megaphone className="w-4 h-4" />,
  'alert-triangle': <AlertTriangle className="w-4 h-4" />,
  handshake: <Handshake className="w-4 h-4" />,
};

// ── Card de vídeo estilo Netflix ─────────────────────────────────────────────
function VideoCard({ video, completed, onPlay }: { video: Video; completed: boolean; onPlay: () => void }) {
  const thumb = getThumbnail(video);
  return (
    <button
      onClick={onPlay}
      className="flex-shrink-0 w-44 group text-left focus:outline-none"
    >
      <div className="relative w-44 h-28 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 mb-2 shadow-lg group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-200">
        {thumb && <img src={thumb} alt={video.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
            <Play className="w-5 h-5 text-gray-900 fill-current ml-0.5" />
          </div>
        </div>
        {completed && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]" />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-snug font-medium">{video.title}</p>
    </button>
  );
}

// ── Card de módulo estilo retrato 9:16 ───────────────────────────────────────
function ModuleCard({ moduleName, videos, userProgress, onNavigate }: {
  moduleName: string;
  videos: Video[];
  userProgress: Record<string, boolean>;
  onNavigate: (view: AppView) => void;
}) {
  // Usa capa personalizada (thumbnail_url) do primeiro vídeo ou fallback YouTube
  const coverVideo = videos.find(v => v.thumbnail_url) ?? videos[0];
  const thumb = coverVideo ? (coverVideo.thumbnail_url || getThumbnail(coverVideo)) : null;
  const completed = videos.filter(v => userProgress[v.id]).length;
  const percent = videos.length > 0 ? Math.round((completed / videos.length) * 100) : 0;

  return (
    <button
      onClick={() => onNavigate({ name: 'modulo', moduleName })}
      className="flex-shrink-0 w-32 group text-left focus:outline-none"
    >
      {/* Área 9:16 */}
      <div
        className="relative w-32 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 mb-2 shadow-lg group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-200"
        style={{ aspectRatio: '9/16' }}
      >
        {thumb ? (
          <img src={normalizeImageUrl(thumb)} alt={moduleName} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900/40 to-gray-900">
            <BookOpen className="w-8 h-8 text-cyan-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent" />
        {/* Título sobreposto na parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-[10px] text-white font-semibold leading-tight line-clamp-2">{moduleName}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">{completed}/{videos.length} aulas</p>
        </div>
        {/* Play hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
            <Play className="w-4 h-4 text-gray-900 fill-current ml-0.5" />
          </div>
        </div>
        {/* Barra de progresso */}
        {percent > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700/60">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
    </button>
  );
}

// ── Linha horizontal com scroll ──────────────────────────────────────────────
function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {children}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export function HomePage({ videos, userProgress, videoPositions, onNavigate, onPlayVideo }: HomePageProps) {
  const { tracks, trackModules } = useTracks();
  const { announcements } = useAnnouncements();
  const { config } = useHomeConfig();

  const inProgress = videos.filter(v => videoPositions[v.id] && !userProgress[v.id]);
  const allModules = Array.from(new Set(videos.map(v => v.module)));

  return (
    <div className="pb-10">

      {/* ── Hero Banner (ocupa topo inteiro) ─── */}
      {config.banner_image_url ? (
        <div className="relative w-full" style={{ aspectRatio: '16/7', maxHeight: 480 }}>
          <img
            src={normalizeImageUrl(config.banner_image_url)}
            alt="Banner"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradiente embaixo para transição suave com o conteúdo */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
        </div>
      ) : (
        /* Placeholder enquanto não configurou */
        <div
          className="relative w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-cyan-950/20 to-gray-950 border-b border-gray-800"
          style={{ aspectRatio: '16/7', maxHeight: 480 }}
        >
          <BookOpen className="w-16 h-16 text-cyan-500/20 mb-3" />
          <p className="text-gray-600 text-sm">Configure o banner em Admin → Início</p>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>
      )}

      <div className="px-6 max-w-7xl mx-auto">

        {/* ── Vídeo de boas-vindas (logo abaixo do banner) ── */}
        {config.welcome_video_url && (() => {
          const match = config.welcome_video_url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
          const vid = match?.[1];
          return vid ? (
            <section className="mt-8 mb-10 flex flex-col items-center">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 text-center">
                <Play className="w-5 h-5 text-cyan-400" />
                {config.welcome_video_title || 'Bem-vindo'}
              </h2>
              <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl shadow-cyan-500/5 mx-auto">
                <iframe
                  src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                  title={config.welcome_video_title || 'Boas-vindas'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </section>
          ) : null;
        })()}

        {/* ── Avisos (destacados) ── */}
        {announcements.length > 0 && (
          <section className="mb-10 space-y-3">
            {announcements.map(ann => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent border border-cyan-500/30 shadow-lg shadow-cyan-500/5 overflow-hidden"
              >
                {/* Barra lateral de destaque */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-pink-500" />
                {/* Ícone em destaque */}
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 [&>svg]:w-5 [&>svg]:h-5">
                  {ann.icon && ANNOUNCEMENT_ICONS[ann.icon] ? ANNOUNCEMENT_ICONS[ann.icon] : <Megaphone className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-white leading-snug">{ann.content}</p>
                  {ann.link_url && ann.link_label && (
                    <a
                      href={ann.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-cyan-500 text-gray-950 text-sm font-semibold hover:bg-cyan-400 transition-colors"
                    >
                      {ann.link_label} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </section>
        )}

        {/* ── Continue Assistindo ── */}
        {inProgress.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-400" />
              Continuar Assistindo
            </h2>
            <ScrollRow>
              {inProgress.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  completed={!!userProgress[video.id]}
                  onPlay={() => onPlayVideo(video)}
                />
              ))}
            </ScrollRow>
          </section>
        )}

        {/* ── Trilhas (cada trilha = uma linha Netflix) ── */}
        {(() => {
          // Monta a lista de seções por trilha que têm módulos associados
          const trackSections = tracks
            .map(track => {
              const modules = trackModules
                .filter(tm => tm.track_id === track.id)
                .sort((a, b) => a.order_index - b.order_index);
              return { track, modules };
            })
            .filter(({ modules }) => modules.length > 0);

          // Se nenhuma trilha tem módulos associados → mostra todos os módulos diretamente
          if (tracks.length === 0 || trackSections.length === 0) {
            return allModules.length > 0 ? (
              <section className="mb-8">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Trilha de Estudos
                </h2>
                <ScrollRow>
                  {allModules.map(mod => (
                    <ModuleCard
                      key={mod}
                      moduleName={mod}
                      videos={videos.filter(v => v.module === mod)}
                      userProgress={userProgress}
                      onNavigate={onNavigate}
                    />
                  ))}
                </ScrollRow>
              </section>
            ) : null;
          }

          // Há trilhas com módulos → uma seção por trilha
          return trackSections.map(({ track, modules }) => (
            <section key={track.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  {track.name}
                </h2>
                <button
                  onClick={() => onNavigate({ name: 'trilha', trackId: track.id })}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <ScrollRow>
                {modules.map(tm => (
                  <ModuleCard
                    key={tm.module_name}
                    moduleName={tm.module_name}
                    videos={videos.filter(v => v.module === tm.module_name)}
                    userProgress={userProgress}
                    onNavigate={onNavigate}
                  />
                ))}
              </ScrollRow>
            </section>
          ));
        })()}

        {/* Estado vazio */}
        {videos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-gray-600"
          >
            <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p>Nenhuma aula cadastrada ainda.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
