import { readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

interface CleanupResult {
  filesDeleted: number;
  bytesFreed: number;
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Deleta arquivos mais antigos que MAX_AGE em um diretório
 */
async function cleanDirectory(dir: string, maxAgeMs: number = MAX_AGE_MS): Promise<CleanupResult> {
  const result: CleanupResult = { filesDeleted: 0, bytesFreed: 0 };

  if (!existsSync(dir)) return result;

  try {
    const files = await readdir(dir);
    const now = Date.now();

    for (const file of files) {
      // Keep .gitkeep files
      if (file === '.gitkeep') continue;

      const filepath = path.join(dir, file);
      try {
        const stats = await stat(filepath);

        if (stats.isFile() && (now - stats.mtimeMs) > maxAgeMs) {
          result.bytesFreed += stats.size;
          await unlink(filepath);
          result.filesDeleted++;
        }
      } catch {
        // Skip files that can't be accessed
      }
    }
  } catch {
    // Directory might not exist or be inaccessible
  }

  return result;
}

/**
 * Executa cleanup de todos os diretórios temporários
 */
export async function runCleanup(): Promise<{
  uploads: CleanupResult;
  outputs: CleanupResult;
  temp: CleanupResult;
  thumbnails: CleanupResult;
  illustrations: CleanupResult;
  total: CleanupResult;
}> {
  const baseDir = process.cwd();

  const [uploads, outputs, temp, thumbnails, illustrations] = await Promise.all([
    cleanDirectory(path.join(baseDir, 'public', 'uploads'), MAX_AGE_MS),
    cleanDirectory(path.join(baseDir, 'public', 'outputs'), MAX_AGE_MS),
    cleanDirectory(path.join(baseDir, 'public', 'uploads', 'temp'), 2 * 60 * 60 * 1000), // 2h for temp
    cleanDirectory(path.join(baseDir, 'public', 'uploads', 'thumbnails'), MAX_AGE_MS),
    cleanDirectory(path.join(baseDir, 'public', 'uploads', 'illustrations'), MAX_AGE_MS),
  ]);

  const total: CleanupResult = {
    filesDeleted: uploads.filesDeleted + outputs.filesDeleted + temp.filesDeleted + thumbnails.filesDeleted + illustrations.filesDeleted,
    bytesFreed: uploads.bytesFreed + outputs.bytesFreed + temp.bytesFreed + thumbnails.bytesFreed + illustrations.bytesFreed,
  };

  if (total.filesDeleted > 0) {
    const mbFreed = (total.bytesFreed / (1024 * 1024)).toFixed(1);
    logger.info('Cleanup completed', { filesDeleted: total.filesDeleted, mbFreed });
  }

  return { uploads, outputs, temp, thumbnails, illustrations, total };
}
