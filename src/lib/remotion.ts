import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { ExportSettings, Illustration, SubtitleStyle, Transcription } from '@/types';
import { logger } from '@/lib/logger';

const RESOLUTION_MAP: Record<ExportSettings['resolution'], { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
};

const ASPECT_MAP: Record<ExportSettings['aspectRatio'], (w: number, h: number) => { width: number; height: number }> = {
  '16:9': (w) => ({ width: w, height: Math.round(w * 9 / 16) }),
  '9:16': (_, h) => ({ width: Math.round(h * 9 / 16), height: h }),
  '1:1': (w) => ({ width: w, height: w }),
};

const QUALITY_MAP: Record<ExportSettings['quality'], number> = {
  fast: 28,
  balanced: 23,
  max: 18,
};

export interface RenderConfig {
  videoSrc: string;
  transcription: Transcription;
  illustrations: Illustration[];
  subtitleStyle: SubtitleStyle;
  subtitlesEnabled: boolean;
  exportSettings: ExportSettings;
  outputPath: string;
}

/**
 * Renderiza o vídeo final usando @remotion/renderer
 * Usa import dinâmico para evitar conflitos webpack em build time
 */
export async function renderVideo(
  config: RenderConfig,
  onProgress?: (progress: number) => void
): Promise<string> {
  const outputDir = process.env.OUTPUT_DIR || './public/outputs';
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const outputFilename = `output_${Date.now()}.${config.exportSettings.format}`;
  const outputPath = path.join(outputDir, outputFilename);
  const publicUrl = `/outputs/${outputFilename}`;

  const baseRes = RESOLUTION_MAP[config.exportSettings.resolution];
  const { width, height } = ASPECT_MAP[config.exportSettings.aspectRatio](baseRes.width, baseRes.height);

  try {
    // Dynamic require — modules are externalized in next.config.js
    // so require() resolves to native Node.js require at runtime
    const bundler = require(/* webpackIgnore: true */ '@remotion/bundler');
    const renderer = require(/* webpackIgnore: true */ '@remotion/renderer');

    const bundlePath = await bundler.bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.ts'),
      webpackOverride: (conf: any) => conf,
    });

    const composition = await renderer.selectComposition({
      serveUrl: bundlePath,
      id: 'FinalVideo',
      inputProps: {
        videoSrc: config.videoSrc,
        transcription: config.transcription,
        illustrations: config.illustrations,
        subtitleStyle: config.subtitleStyle,
        subtitlesEnabled: config.subtitlesEnabled,
      },
    });

    await renderer.renderMedia({
      composition: { ...composition, width, height },
      serveUrl: bundlePath,
      codec: config.exportSettings.format === 'webm' ? 'vp8' : 'h264',
      outputLocation: outputPath,
      inputProps: {
        videoSrc: config.videoSrc,
        transcription: config.transcription,
        illustrations: config.illustrations,
        subtitleStyle: config.subtitleStyle,
        subtitlesEnabled: config.subtitlesEnabled,
      },
      crf: QUALITY_MAP[config.exportSettings.quality],
      onProgress: ({ progress }: { progress: number }) => {
        onProgress?.(Math.round(progress * 100));
      },
    });

    return publicUrl;
  } catch (error) {
    logger.error('Remotion render failed', { error: error instanceof Error ? error.message : String(error) });
    logger.warn('Returning original video as fallback');
    return config.videoSrc;
  }
}
