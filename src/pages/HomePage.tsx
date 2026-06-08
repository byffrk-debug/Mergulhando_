import React from 'react';
import { Megaphone, AlertTriangle, Handshake, ExternalLink, BookOpen } from 'lucide-react';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useHomeConfig } from '../hooks/useHomeConfig';
import type { AppView } from '../types';

interface HomePageProps {
  onNavigate: (view: AppView) => void;
}

const ANNOUNCEMENT_ICONS: Record<string, React.ReactNode> = {
  megaphone: <Megaphone className="w-5 h-5" />,
  'alert-triangle': <AlertTriangle className="w-5 h-5" />,
  handshake: <Handshake className="w-5 h-5" />,
};

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : null;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { announcements } = useAnnouncements();
  const { config, loading } = useHomeConfig();

  const videoId = config.welcome_video_url ? getYouTubeId(config.welcome_video_url) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* ── Banner estático ── */}
      <section>
        {loading ? (
          <div className="w-full aspect-[21/8] min-h-[180px] bg-gray-900 rounded-2xl animate-pulse" />
        ) : config.banner_image_url ? (
          <div className="w-full aspect-[21/8] min-h-[180px] max-h-[400px] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
            <img
              src={config.banner_image_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          /* Placeholder quando nenhuma imagem foi configurada */
          <div className="w-full aspect-[21/8] min-h-[180px] max-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-cyan-950/30 to-gray-900 border border-cyan-500/10 flex flex-col items-center justify-center gap-3">
            <BookOpen className="w-14 h-14 text-cyan-500/30" />
            <p className="text-gray-600 text-sm">Configure o banner na aba Admin → Início</p>
          </div>
        )}
      </section>

      {/* ── Vídeo de boas-vindas ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          {config.welcome_video_title || 'Bem-vindo ao Mergulhando na Palavra'}
        </h2>
        {videoId ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-[0_0_40px_rgba(34,211,238,0.06)]">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title={config.welcome_video_title || 'Vídeo de boas-vindas'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-gray-900 border border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-600">
            <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Configure o vídeo de boas-vindas na aba Admin → Início</p>
          </div>
        )}
      </section>

      {/* ── Avisos ── */}
      {announcements.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Avisos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {announcements.map(ann => (
              <div
                key={ann.id}
                className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl"
              >
                <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 flex-shrink-0">
                  {ann.icon && ANNOUNCEMENT_ICONS[ann.icon]
                    ? ANNOUNCEMENT_ICONS[ann.icon]
                    : <Megaphone className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{ann.content}</p>
                  {ann.link_url && ann.link_label && (
                    <a
                      href={ann.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors"
                    >
                      {ann.link_label} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA para trilhas ── */}
      <section>
        <button
          onClick={() => onNavigate({ name: 'trilha', trackId: '' })}
          className="w-full p-5 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-2xl flex items-center gap-4 hover:border-cyan-500/40 transition-all group"
        >
          <div className="w-12 h-12 bg-cyan-500/15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/25 transition-colors">
            <BookOpen className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">Trilha de Estudos</p>
            <p className="text-sm text-gray-400">Acesse os módulos, aulas e avaliações</p>
          </div>
          <svg className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

    </div>
  );
}
