import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// URL do projeto (pública). A chave service_role NUNCA vai ao cliente.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ebgzwxsnmfcfmhjowpqb.supabase.co';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(500).json({ error: 'Servidor não configurado (service key ausente).' });
  }

  // 1) Autentica o aluno pelo token enviado (não confiamos em userId do body)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }
  const userId = userData.user.id;

  // 2) Lê e valida a entrada
  const { quizId, answers } = req.body as { quizId?: string; answers?: number[] };
  if (!quizId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'quizId e answers são obrigatórios.' });
  }

  try {
    // 3) Busca o quiz e o gabarito (correct_index) com service role — fica só no servidor
    const { data: quiz, error: quizErr } = await admin
      .from('quizzes')
      .select('id, passing_score, published')
      .eq('id', quizId)
      .single();

    if (quizErr || !quiz || !quiz.published) {
      return res.status(404).json({ error: 'Quiz não encontrado ou não publicado.' });
    }

    const { data: questions, error: qErr } = await admin
      .from('quiz_questions')
      .select('correct_index, position')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });

    if (qErr || !questions || questions.length === 0) {
      return res.status(404).json({ error: 'Perguntas não encontradas.' });
    }

    // 4) Corrige no servidor
    const correctIndexes = questions.map(q => q.correct_index as number);
    const correct = correctIndexes.reduce(
      (acc, ci, i) => acc + (answers[i] === ci ? 1 : 0),
      0,
    );
    const score = Math.round((correct / correctIndexes.length) * 100);
    const passed = score >= quiz.passing_score;

    // 5) Grava a tentativa (service role) — cliente não consegue forjar
    const { error: insErr } = await admin.from('quiz_attempts').insert([{
      user_id: userId,
      quiz_id: quizId,
      score,
      passed,
      answers,
    }]);
    if (insErr) {
      return res.status(500).json({ error: 'Erro ao registrar tentativa: ' + insErr.message });
    }

    // 6) Devolve o resultado + gabarito (revelar após enviar é OK e ajuda o aluno a revisar)
    return res.status(200).json({ score, passed, correctIndexes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return res.status(500).json({ error: msg });
  }
}
