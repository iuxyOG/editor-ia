import { NextRequest, NextResponse } from 'next/server';
import { regenerateImage } from '@/lib/image-generation';
import { generateImageSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const parsed = generateImageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { prompt, style } = parsed.data;

    const imageUrl = await regenerateImage(prompt, style);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    logger.error('Image generation error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao gerar imagem' }, { status: 500 });
  }
}
