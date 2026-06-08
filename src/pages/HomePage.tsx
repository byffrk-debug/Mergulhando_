import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, ChevronRight, Megaphone, AlertTriangle, Handshake, ExternalLink, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTracks } from '../hooks/useTracks';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { getThumbnail } from '../utils/thumbnail';
import type { Video, AppView, UserRole } from '../types';

interface HomePageProps {
  videos: Video[];
  userProgress: Record<string, boolean>;
  videoPositions: Record<string, number>;
  role: UserRole;
  onNavigate: (view: AppView) => void;
  onPlayVideo: (video: Video) => void;
}

const ANNOUNCEMENT_ICONS: Record<string, React.ReactNode> = {
  megaphone: <Megaphone className="w-5 h-5" />,
  'alert-triangle': <AlertTriangle className="w-5 h-5" />,
  handshake: <Handshake className="w-5 h-5" />,
};

function HeroBanner({ videos, userProgress, onPlay }: { videos: Video[]; userProgress: Record<string, boolean>; onPlay: (v: Video) => void }) {
  const [current, setCurrent] = useState(0);
  const featured = videos.slice(0, 5);

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (featured.length === 0) return null;
  const video = featured[current];
  const thumb = getThumbnail(video);

  return (
    <div className="relative w-full aspect-[21/8] min-h-[200px] max-h-[420px] overflow-hidden rounded-2xl mb-8 bg-gray-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={video.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {thumb && (
            <img src={thumb} alt={video.title} className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <p className="text-xs text-cyan-400 uppercase tracking-widest mb-2 font-medium">{video.module}</p>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 max-w-lg leading-tight">{video.title}</h2>
        {video.short_description && (
          <p className="text-sm text-gray-300 max-w-md mb-4 line-clamp-2">{video.short_description}</p>
        )}
        <button
          onClick={() => onPlay(video)}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-3 rounded-xl transition-all w-fit shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
        >
          <Play className="w-5 h-5 fill-current" />
          {userProgress[video.id] ? 'Assistir novamente' : 'Assistir agora'}
        </button>
      </div>

      {/* Dots */}
      {featured.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'bg-cyan-400 w-5 h-1.5' : 'bg-gray-600 w-1.5 h-1.5 hover:bg-gray-400'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoRow({ title, videos, userProgress, videoPositions, onPlay }: {
  title: string;
  videos: Video[];
  userProgress: Record<string, boolean>;
  videoPositions: Record<string, number>;
  onPlay: (v: Video) => void;
}) {
  if (videos.length === 0) return null;
  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-pink-400" />
        {title}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {videos.map(video => {
          const thumb = getThumbnail(video);
          const completed = userProgress[video.id];
          const position = videoPositions[video.id];
          return (
            <button
              key={video.id}
              onClick={() => onPlay(video)}
              className="flex-shrink-0 w-52 group text-left"
            >
              <div className="relative w-52 h-32 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 mb-2">
                {thumb && <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-cyan-500/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-gray-950 fill-current ml-0.5" />
                  </div>
                </div>
                {completed && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                  </div>
                )}
                {position && !completed && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div className="h-full bg-cyan-400" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-200 group-hover:text-white transition-colors line-clamp-2 leading-tight">{video.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{video.module}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TrackRow({ tracks, trackModules, videos, userProgress, onNavigate }: {
  tracks: ReturnType<typeof useTracks>['tracks'];
  trackModules: ReturnType<typeof useTracks>['trackModules'];
  videos: Video[];
  userProgress: Record<string, boolean>;
  onNavigate: (view: AppView) => void;
}) {
  if (tracks.length === 0) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Trilhas de Estudo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(new Set(videos.map(v => v.module))).map(mod => {
            const modVideos = videos.filter(v => v.module === mod);
            const completed = modVideos.filter(v => userProgress[v.id]).length;
            const percent = modVideos.length > 0 ? Math.round((completed / modVideos.length) * 100) : 0;
            return (
              <button
                key={mod}
                onClick={() => onNavigate({ name: 'modulo', moduleName: mod })}
                className="group p-5 bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-2xl text-left transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs text-gray-500">{completed}/{modVideos.length} aulas</span>
                </div>
                <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2 line-clamp-2">{mod}</h4>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-cyan-500 to-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{percent}% concluído</p>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <>
      {tracks.map(track => {
        const modules = trackModules
          .filter(tm => tm.track_id === track.id)
          .sort((a, b) => a.order_index - b.order_index);

        return (
          <section key={track.id} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                {track.name}
              </h3>
              <button
                onClick={() => onNavigate({ name: 'trilha', trackId: track.id })}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {modules.map(tm => {
                const modVideos = videos.filter(v => v.module === tm.module_name);
                const completed = modVideos.filter(v => userProgress[v.id]).length;
                const percent = modVideos.length > 0 ? Math.round((completed / modVideos.length) * 100) : 0;
                return (
                  <button
                    key={tm.module_name}
                    onClick={() => onNavigate({ name: 'modulo', moduleName: tm.module_name })}
                    className="flex-shrink-0 w-52 group p-4 bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-xl text-left transition-all"
                  >
                    <BookOpen className="w-8 h-8 text-cyan-400/60 mb-3" />
                    <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors line-clamp-2 mb-3">{tm.module_name}</p>
                    <div className="w-full bg-gray-800 rounded-full h-1">
                      <div className="bg-cyan-500 h-1 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{completed}/{modVideos.length} aulas</p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function HomePage({ videos, userProgress, videoPositions, role, onNavigate, onPlayVideo }: HomePageProps) {
  const { tracks, trackModules } = useTracks();
  const { announcements } = useAnnouncements();

  const inProgress = videos.filter(v => videoPositions[v.id] && !userProgress[v.id]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <HeroBanner videos={videos} userProgress={userProgress} onPlay={onPlayVideo} />

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {announcements.map(ann => (
            <div key={ann.id} className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 flex-shrink-0">
                {ann.icon && ANNOUNCEMENT_ICONS[ann.icon] ? ANNOUNCEMENT_ICONS[ann.icon] : <Megaphone className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">{ann.content}</p>
                {ann.link_url && ann.link_label && (
                  <a href={ann.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors">
                    {ann.link_label} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Continue Watching */}
      {inProgress.length > 0 && (
        <VideoRow
          title="Continue Assistindo"
          videos={inProgress}
          userProgress={userProgress}
          videoPositions={videoPositions}
          onPlay={onPlayVideo}
        />
      )}

      {/* Tracks / Modules */}
      <TrackRow
        tracks={tracks}
        trackModules={trackModules}
        videos={videos}
        userProgress={userProgress}
        onNavigate={onNavigate}
      />
    </div>
  );
}
