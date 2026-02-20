import Database from 'better-sqlite3';
import path from 'path';
import { createBackup, pruneBackups } from '@/lib/db-backup.js';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');
const BACKUP_INTERVAL_MS = 60 * 60 * 1000;
const INTEGRITY_INTERVAL_MS = 30 * 60 * 1000;
const MAX_BACKUPS = 10;

let backupTimer = null;
let integrityTimer = null;
let shutdownRequested = false;

function checkIntegrity() {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const result = db.pragma('integrity_check');
    db.close();
    const ok = result[0]?.integrity_check === 'ok';
    if (!ok) console.error('[DR] Integrity check FAILED:', JSON.stringify(result));
    else console.log('[DR] Integrity check passed');
    return ok;
  } catch (err) {
    console.error('[DR] Integrity check error:', err.message);
    return false;
  }
}

function runBackup() {
  try {
    const result = createBackup({ dbPath: DB_PATH, backupDir: BACKUP_DIR, label: 'auto' });
    pruneBackups({ backupDir: BACKUP_DIR, maxBackups: MAX_BACKUPS });
    console.log(`[DR] Backup created: ${path.basename(result.path)} (${(result.size / 1024).toFixed(0)}KB)`);
    return result;
  } catch (err) {
    console.error('[DR] Backup failed:', err.message);
    return null;
  }
}

export function startLifecycle(server) {
  console.log('[DR] Starting disaster recovery lifecycle');

  checkIntegrity();
  runBackup();

  backupTimer = setInterval(runBackup, BACKUP_INTERVAL_MS);
  integrityTimer = setInterval(checkIntegrity, INTEGRITY_INTERVAL_MS);

  const shutdown = (signal) => {
    if (shutdownRequested) return;
    shutdownRequested = true;
    console.log(`[DR] ${signal} received, graceful shutdown`);

    clearInterval(backupTimer);
    clearInterval(integrityTimer);

    server.close(() => {
      console.log('[DR] Server closed');
      runBackup();
      console.log('[DR] Final backup complete. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[DR] Shutdown timeout, forcing exit');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return { checkIntegrity, runBackup };
}

export function stopLifecycle() {
  if (backupTimer) clearInterval(backupTimer);
  if (integrityTimer) clearInterval(integrityTimer);
  backupTimer = null;
  integrityTimer = null;
}
