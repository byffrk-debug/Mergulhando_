import React from 'react';
import { Play, Clock, BookOpen, Megaphone, AlertTriangle, Handshake, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
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

// ── Card grande "Continuar de onde parou" ────────────────────────────────────
function ContinueCard({ video, onPlay }: { video: Video; onPlay: () => void }) {
  const thumb = getThumbnail(video);
  return (
    <button
      onClick={onPlay}
      className="group w-full flex flex-col sm:flex-row items-stretch text-left rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)] transition-all duration-200 focus:outline-none"
    >
      {/* Thumb 16:9 (do YouTube) */}
      <div className="relative w-full sm:w-80 flex-shrink-0 aspect-video bg-gray-800 overflow-hidden">
        {thumb && (
          <img src={normalizeImageUrl(thumb)} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-gray-900 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-center">
        <span className="text-xs font-medium text-cyan-400 mb-1">{video.module}</span>
        <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
          {video.title}
        </h3>
        {video.short_description && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{video.short_description}</p>
        )}
        <span className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-cyan-400">
          <Play className="w-4 h-4 fill-current" /> Continuar assistindo
        </span>
      </div>
    </button>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export function HomePage({ videos, userProgress, videoPositions, onNavigate, onPlayVideo }: HomePageProps) {
  const { announcements } = useAnnouncements();
  const { config } = useHomeConfig();

  // Vídeos em andamento (têm posição salva e ainda não foram concluídos)
  const inProgress = videos.filter(v => videoPositions[v.id] && !userProgress[v.id]);
  // "Continuar" = a última aula em estudo (último item em andamento)
  const continueVideo = inProgress.length > 0 ? inProgress[inProgress.length - 1] : null;

  return (
    <div className="pb-10">

      {/* ── Hero Banner ─── */}
      {config.banner_image_url ? (
        <div className="relative w-full h-32 sm:h-40 overflow-hidden">
          <img
            src={normalizeImageUrl(config.banner_image_url)}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="relative w-full h-32 sm:h-40 overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-cyan-950/20 to-gray-950 border-b border-gray-800"
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

        {/* ── Continuar (última aula em estudo) ── */}
        {continueVideo && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-pink-400" />
              Continuar de onde parou
            </h2>
            <ContinueCard
              video={continueVideo}
              onPlay={() => onPlayVideo(continueVideo)}
            />
          </section>
        )}

        {/* Estado vazio / sem progresso */}
        {videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-gray-600"
          >
            <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p>Nenhuma aula cadastrada ainda.</p>
          </motion.div>
        ) : !continueVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-gray-500"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">Você ainda não começou nenhuma aula.</p>
            <button
              onClick={() => onNavigate({ name: 'trilha', trackId: '' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-gray-950 font-medium rounded-xl hover:bg-cyan-400 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Ir para Trilha de Estudos
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
