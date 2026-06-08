import { ClipboardList, CheckCircle, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuiz } from '../../hooks/useQuiz';
import { useQuizAttempts } from '../../hooks/useQuizAttempts';

interface Props {
  moduleName: string;
  userId: string;
  onTakeQuiz: () => void;
}

export function QuizBadge({ moduleName, userId, onTakeQuiz }: Props) {
  const { quiz, questions, loading } = useQuiz(moduleName);
  const { attempts, hasPassed } = useQuizAttempts(userId, quiz?.id ?? null);

  if (loading || !quiz || !quiz.published || questions.length === 0) return null;

  // Melhor nota de todas as tentativas
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
  // Última tentativa
  const lastAttempt = attempts[0] ?? null;

  if (hasPassed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30"
      >
        <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-cyan-400">Quiz Concluído ✓</p>
          <p className="text-xs text-gray-500">
            Melhor nota: <span className="text-cyan-300 font-bold">{bestScore}%</span>
            {attempts.length > 1 && <span className="ml-2 text-gray-600">· {attempts.length} tentativas</span>}
          </p>
        </div>
        {/* Permite refazer mesmo aprovado */}
        <button
          onClick={onTakeQuiz}
          className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs font-medium hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Rever
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-5 py-4 rounded-2xl bg-pink-500/10 border border-pink-500/30"
    >
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-pink-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-pink-400">Avaliação disponível</p>
          <p className="text-xs text-gray-500">
            {questions.length} perguntas · Nota mínima: <span className="text-pink-300 font-semibold">{quiz.passing_score}%</span>
            {lastAttempt && (
              <span className="ml-2 text-gray-600">
                · Última tentativa: <span className="text-red-400 font-medium">{lastAttempt.score}%</span>
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onTakeQuiz}
        className="px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-400 transition-colors flex-shrink-0"
      >
        {lastAttempt ? 'Tentar Novamente' : 'Fazer Quiz'}
      </button>
    </motion.div>
  );
}
