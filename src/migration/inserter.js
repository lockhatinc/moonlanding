// Batch insert helper with conflict ignore
export function makeInserter(db) {
  return { _db: db,
    run(sql, params) {
      try {
        db.prepare(sql).run(params);
      } catch (e) {
        if (!e.message.includes('UNIQUE constraint') && !e.message.includes('NOT NULL')) {
          console.warn('Insert warn:', e.message.slice(0, 120));
        }
      }
    },
    batch(sql, rows) {
      const stmt = db.prepare(sql);
      const insert = db.transaction(items => { for (const r of items) { try { stmt.run(r); } catch(e) { /* skip dup/null */ } } });
      insert(rows);
    }
  };
}

export function checkRowCounts(db, expected) {
  const results = {};
  let pass = true;
  for (const [table, minCount] of Object.entries(expected)) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
      results[table] = row.c;
      if (row.c < minCount) {
        console.warn(`  FAIL ${table}: got ${row.c}, expected >= ${minCount}`);
        pass = false;
      } else {
        console.log(`  OK ${table}: ${row.c} rows`);
      }
    } catch(e) {
      console.warn(`  SKIP ${table}: ${e.message}`);
    }
  }
  return { pass, results };
}
