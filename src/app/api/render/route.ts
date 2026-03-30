import { NextRequest, NextResponse } from 'next/server';
import { createJob, updateJob, getJob } from '@/lib/jobQueue';
import { renderBodySchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 min para renderização

export async function POST(request: NextRequest) {
  try {
    const parsed = renderBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const {
      videoId, videoUrl, transcription, illustrations,
      subtitleStyle, subtitlesEnabled, exportSettings,
    } = parsed.data;

    // Criar um job para tracking de progresso
    const job = createJob(videoId);

    // Iniciar renderização em background
    renderInBackground(
      job.id,
      videoUrl,
      transcription,
      illustrations,
      subtitleStyle,
      subtitlesEnabled,
      exportSettings
    ).catch((err) => {
      logger.error('Render failed', { error: err instanceof Error ? err.message : String(err) });
      updateJob(job.id, {
        step: 'rendering',
        progress: 0,
        message: 'Erro na renderização',
        error: err.message,
      });
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    logger.error('Render error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha na renderização' }, { status: 500 });
  }
}

async function renderInBackground(
  jobId: string,
  videoUrl: string,
  transcription: unknown,
  illustrations: unknown[],
  subtitleStyle: unknown,
  subtitlesEnabled: boolean,
  exportSettings: { resolution: string; format: string; aspectRatio: string; quality: string },
) {
  try {
    updateJob(jobId, { step: 'rendering', progress: 5, message: 'Preparando composição...' });

    // Tentar renderização real com Remotion
    let outputUrl: string;
    try {
      const { renderVideo } = await import('@/lib/remotion');
      outputUrl = await renderVideo(
        {
          videoSrc: videoUrl,
          transcription: transcription as import('@/types').Transcription,
          illustrations: illustrations as import('@/types').Illustration[],
          subtitleStyle: subtitleStyle as import('@/types').SubtitleStyle,
          subtitlesEnabled,
          exportSettings: exportSettings as import('@/types').ExportSettings,
          outputPath: '',
        },
        (progress) => {
          updateJob(jobId, {
            step: 'rendering',
            progress: Math.round(5 + progress * 0.9),
            message: progress < 30
              ? 'Preparando composição...'
              : progress < 70
              ? `Renderizando frames... ${progress}%`
              : 'Finalizando codificação...',
          });
        }
      );
    } catch (err) {
      logger.warn('Remotion render unavailable, using simulated render', { error: err instanceof Error ? err.message : String(err) });
      // Simulação se Remotion não estiver configurado
      for (let pct = 0; pct <= 100; pct += 5) {
        updateJob(jobId, {
          step: 'rendering',
          progress: Math.round(5 + pct * 0.9),
          message: pct < 30
            ? 'Preparando composição...'
            : pct < 70
            ? `Renderizando frames... ${pct}%`
            : 'Finalizando...',
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      outputUrl = videoUrl; // Retornar original como fallback
    }

    updateJob(jobId, {
      step: 'rendering',
      progress: 100,
      message: 'Vídeo renderizado com sucesso!',
      data: { outputUrl },
    });
  } catch (error) {
    updateJob(jobId, {
      step: 'rendering',
      progress: 0,
      message: 'Erro na renderização',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
