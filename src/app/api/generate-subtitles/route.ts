import { NextRequest, NextResponse } from 'next/server';
import type { TranscriptionWord, SubtitleStyle } from '@/types';
import { generateSubtitlesSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

interface SubtitleBlock {
  id: string;
  text: string;
  words: TranscriptionWord[];
  start: number;
  end: number;
}

function generateSubtitleBlocks(words: TranscriptionWord[], style: SubtitleStyle['preset']): SubtitleBlock[] {
  const blocks: SubtitleBlock[] = [];

  // Hormozi style: palavra por palavra
  if (style === 'hormozi') {
    const maxWords = 3;
    for (let i = 0; i < words.length; i += maxWords) {
      const chunk = words.slice(i, i + maxWords);
      blocks.push({
        id: `sub_${i}`,
        text: chunk.map((w) => w.text).join(' '),
        words: chunk,
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
      });
    }
    return blocks;
  }

  // Outros estilos: blocos de ~5-8 palavras
  const maxWords = style === 'typewriter' ? 6 : 8;
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords);
    blocks.push({
      id: `sub_${i}`,
      text: chunk.map((w) => w.text).join(' '),
      words: chunk,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
    });
  }

  return blocks;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = generateSubtitlesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { words, style } = parsed.data;

    const blocks = generateSubtitleBlocks(words, style);

    return NextResponse.json({ blocks });
  } catch (error) {
    logger.error('Subtitle generation error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao gerar legendas' }, { status: 500 });
  }
}
