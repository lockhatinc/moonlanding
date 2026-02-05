import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

const MOONLANDING_DB = path.resolve(process.cwd(), 'data', 'app.db');
const FRIDAY_DB = process.env.FRIDAY_DB_PATH || path.resolve(process.cwd(), 'data', 'friday.db');

let databases = {
  moonlanding: null,
  friday: null
};

let routingConfig = {
  writeMode: 'dual', // 'moonlanding' | 'friday' | 'dual'
  readPrimary: 'moonlanding', // 'moonlanding' | 'friday'
  telemetryEnabled: true,
};

let telemetry = {
  writes: { moonlanding: 0, friday: 0, dual: 0, total: 0 },
  reads: { moonlanding_success: 0, moonlanding_fail: 0, friday_fallback: 0, total: 0 },
  errors: { moonlanding: 0, friday: 0, total: 0 },
  startTime: Date.now(),
};

export function initializeDualDatabaseRouter() {
  try {
    if (!fs.existsSync(MOONLANDING_DB)) {
      console.error('[DualRouter] Moonlanding DB not found:', MOONLANDING_DB);
      throw new Error('Moonlanding database not initialized');
    }

    databases.moonlanding = new Database(MOONLANDING_DB);
    databases.moonlanding.pragma('journal_mode = WAL');
    databases.moonlanding.pragma('busy_timeout = 5000');
    databases.moonlanding.pragma('foreign_keys = ON');

    if (fs.existsSync(FRIDAY_DB)) {
      databases.friday = new Database(FRIDAY_DB);
      databases.friday.pragma('journal_mode = WAL');
      databases.friday.pragma('busy_timeout = 5000');
      databases.friday.pragma('foreign_keys = ON');
      console.log('[DualRouter] Both databases initialized (Moonlanding + Friday)');
    } else {
      console.warn('[DualRouter] Friday DB not found, write-only mode:', FRIDAY_DB);
    }

    return true;
  } catch (e) {
    console.error('[DualRouter] Initialization failed:', e.message);
    throw e;
  }
}

export function setRoutingMode(mode) {
  if (!['moonlanding', 'friday', 'dual'].includes(mode)) {
    throw new Error(`Invalid routing mode: ${mode}`);
  }
  routingConfig.writeMode = mode;
  console.log('[DualRouter] Write mode changed to:', mode);
}

export function setReadPrimary(primary) {
  if (!['moonlanding', 'friday'].includes(primary)) {
    throw new Error(`Invalid read primary: ${primary}`);
  }
  routingConfig.readPrimary = primary;
  console.log('[DualRouter] Read primary changed to:', primary);
}

export function getRoutingConfig() {
  return { ...routingConfig };
}

export function getTelemetry() {
  return {
    ...telemetry,
    uptime: Date.now() - telemetry.startTime,
  };
}

export function resetTelemetry() {
  telemetry = {
    writes: { moonlanding: 0, friday: 0, dual: 0, total: 0 },
    reads: { moonlanding_success: 0, moonlanding_fail: 0, friday_fallback: 0, total: 0 },
    errors: { moonlanding: 0, friday: 0, total: 0 },
    startTime: Date.now(),
  };
}

function recordWrite(target) {
  if (!routingConfig.telemetryEnabled) return;
  if (target === 'both') telemetry.writes.dual++;
  else telemetry.writes[target]++;
  telemetry.writes.total++;
}

function recordRead(source, success) {
  if (!routingConfig.telemetryEnabled) return;
  if (source === 'moonlanding') {
    if (success) telemetry.reads.moonlanding_success++;
    else telemetry.reads.moonlanding_fail++;
  } else if (source === 'friday') {
    telemetry.reads.friday_fallback++;
  }
  telemetry.reads.total++;
}

function recordError(source) {
  if (!routingConfig.telemetryEnabled) return;
  telemetry.errors[source]++;
  telemetry.errors.total++;
}

