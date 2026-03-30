import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getVideoMetadata, generateThumbnail } from '@/lib/ffmpeg';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 });
    }

    // Validar tamanho (500MB)
    const maxSize = env.NEXT_PUBLIC_MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande' }, { status: 400 });
    }

    const uploadDir = env.UPLOAD_DIR;
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const id = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Sanitizar nome do arquivo
    const ext = (path.extname(file.name) || '.mp4').replace(/[^a-zA-Z0-9.]/g, '');
    const filename = `${id}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Streaming write — não carrega o arquivo inteiro na RAM
    await streamFileToDisk(file, filepath);

    // Extrair metadados reais com ffprobe
    let metadata = { duration: 0, width: 0, height: 0, codec: '', bitrate: 0, fps: 30 };
    let thumbnailUrl = '';

    try {
      metadata = await getVideoMetadata(filepath);
    } catch (err) {
      logger.warn('Could not extract metadata', { error: err instanceof Error ? err.message : String(err) });
    }

    // Validar duração
    const maxDurationSec = env.NEXT_PUBLIC_MAX_VIDEO_DURATION;
    if (metadata.duration > maxDurationSec) {
      // Deletar o arquivo já salvo
      const { unlink } = await import('fs/promises');
      await unlink(filepath).catch(() => {});
      return NextResponse.json(
        { error: `Vídeo muito longo (${Math.round(metadata.duration)}s). Máximo: ${maxDurationSec}s.` },
        { status: 400 }
      );
    }

    // Gerar thumbnail
    try {
      thumbnailUrl = await generateThumbnail(filepath);
    } catch (err) {
      logger.warn('Could not generate thumbnail', { error: err instanceof Error ? err.message : String(err) });
    }

    return NextResponse.json({
      id,
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      thumbnailUrl,
    });
  } catch (error) {
    logger.error('Upload error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}

/**
 * Stream a File/Blob to disk without loading entire content in memory.
 * Reads 64KB chunks from the ReadableStream and pipes to a WriteStream.
 */
async function streamFileToDisk(file: File, filepath: string): Promise<void> {
  const writeStream = createWriteStream(filepath);

  // Use the Web Streams API to read in chunks
  const reader = file.stream().getReader();

  return new Promise<void>((resolve, reject) => {
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    function pump() {
      reader.read().then(({ done, value }) => {
        if (done) {
          writeStream.end();
          return;
        }
        // Backpressure: if write returns false, wait for drain
        if (!writeStream.write(value)) {
          writeStream.once('drain', pump);
        } else {
          pump();
        }
      }).catch((err) => {
        writeStream.destroy(err);
        reject(err);
      });
    }

    pump();
  });
}
