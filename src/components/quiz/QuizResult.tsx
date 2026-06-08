import { CheckCircle, XCircle, RotateCcw, X, Award } from 'lucide-react';
import { motion } from 'motion/react';
import type { QuizQuestion } from '../../types/quiz';

interface Props {
  score: number;
  passed: boolean;
  passingScore: number;
  questions: QuizQuestion[];
  answers: number[];
  onRetake: () => void;
  onClose: () => void;
}

export function QuizResult({ score, passed, passingScore, questions, answers, onRetake, onClose }: Props) {
  const correctCount = answers.filter((ans, i) => ans === questions[i]?.correct_index).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col max-h-[80vh]"
    >
      {/* ── Cabeçalho com nota ── */}
      <div className={`px-6 py-8 flex flex-col items-center text-center gap-3 ${passed ? 'bg-cyan-500/10' : 'bg-red-500/10'}`}>
        {/* Círculo de nota */}
        <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${
          passed ? 'border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.4)]' : 'border-red-400'
        }`}>
          <span className={`text-2xl font-black ${passed ? 'text-cyan-400' : 'text-red-400'}`}>{score}%</span>
          <span className="text-xs text-gray-500 mt-0.5">nota</span>
        </div>

        {passed ? (
          <>
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle className="w-5 h-5" />
              <h2 className="text-xl font-bold text-white">Aprovado!</h2>
            </div>
            <p className="text-sm text-gray-400">
              {correctCount} de {questions.length} acertos · mínimo exigido: <span className="text-cyan-400 font-semibold">{passingScore}%</span>
            </p>
            <p className="text-xs text-gray-500">🏆 Certificado desbloqueado para este módulo</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <h2 className="text-xl font-bold text-white">Reprovado</h2>
            </div>
            <p className="text-sm text-gray-400">
              {correctCount} de {questions.length} acertos · mínimo exigido: <span className="text-red-400 font-semibold">{passingScore}%</span>
            </p>
            <p className="text-xs text-gray-500">Revise as questões abaixo e tente novamente.</p>
          </>
        )}
      </div>

      {/* ── Gabarito ── */}
      <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Gabarito</h3>

        {questions.map((q, qi) => {
          const userAnswer = answers[qi];
          const isCorrect = userAnswer === q.correct_index;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 ${
                isCorrect ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              {/* Pergunta */}
              <div className="flex items-start gap-2 mb-3">
                {isCorrect
                  ? <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                }
                <p className="text-sm font-medium text-white leading-snug">
                  <span className="text-gray-500 mr-1">{qi + 1}.</span>
                  {q.question_text}
                </p>
              </div>

              {/* Opções */}
              <div className="space-y-1.5 ml-6">
                {q.options.map((opt, oi) => {
                  const isUserChoice = oi === userAnswer;
                  const isRightAnswer = oi === q.correct_index;

                  let style = 'text-gray-600 border-transparent bg-transparent';
                  if (isRightAnswer) style = 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10 font-medium';
                  if (isUserChoice && !isCorrect) style = 'text-red-300 border-red-500/40 bg-red-500/10 font-medium';

                  return (
                    <div key={oi} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${style}`}>
                      <span className="font-bold text-gray-500 w-4 flex-shrink-0">{String.fromCharCode(65 + oi)}.</span>
                      <span className="flex-1">{opt}</span>
                      {isRightAnswer && (
                        <span className="text-[10px] text-cyan-400 font-semibold flex-shrink-0">✓ correta</span>
                      )}
                      {isUserChoice && !isCorrect && (
                        <span className="text-[10px] text-red-400 font-semibold flex-shrink-0">sua resposta</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Botões ── */}
      <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-center">
        {passed ? (
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-cyan-500 text-gray-950 font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Ver Certificado
          </button>
        ) : (
          <>
            <button
              onClick={onRetake}
              className="px-6 py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-400 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
