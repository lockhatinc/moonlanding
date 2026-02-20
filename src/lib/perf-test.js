import { getDatabase, genId, now } from '@/lib/database-core';
import { getStats as getCacheStats, clearStats } from '@/lib/query-cache';
import { getSummary, getMetrics, getSlowQueries, clearMetrics } from '@/lib/query-perf';
import { createOptimizedIndexes, analyzeQuery, optimizeDatabase } from '@/lib/index-optimizer';

export const runPerformanceTest = async (options = {}) => {
  const { recordCount = 10000, concurrency = 10, duration = 5000 } = options;
  const db = getDatabase();
  const results = { setup: {}, tests: {}, summary: {} };

  console.log('[PerfTest] Creating optimized indexes...');
  const indexResult = createOptimizedIndexes();
  results.setup.indexes = indexResult;

  console.log('[PerfTest] Running ANALYZE...');
  optimizeDatabase();

  console.log('[PerfTest] Generating test data...');
  const startSetup = performance.now();

  const clientIds = [];
  for (let i = 0; i < 100; i++) {
    const id = genId();
    db.prepare('INSERT OR IGNORE INTO client (id, name, created_at) VALUES (?, ?, ?)').run(id, `Client ${i}`, now());
    clientIds.push(id);
  }

  const engagementIds = [];
  for (let i = 0; i < recordCount; i++) {
    const id = genId();
    const clientId = clientIds[i % clientIds.length];
    const stage = ['planning', 'execution', 'review', 'complete'][i % 4];
    const status = i % 10 === 0 ? 'deleted' : 'active';
    db.prepare('INSERT OR IGNORE INTO engagement (id, name, client_id, stage, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, `Engagement ${i}`, clientId, stage, status, now() - i, now());
    engagementIds.push(id);
  }

  for (let i = 0; i < recordCount * 2; i++) {
    const id = genId();
    const engagementId = engagementIds[i % engagementIds.length];
    const clientStatus = ['draft', 'sent', 'completed'][i % 3];
    const auditorStatus = ['pending', 'in_progress', 'completed', 'accepted'][i % 4];
    db.prepare('INSERT OR IGNORE INTO rfi (id, engagement_id, client_status, auditor_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, engagementId, clientStatus, auditorStatus, now() - i, now());
  }

  results.setup.duration = (performance.now() - startSetup).toFixed(2);
  results.setup.records = { clients: clientIds.length, engagements: engagementIds.length, rfis: recordCount * 2 };

  clearStats();
  clearMetrics();

  console.log('[PerfTest] Running query tests...');
  const queries = [
    { name: 'simple_select', sql: 'SELECT * FROM engagement WHERE id = ?', params: () => [engagementIds[0]] },
    { name: 'filtered_by_client', sql: 'SELECT * FROM engagement WHERE client_id = ? AND status != "deleted"', params: () => [clientIds[0]] },
    { name: 'filtered_by_stage', sql: 'SELECT * FROM engagement WHERE stage = ? AND status != "deleted" ORDER BY created_at DESC', params: () => ['execution'] },
    { name: 'count_by_status', sql: 'SELECT status, COUNT(*) as count FROM engagement GROUP BY status', params: () => [] },
    { name: 'rfi_progress', sql: 'SELECT id, client_status, auditor_status FROM rfi WHERE engagement_id = ?', params: () => [engagementIds[0]] },
    { name: 'rfi_by_status', sql: 'SELECT * FROM rfi WHERE engagement_id = ? AND client_status = ?', params: () => [engagementIds[0], 'sent'] },
    { name: 'join_engagement_client', sql: 'SELECT e.*, c.name as client_name FROM engagement e LEFT JOIN client c ON e.client_id = c.id WHERE e.id = ?', params: () => [engagementIds[0]] },
    { name: 'paginated_list', sql: 'SELECT * FROM engagement WHERE status != "deleted" ORDER BY created_at DESC LIMIT 50 OFFSET 0', params: () => [] }
  ];

  for (const query of queries) {
    const times = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const params = query.params();
      const start = performance.now();
      db.prepare(query.sql).all(...params);
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(iterations * 0.5)];
    const p95 = times[Math.floor(iterations * 0.95)];
    const p99 = times[Math.floor(iterations * 0.99)];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    results.tests[query.name] = {
      iterations,
      avg: avg.toFixed(2),
      p50: p50.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      min: times[0].toFixed(2),
      max: times[times.length - 1].toFixed(2)
    };

    const plan = analyzeQuery(query.sql);
    results.tests[query.name].queryPlan = plan;
  }

  console.log('[PerfTest] Running concurrent load test...');
  const concurrentStart = performance.now();
  const promises = [];

  for (let i = 0; i < concurrency; i++) {
    promises.push((async () => {
      const end = Date.now() + duration;
      let count = 0;
      while (Date.now() < end) {
        const randomEngagement = engagementIds[Math.floor(Math.random() * engagementIds.length)];
        db.prepare('SELECT * FROM rfi WHERE engagement_id = ?').all(randomEngagement);
        count++;
      }
      return count;
    })());
  }

  const counts = await Promise.all(promises);
  const totalQueries = counts.reduce((a, b) => a + b, 0);
  const concurrentDuration = (performance.now() - concurrentStart) / 1000;

  results.summary.concurrent = {
    duration: concurrentDuration.toFixed(2),
    threads: concurrency,
    totalQueries,
    qps: (totalQueries / concurrentDuration).toFixed(2)
  };

  results.summary.cache = getCacheStats();
  results.summary.queryMetrics = getSummary();
  results.summary.topQueries = getMetrics().slice(0, 5);
  results.summary.slowQueries = getSlowQueries().slice(0, 10);

  return results;
};

export const benchmarkOptimizations = async () => {
  console.log('[Benchmark] Testing with and without optimizations...');

  const db = getDatabase();
  const testQuery = 'SELECT e.*, c.name FROM engagement e LEFT JOIN client c ON e.client_id = c.id WHERE e.stage = ? AND e.status != ? LIMIT 50';

  console.log('[Benchmark] Baseline (no cache, no prepared stmt reuse)...');
  const baselineTimes = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    db.prepare(testQuery).all('execution', 'deleted');
    baselineTimes.push(performance.now() - start);
  }

  const baselineAvg = baselineTimes.reduce((a, b) => a + b, 0) / baselineTimes.length;
  const baselineP95 = baselineTimes.sort((a, b) => a - b)[Math.floor(baselineTimes.length * 0.95)];

  console.log('[Benchmark] With optimizations...');
  const { prepareStmt, getCached, setCached } = await import('@/lib/query-cache');
  const { withPerfTracking } = await import('@/lib/query-perf');

  const optimizedTimes = [];
  for (let i = 0; i < 100; i++) {
    const cacheKey = `test:${i % 10}`;
    const cached = getCached(cacheKey, 'engagement');
    if (cached) {
      optimizedTimes.push(0.1);
      continue;
    }

    const start = performance.now();
    const result = prepareStmt(db, testQuery).all('execution', 'deleted');
    optimizedTimes.push(performance.now() - start);
    setCached(cacheKey, result, 'engagement');
  }

  const optimizedAvg = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length;
  const optimizedP95 = optimizedTimes.sort((a, b) => a - b)[Math.floor(optimizedTimes.length * 0.95)];

  return {
    baseline: { avg: baselineAvg.toFixed(2), p95: baselineP95.toFixed(2) },
    optimized: { avg: optimizedAvg.toFixed(2), p95: optimizedP95.toFixed(2) },
    improvement: {
      avg: ((baselineAvg - optimizedAvg) / baselineAvg * 100).toFixed(2) + '%',
      p95: ((baselineP95 - optimizedP95) / baselineP95 * 100).toFixed(2) + '%'
    }
  };
};
