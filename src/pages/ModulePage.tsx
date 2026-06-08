import React from 'react';
import { Play, CheckCircle, Lock, Award, Sparkles, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { QuizBadge } from '../components/quiz/QuizBadge';
import { getThumbnail } from '../utils/thumbnail';
import type { Video, AppView, UserRole } from '../types';

interface ModulePageProps {
  moduleName: string;
  videos: Video[];
  allVideos: Video[];
  userProgress: Record<string, boolean>;
  videoPositions: Record<string, number>;
  quizPassed: Record<string, boolean>;
  role: UserRole;
  onNavigate: (view: AppView) => void;
  onPlayVideo: (video: Video) => void;
  onOpenQuiz: (moduleName: string) => void;
  onOpenCertificate: (moduleName: string) => void;
}

export function ModulePage({
  moduleName, videos, allVideos, userProgress, videoPositions, quizPassed,
  role, onNavigate, onPlayVideo, onOpenQuiz, onOpenCertificate,
}: ModulePageProps) {
  const modules = Array.from(new Set(allVideos.map(v => v.module)));
  const moduleIndex = modules.indexOf(moduleName);
  const prevModule = moduleIndex > 0 ? modules[moduleIndex - 1] : null;

  const isLocked = role !== 'admin' && role !== 'moderator' && prevModule !== null && (() => {
    const prevVideos = allVideos.filter(v => v.module === prevModule);
    return prevVideos.some(v => !userProgress[v.id]);
  })();

  const completed = videos.filter(v => userProgress[v.id]).length;
  const percent = videos.length > 0 ? Math.round((completed / videos.length) * 100) : 0;
  const isComplete = percent === 100;
  const canCertificate = isComplete && (quizPassed[moduleName] ?? false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => onNavigate({ name: 'home' })}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Header */}
      <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {isLocked ? <Lock className="w-6 h-6 text-gray-600" /> : <Sparkles className="w-6 h-6 text-cyan-400" />}
            <h1 className="text-2xl font-bold text-white">{moduleName}</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{percent}%</p>
            <p className="text-sm text-gray-400">{completed}/{videos.length} concluídas</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-800 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {isLocked && (
          <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
            <Lock className="w-4 h-4" />
            Conclua "{prevModule}" para desbloquear este módulo
          </p>
        )}
      </div>

      {/* Video grid */}
      <div className="space-y-3 mb-6">
        {videos.map((video, index) => {
          const thumb = getThumbnail(video);
          const isCompleted = userProgress[video.id];
          const position = videoPositions[video.id];

          return (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                isLocked
                  ? 'border-gray-800/50 bg-gray-900/30 opacity-60 cursor-not-allowed'
                  : isCompleted
                    ? 'border-cyan-900/40 bg-gray-900/50'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700 cursor-pointer'
              }`}
              onClick={() => !isLocked && onPlayVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden bg-gray-800">
                {thumb && <img src={thumb} alt={video.title} className="w-full h-full object-cover" />}
                <div className={`absolute inset-0 flex items-center justify-center ${isLocked ? '' : 'group-hover:bg-black/20 transition-colors'}`}>
                  {isLocked ? (
                    <Lock className="w-6 h-6 text-gray-400" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-cyan-500/90 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-gray-950 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                {position && !isCompleted && !isLocked && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div className="h-full bg-cyan-400 transition-all" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-base leading-snug ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
                  {video.title}
                </h3>
                {video.short_description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.short_description}</p>
                )}
                {position && !isCompleted && !isLocked && (
                  <p className="text-xs text-amber-400 mt-1">↩ Continuar do ponto salvo</p>
                )}
                {isCompleted && (
                  <p className="text-xs text-cyan-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Concluída
                  </p>
                )}
              </div>

              {/* Index */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-sm text-gray-500">
                {index + 1}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quiz badge */}
      {isComplete && role !== 'admin' && role !== 'moderator' && (
        <QuizBadge
          moduleName={moduleName}
          userId=""
          onTakeQuiz={() => onOpenQuiz(moduleName)}
        />
      )}

      {/* Certificate */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={() => canCertificate && onOpenCertificate(moduleName)}
        className={`mt-3 flex items-center gap-4 p-5 rounded-2xl border transition-all ${
          canCertificate
            ? 'border-yellow-500/40 bg-yellow-500/5 cursor-pointer hover:border-yellow-500/60'
            : isComplete
              ? 'border-blue-500/30 bg-blue-500/5'
              : 'border-gray-800 bg-gray-900/50'
        }`}
      >
        <Award className={`w-8 h-8 flex-shrink-0 ${canCertificate ? 'text-yellow-400' : isComplete ? 'text-blue-400' : 'text-gray-600'}`} />
        <div>
          <p className={`font-medium ${canCertificate ? 'text-yellow-400' : isComplete ? 'text-blue-400' : 'text-gray-500'}`}>
            Certificado: {moduleName}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {canCertificate
              ? 'Clique para visualizar e baixar'
              : isComplete
                ? 'Complete o quiz do módulo para desbloquear'
                : `Progresso: ${percent}% — assista 100% das aulas para liberar`}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
