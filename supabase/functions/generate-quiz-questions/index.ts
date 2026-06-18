import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { moduleName, videosContent } = await req.json() as {
      moduleName: string;
      videosContent: string;
    };

    if (!moduleName || !videosContent?.trim()) {
      return new Response(
        JSON.stringify({ error: 'moduleName e videosContent são obrigatórios.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave Gemini não configurada no servidor.' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    const prompt = `Crie 5 perguntas de múltipla escolha sobre o módulo "${moduleName}" com base neste conteúdo:

${videosContent}

Retorne APENAS JSON válido, sem markdown, sem explicação:
[{"question_text":"...","options":["A","B","C","D"],"correct_index":0}]`;

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
      const err = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: 'Erro na API Gemini: ' + err }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    const geminiJson = await geminiRes.json();
    const text: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Resposta inesperada da IA. Tente novamente.' }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
