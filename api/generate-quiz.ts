import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Servidor não configurado.' });
  }

  const { moduleName, videosContent } = req.body as {
    moduleName?: string;
    videosContent?: string;
  };

  if (!moduleName || !videosContent?.trim()) {
    return res.status(400).json({ error: 'moduleName e videosContent são obrigatórios.' });
  }

  const prompt = `Crie 5 perguntas de múltipla escolha sobre o módulo "${moduleName}" com base neste conteúdo:

${videosContent.slice(0, 6000)}

Retorne APENAS JSON válido, sem markdown, sem explicação:
[{"question_text":"...","options":["A","B","C","D"],"correct_index":0}]`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(502).json({ error: 'Erro na API Gemini: ' + errText });
    }

    const geminiJson = await geminiRes.json();
    const text: string =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'Resposta inesperada da IA. Tente novamente.' });
    }

    const questions = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ questions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return res.status(500).json({ error: msg });
  }
}