export function execQuery(sql, params, context = {}) {
  const primary = databases[routingConfig.readPrimary];
  const fallback = routingConfig.readPrimary === 'moonlanding' ? databases.friday : databases.moonlanding;

  if (!primary) {
    throw new Error(`[DualRouter] Primary database (${routingConfig.readPrimary}) not initialized`);
  }

  try {
    const result = primary.prepare(sql).all(...params);
    recordRead(routingConfig.readPrimary, true);
    return result;
  } catch (e) {
    recordError(routingConfig.readPrimary);
    recordRead(routingConfig.readPrimary, false);

    if (fallback) {
      try {
        console.log(`[DualRouter] Primary read failed, trying fallback for: ${context.entity || 'query'}`);
        const result = fallback.prepare(sql).all(...params);
        recordRead(routingConfig.readPrimary === 'moonlanding' ? 'friday' : 'moonlanding', true);
        return result;
      } catch (fallbackError) {
        recordError(routingConfig.readPrimary === 'moonlanding' ? 'friday' : 'moonlanding');
        throw fallbackError;
      }
    }
    throw e;
  }
}

export function execGet(sql, params, context = {}) {
  const primary = databases[routingConfig.readPrimary];
  const fallback = routingConfig.readPrimary === 'moonlanding' ? databases.friday : databases.moonlanding;

  if (!primary) {
    throw new Error(`[DualRouter] Primary database (${routingConfig.readPrimary}) not initialized`);
  }

  try {
    const result = primary.prepare(sql).get(...params);
    recordRead(routingConfig.readPrimary, true);
    return result;
  } catch (e) {
    recordError(routingConfig.readPrimary);
    recordRead(routingConfig.readPrimary, false);

    if (fallback) {
      try {
        console.log(`[DualRouter] Primary get failed, trying fallback for: ${context.entity || 'record'}`);
        const result = fallback.prepare(sql).get(...params);
        recordRead(routingConfig.readPrimary === 'moonlanding' ? 'friday' : 'moonlanding', true);
        return result;
      } catch (fallbackError) {
        recordError(routingConfig.readPrimary === 'moonlanding' ? 'friday' : 'moonlanding');
        throw fallbackError;
      }
    }
    throw e;
  }
}

export function execRun(sql, params, context = {}) {
  const targets = [];

  if (routingConfig.writeMode === 'moonlanding') {
    targets.push('moonlanding');
  } else if (routingConfig.writeMode === 'friday') {
    targets.push('friday');
  } else if (routingConfig.writeMode === 'dual') {
    targets.push('moonlanding', 'friday');
  }

  const results = [];
  const errors = [];

  for (const target of targets) {
    const db = databases[target];
    if (!db) {
      const msg = `[DualRouter] Database ${target} not initialized`;
      console.warn(msg);
      errors.push({ target, error: msg });
      continue;
    }

    try {
      const result = db.prepare(sql).run(...params);
      results.push({ target, success: true, changes: result.changes });
    } catch (e) {
      recordError(target);
      console.error(`[DualRouter] Write failed to ${target}:`, e.message);
      errors.push({ target, error: e.message });
    }
  }

  if (routingConfig.writeMode === 'dual') {
    recordWrite('both');
  } else {
    recordWrite(targets[0]);
  }

  if (errors.length > 0 && errors.length === targets.length) {
    throw new Error(`All write targets failed: ${errors.map(e => `${e.target}: ${e.error}`).join('; ')}`);
  }

  if (errors.length > 0) {
    console.warn(`[DualRouter] Partial write failure (${results.length}/${targets.length} succeeded):`, errors);
  }

  return results[0] || { changes: 0 };
}

export function getDatabase(name = null) {
  if (name) {
    return databases[name] || null;
  }
  return databases.moonlanding;
}

export function getAllDatabases() {
  return { ...databases };
}

export function closeAllDatabases() {
  for (const [name, db] of Object.entries(databases)) {
    if (db) {
      try {
        db.close();
        console.log(`[DualRouter] Closed ${name} database`);
      } catch (e) {
        console.error(`[DualRouter] Error closing ${name} database:`, e.message);
      }
    }
  }
  databases = { moonlanding: null, friday: null };
}

export function getRoutingStatus() {
  return {
    writeMode: routingConfig.writeMode,
    readPrimary: routingConfig.readPrimary,
    moonlandingConnected: !!databases.moonlanding,
    fridayConnected: !!databases.friday,
    telemetry: getTelemetry(),
  };
}
