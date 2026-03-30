import { NextResponse } from 'next/server';
import { runCleanup } from '@/lib/cleanup';
import { cleanupOldJobs } from '@/lib/jobQueue';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const fileResults = await runCleanup();
    const jobsDeleted = cleanupOldJobs();

    return NextResponse.json({
      success: true,
      files: fileResults.total,
      jobsDeleted,
    });
  } catch (error) {
    logger.error('Cleanup error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha no cleanup' }, { status: 500 });
  }
}
