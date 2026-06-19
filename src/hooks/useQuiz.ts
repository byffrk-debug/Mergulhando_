import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Quiz, QuizQuestion } from '../types/quiz';

// withAnswers=true → lê o gabarito (correct_index) da tabela base.
// Só STAFF (admin/moderador) consegue ler a base; alunos usam a view sem gabarito.
export function useQuiz(moduleName: string, withAnswers = false) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!moduleName) return;
    setLoading(true);

    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, module_name, passing_score, published')
      .eq('module_name', moduleName)
      .single();

    if (quizData) {
      setQuiz(quizData);
      const source = withAnswers ? 'quiz_questions' : 'quiz_questions_public';
      const cols = withAnswers
        ? 'id, quiz_id, question_text, options, correct_index, position'
        : 'id, quiz_id, question_text, options, position';
      const { data: qData } = await supabase
        .from(source)
        .select(cols)
        .eq('quiz_id', quizData.id)
        .order('position', { ascending: true });
      setQuestions((qData as QuizQuestion[]) ?? []);
    } else {
      setQuiz(null);
      setQuestions([]);
    }

    setLoading(false);
  }, [moduleName, withAnswers]);

  useEffect(() => { load(); }, [load]);

  return { quiz, questions, loading, refetch: load };
}
