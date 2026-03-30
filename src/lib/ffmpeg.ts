import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
}

/**
 * Extrai metadados do vídeo usando ffprobe
 */
export function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const format = metadata.format;

      resolve({
        duration: format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        codec: videoStream?.codec_name || 'unknown',
        bitrate: Number(format.bit_rate) || 0,
        fps: videoStream?.r_frame_rate
          ? eval(videoStream.r_frame_rate) // e.g. "30/1" → 30
          : 30,
      });
    });
  });
}

/**
 * Extrai o áudio de um vídeo para MP3
 * Retorna o caminho do arquivo de áudio extraído
 */
export function extractAudio(
  videoPath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    `audio_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioFrequency(16000) // 16kHz é ideal para Whisper
      .audioChannels(1) // mono
      .on('progress', (progress) => {
        onProgress?.(Math.round(progress.percent || 0));
      })
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`FFmpeg audio extraction failed: ${err.message}`)))
      .save(outputPath);
  });
}

/**
 * Gera thumbnail do vídeo (captura frame no segundo especificado)
 */
export function generateThumbnail(
  videoPath: string,
  timeInSeconds: number = 1
): Promise<string> {
  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const filename = `thumb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`;
  const outputPath = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeInSeconds],
        filename,
        folder: outputDir,
        size: '640x?', // 640px de largura, altura proporcional
      })
      .on('end', () => resolve(`/uploads/thumbnails/${filename}`))
      .on('error', (err) => reject(new Error(`FFmpeg thumbnail failed: ${err.message}`)));
  });
}

/**
 * Remove arquivo temporário
 */
export async function cleanupTemp(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch {
    // silently ignore cleanup failures
  }
}
