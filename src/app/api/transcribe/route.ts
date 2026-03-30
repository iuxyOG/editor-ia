import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { transcribeAudio } from '@/lib/openai';
import { extractAudio, cleanupTemp } from '@/lib/ffmpeg';
import { transcribeSchema } from '@/lib/schemas';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let audioPath: string | null = null;

  try {
    const parsed = transcribeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { videoId, videoUrl } = parsed.data;

    const uploadDir = env.UPLOAD_DIR;
    const filename = path.basename(videoUrl);
    const videoPath = path.join(uploadDir, filename);

    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    // Extrair áudio do vídeo com ffmpeg
    audioPath = await extractAudio(videoPath);

    // Ler o arquivo de áudio extraído e enviar ao Whisper
    const audioBuffer = await readFile(audioPath);
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

    const transcription = await transcribeAudio(audioFile);

    return NextResponse.json({ transcription });
  } catch (error) {
    logger.error('Transcription error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Falha na transcrição. Verifique sua API key do OpenAI.' },
      { status: 500 }
    );
  } finally {
    // Limpar arquivo temporário de áudio
    if (audioPath) {
      await cleanupTemp(audioPath);
    }
  }
}
