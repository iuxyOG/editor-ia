import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/claude';
import { generateIllustrationsSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const parsed = generateIllustrationsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { transcriptionText, duration, customPrompt } = parsed.data;

    const analysis = await analyzeContent(transcriptionText, duration, customPrompt);

    // Gerar URLs placeholder para as ilustrações
    // Em produção, aqui integraria com DALL-E, Midjourney, etc.
    const illustrationsWithPlaceholders = analysis.illustrations.map((ill, i) => ({
      ...ill,
      imageUrl: `/api/placeholder/illustration/${i}?style=${ill.style}&prompt=${encodeURIComponent(ill.prompt.slice(0, 50))}`,
    }));

    return NextResponse.json({
      ...analysis,
      illustrations: illustrationsWithPlaceholders,
    });
  } catch (error) {
    logger.error('Analysis error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Falha na análise. Verifique sua API key da Anthropic.' },
      { status: 500 }
    );
  }
}
