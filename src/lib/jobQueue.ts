import { getDb } from './db';
import type { PipelineStep } from '@/types';

export interface JobEvent {
  step: PipelineStep;
  progress: number;
  message: string;
  error?: string;
  data?: Record<string, unknown>;
}

export interface Job {
  id: string;
  videoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: PipelineStep;
  progress: number;
  message: string;
  error?: string;
  results: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// In-memory listeners for real-time SSE push (supplements SQLite persistence)
const listeners = new Map<string, Set<(event: JobEvent) => void>>();

export function createJob(videoId: string): Job {
  const db = getDb();
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  db.prepare(`
    INSERT INTO jobs (id, videoId, status, currentStep, progress, message, results, createdAt, updatedAt)
    VALUES (?, ?, 'pending', 'upload', 0, 'Aguardando...', '{}', ?, ?)
  `).run(id, videoId, now, now);

  return {
    id,
    videoId,
    status: 'pending',
    currentStep: 'upload',
    progress: 0,
    message: 'Aguardando...',
    results: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function getJob(jobId: string): Job | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as Record<string, unknown> | undefined;
  if (!row) return undefined;

  return {
    id: row.id as string,
    videoId: row.videoId as string,
    status: row.status as Job['status'],
    currentStep: row.currentStep as PipelineStep,
    progress: row.progress as number,
    message: row.message as string,
    error: row.error as string | undefined,
    results: JSON.parse((row.results as string) || '{}'),
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number,
  };
}

export function updateJob(jobId: string, event: JobEvent): void {
  const db = getDb();
  const now = Date.now();

  let status: string = 'processing';
  if (event.error) {
    status = 'failed';
  } else if (event.step === 'rendering' && event.progress >= 100) {
    status = 'completed';
  }

  // Merge results
  const existing = getJob(jobId);
  const mergedResults = { ...(existing?.results || {}), ...(event.data || {}) };

  db.prepare(`
    UPDATE jobs
    SET status = ?, currentStep = ?, progress = ?, message = ?,
        error = ?, results = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    status,
    event.step,
    event.progress,
    event.message,
    event.error || null,
    JSON.stringify(mergedResults),
    now,
    jobId
  );

  // Notify SSE listeners
  const jobListeners = listeners.get(jobId);
  if (jobListeners) {
    for (const listener of jobListeners) {
      try {
        listener(event);
      } catch {
        // listener may have been cleaned up
      }
    }
  }
}

export function subscribeToJob(jobId: string, listener: (event: JobEvent) => void): () => void {
  if (!listeners.has(jobId)) {
    listeners.set(jobId, new Set());
  }
  listeners.get(jobId)!.add(listener);

  return () => {
    const set = listeners.get(jobId);
    if (set) {
      set.delete(listener);
      if (set.size === 0) listeners.delete(jobId);
    }
  };
}

export function deleteJob(jobId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
  listeners.delete(jobId);
}

// Cleanup old jobs (24h+)
export function cleanupOldJobs(): number {
  const db = getDb();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const result = db.prepare('DELETE FROM jobs WHERE createdAt < ?').run(cutoff);
  return result.changes;
}
