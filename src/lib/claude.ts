import Anthropic from '@anthropic-ai/sdk';
import type { ContentAnalysis, IllustrationStyle } from '@/types';
import { env } from '@/lib/env';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function analyzeContent(
  transcriptionText: string,
  duration: number,
  customPrompt?: string
): Promise<ContentAnalysis> {
  const systemPrompt = `Você é um diretor de edição de vídeo profissional brasileiro com vasta experiência em conteúdo digital.
Analise a transcrição fornecida e retorne APENAS um JSON válido (sem markdown, sem backticks) com a seguinte estrutura:
{
  "segments": [
    {
      "id": "seg_1",
      "title": "Título do segmento",
      "description": "Descrição breve do conteúdo",
      "start": 0.0,
      "end": 30.0,
      "status": "completed"
    }
  ],
  "illustrations": [
    {
      "id": "ill_1",
      "segmentId": "seg_1",
      "prompt": "Prompt detalhado para gerar a ilustração",
      "imageUrl": "",
      "style": "flat",
      "start": 5.0,
      "end": 10.0,
      "position": "top-right"
    }
  ],
  "highlights": [
    {
      "start": 15.0,
      "end": 20.0,
      "reason": "Momento de maior impacto emocional"
    }
  ],
  "subtitleSuggestions": [
    {
      "segmentId": "seg_1",
      "style": "hormozi",
      "reason": "Trecho com ritmo rápido e impacto"
    }
  ]
}

Regras:
- Divida o vídeo em segmentos temáticos lógicos (duração: ${duration}s)
- Sugira 3-8 ilustrações contextuais nos momentos mais relevantes
- Identifique 2-5 momentos de destaque
- Estilos de legenda válidos: hormozi, clean, karaoke, typewriter, pop
- Posições válidas: top-left, top-right, bottom-left, bottom-right, center, full
- Estilos de ilustração válidos: flat, realistic, cartoon, minimalist, watercolor, 3d-render`;

  const userMessage = customPrompt
    ? `${customPrompt}\n\nTranscrição do vídeo:\n${transcriptionText}`
    : `Analise esta transcrição e gere sugestões de edição profissional:\n\n${transcriptionText}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extrair JSON da resposta (caso venha com texto extra)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta do Claude não contém JSON válido');
  }

  return JSON.parse(jsonMatch[0]) as ContentAnalysis;
}

export async function generateIllustrationPrompt(
  segmentText: string,
  style: IllustrationStyle,
  context: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `Você gera prompts otimizados para geração de imagens.
Retorne APENAS o prompt em inglês, sem explicações.
Estilo solicitado: ${style}`,
    messages: [
      {
        role: 'user',
        content: `Gere um prompt de ilustração para este trecho de vídeo:
Trecho: "${segmentText}"
Contexto geral: ${context}`,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
