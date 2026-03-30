import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'videoai.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('synchronous = NORMAL');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      videoId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      currentStep TEXT NOT NULL DEFAULT 'upload',
      progress INTEGER NOT NULL DEFAULT 0,
      message TEXT NOT NULL DEFAULT '',
      error TEXT,
      results TEXT DEFAULT '{}',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_videoId ON jobs(videoId);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  `);

  // Mark stale in-progress jobs as failed on startup
  db.prepare(`
    UPDATE jobs SET status = 'failed', error = 'Servidor reiniciou durante processamento'
    WHERE status IN ('pending', 'processing')
    AND updatedAt < ?
  `).run(Date.now() - 5000);
}
