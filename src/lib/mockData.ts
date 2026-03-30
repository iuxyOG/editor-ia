import type { Transcription, ContentAnalysis, IllustrationStyle } from '@/types';

/**
 * Gera transcrição mock para modo demo (sem API key do Whisper)
 */
export function generateMockTranscription(duration: number): Transcription {
  const sampleTexts = [
    'Olá, bem-vindos ao nosso vídeo de hoje. Vamos falar sobre um tema muito importante que afeta todos nós.',
    'Existem diversas formas de abordar esse assunto e vamos explorar cada uma delas com exemplos práticos.',
    'O primeiro ponto que precisamos entender é a base fundamental do conceito, que serve como alicerce para tudo.',
    'Agora vamos para a parte prática, onde tudo faz mais sentido. Vou mostrar passo a passo como funciona.',
    'Para finalizar, vamos recapitular os pontos mais importantes que vimos ao longo do vídeo.',
    'Não esqueça de deixar seu like e se inscrever no canal para mais conteúdo como este.',
  ];

  const segments = [];
  const words: { text: string; start: number; end: number }[] = [];
  const segDuration = Math.min(30, duration / 3);
  const numSegments = Math.max(3, Math.ceil(duration / segDuration));

  for (let i = 0; i < numSegments; i++) {
    const start = i * segDuration;
    const end = Math.min((i + 1) * segDuration, duration);
    const text = sampleTexts[i % sampleTexts.length];
    const segWords = text.split(' ');
    const wordDur = (end - start) / segWords.length;

    const segWordsArr = segWords.map((word, wi) => ({
      text: word,
      start: +(start + wi * wordDur).toFixed(3),
      end: +(start + (wi + 1) * wordDur).toFixed(3),
    }));

    segments.push({ id: i, text, start, end, words: segWordsArr });
    words.push(...segWordsArr);
  }

  return {
    text: segments.map((s) => s.text).join(' '),
    segments,
    words,
    language: 'pt',
    duration,
  };
}

/**
 * Gera análise de conteúdo mock para modo demo (sem API key do Claude)
 */
export function generateMockAnalysis(duration: number): ContentAnalysis {
  const numSeg = Math.max(3, Math.ceil(duration / 60));
  const segDur = duration / numSeg;

  const segmentTitles = [
    'Introdução e Contexto',
    'Desenvolvimento do Tema',
    'Conceito Principal',
    'Exemplos Práticos',
    'Conclusão e Resumo',
    'Call to Action',
  ];

  const segmentDescriptions = [
    'Apresentação do tema principal e contextualização para o espectador',
    'Aprofundamento no assunto com argumentos e referências',
    'Explicação detalhada do conceito central abordado no vídeo',
    'Demonstração prática com exemplos aplicáveis do dia a dia',
    'Recapitulação dos pontos-chave e considerações finais',
    'Convite à ação e engajamento com o conteúdo',
  ];

  const segments = Array.from({ length: numSeg }, (_, i) => ({
    id: `seg_${i + 1}`,
    title: segmentTitles[i % segmentTitles.length],
    description: segmentDescriptions[i % segmentDescriptions.length],
    start: +(i * segDur).toFixed(2),
    end: +((i + 1) * segDur).toFixed(2),
    status: 'completed' as const,
  }));

  const styles: IllustrationStyle[] = ['flat', 'minimalist', 'cartoon', 'realistic', 'watercolor'];
  const positions = ['top-right', 'top-left', 'bottom-right', 'center', 'full'] as const;

  const prompts = [
    'Professional infographic showing key concepts with clean design',
    'Abstract visualization of data flow and connections',
    'Friendly cartoon character explaining a concept on whiteboard',
    'Modern workspace with digital tools and productivity elements',
    'Colorful mind map showing interconnected ideas',
  ];

  const illustrations = segments.slice(0, Math.min(5, numSeg)).map((seg, i) => ({
    id: `ill_${i + 1}`,
    segmentId: seg.id,
    prompt: prompts[i % prompts.length],
    imageUrl: `/api/placeholder/illustration/${i}?style=${styles[i % styles.length]}&prompt=${encodeURIComponent(prompts[i % prompts.length].slice(0, 40))}`,
    style: styles[i % styles.length],
    start: +(seg.start + 2).toFixed(2),
    end: +(seg.start + segDur * 0.7).toFixed(2),
    position: positions[i % positions.length],
  }));

  return {
    segments,
    illustrations,
    highlights: [
      { start: +(segDur * 0.5).toFixed(2), end: +(segDur * 0.8).toFixed(2), reason: 'Momento-chave do conteúdo' },
      { start: +(duration * 0.7).toFixed(2), end: +(duration * 0.8).toFixed(2), reason: 'Ponto de maior impacto emocional' },
    ],
    subtitleSuggestions: segments.map((seg) => ({
      segmentId: seg.id,
      style: 'hormozi' as const,
      reason: 'Estilo dinâmico para manter engajamento',
    })),
  };
}

