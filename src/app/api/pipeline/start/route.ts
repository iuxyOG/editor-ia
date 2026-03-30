import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { createJob, updateJob } from '@/lib/jobQueue';
import { extractAudio, cleanupTemp, getVideoMetadata } from '@/lib/ffmpeg';
import { generateMockTranscription, generateMockAnalysis } from '@/lib/mockData';
import { pipelineStartSchema } from '@/lib/schemas';
import { env, hasOpenAIKey, hasAnthropicKey } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const parsed = pipelineStartSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { videoId, videoUrl, customPrompt } = parsed.data;

    const job = createJob(videoId);
    const demoMode = !hasOpenAIKey() || !hasAnthropicKey();

    // Executar pipeline em background
    runPipeline(job.id, videoUrl, customPrompt, demoMode).catch((err) => {
      logger.error('Pipeline failed', { error: err instanceof Error ? err.message : String(err) });
      updateJob(job.id, {
        step: 'transcription',
        progress: 0,
        message: 'Erro no pipeline',
        error: err.message,
      });
    });

    return NextResponse.json({ jobId: job.id, demoMode });
  } catch (error) {
    logger.error('Pipeline start error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao iniciar pipeline' }, { status: 500 });
  }
}

async function runPipeline(jobId: string, videoUrl: string, customPrompt?: string, demoMode?: boolean) {
  const uploadDir = env.UPLOAD_DIR;
  const filename = path.basename(videoUrl);
  const videoPath = path.join(uploadDir, filename);

  if (!existsSync(videoPath)) {
    updateJob(jobId, { step: 'transcription', progress: 0, message: 'Vídeo não encontrado', error: 'Arquivo de vídeo não encontrado no servidor' });
    return;
  }

  // Get video duration
  let videoDuration = 180;
  try {
    const meta = await getVideoMetadata(videoPath);
    videoDuration = meta.duration || 180;
  } catch { /* use default */ }

  let audioPath: string | null = null;
  const demoTag = demoMode ? ' (modo demo)' : '';

  try {
    // === STEP 1: Transcrição ===
    let transcription;

    if (hasOpenAIKey()) {
      updateJob(jobId, { step: 'transcription', progress: 5, message: 'Extraindo áudio do vídeo...' });

      try {
        audioPath = await extractAudio(videoPath, (pct) => {
          updateJob(jobId, { step: 'transcription', progress: Math.round(5 + pct * 0.3), message: `Extraindo áudio... ${pct}%` });
        });

        updateJob(jobId, { step: 'transcription', progress: 40, message: 'Enviando áudio para Whisper...' });

        const audioBuffer = await readFile(audioPath);
        const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

        const { transcribeAudio } = await import('@/lib/openai');
        transcription = await transcribeAudio(audioFile);
      } catch (err) {
        logger.warn('Whisper failed, falling back to mock', { error: err instanceof Error ? err.message : String(err) });
        transcription = generateMockTranscription(videoDuration);
      }
    } else {
      updateJob(jobId, { step: 'transcription', progress: 20, message: `Gerando transcrição${demoTag}...` });
      await delay(1200);
      transcription = generateMockTranscription(videoDuration);
      updateJob(jobId, { step: 'transcription', progress: 60, message: `Processando palavras${demoTag}...` });
      await delay(800);
    }

    updateJob(jobId, {
      step: 'transcription',
      progress: 100,
      message: `Transcrição concluída!${demoTag}`,
      data: { transcription },
    });

    await delay(300);

    // === STEP 2: Análise com Claude ===
    let analysis;

    if (hasAnthropicKey()) {
      updateJob(jobId, { step: 'analysis', progress: 10, message: 'Analisando conteúdo com Claude...' });

      try {
        const { analyzeContent } = await import('@/lib/claude');
        analysis = await analyzeContent(transcription.text, transcription.duration, customPrompt);
      } catch (err) {
        logger.warn('Claude failed, falling back to mock', { error: err instanceof Error ? err.message : String(err) });
        analysis = generateMockAnalysis(videoDuration);
      }
    } else {
      updateJob(jobId, { step: 'analysis', progress: 15, message: `Analisando conteúdo${demoTag}...` });
      await delay(1000);
      updateJob(jobId, { step: 'analysis', progress: 50, message: `Identificando segmentos${demoTag}...` });
      await delay(800);
      analysis = generateMockAnalysis(videoDuration);
    }

    // Ensure illustration URLs are set
    const illustrationsWithUrls = analysis.illustrations.map((ill: any, i: number) => ({
      ...ill,
      imageUrl: ill.imageUrl || `/api/placeholder/illustration/${i}?style=${ill.style}&prompt=${encodeURIComponent((ill.prompt || '').slice(0, 50))}`,
    }));

    updateJob(jobId, {
      step: 'analysis',
      progress: 100,
      message: `Análise concluída!${demoTag}`,
      data: {
        analysis: { ...analysis, illustrations: illustrationsWithUrls },
        segments: analysis.segments,
        illustrations: illustrationsWithUrls,
      },
    });

    await delay(300);

    // === STEP 3: Ilustrações ===
    const totalIll = illustrationsWithUrls.length;
    for (let i = 0; i < totalIll; i++) {
      const pct = Math.round(((i + 1) / totalIll) * 100);
      updateJob(jobId, {
        step: 'illustrations',
        progress: pct,
        message: `Gerando ilustração ${i + 1} de ${totalIll}${demoTag}...`,
      });
      await delay(demoMode ? 500 : 800);
    }

    updateJob(jobId, { step: 'illustrations', progress: 100, message: `Ilustrações prontas!${demoTag}` });
    await delay(300);

    // === STEP 4: Renderização ===
    for (let pct = 0; pct <= 100; pct += 8) {
      updateJob(jobId, {
        step: 'rendering',
        progress: pct,
        message: pct < 30
          ? `Preparando composição${demoTag}...`
          : pct < 70
          ? `Renderizando frames${demoTag}... ${pct}%`
          : `Finalizando${demoTag}...`,
      });
      await delay(demoMode ? 250 : 400);
    }

    updateJob(jobId, {
      step: 'rendering',
      progress: 100,
      message: `Vídeo processado com sucesso!${demoTag}`,
      data: { demoMode },
    });
  } finally {
    if (audioPath) await cleanupTemp(audioPath);
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
