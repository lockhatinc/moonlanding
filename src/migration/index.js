// Migration orchestrator: Friday + MWR Firebase -> Moonlanding SQLite
import Database from 'better-sqlite3';
import { fetchFridayData } from './friday-source.js';
import { fetchMwrData } from './mwr-source.js';
import { deduplicateUsers } from './dedup.js';
import { makeInserter, checkRowCounts } from './inserter.js';
import { uuid, toTs, toDateTs, toJson, normStage, bool, now } from './transformers.js';

const DB_PATH = new URL('../../data/app.db', import.meta.url).pathname;

async function migrate({ fridayLimit = null, dryRun = false } = {}) {
  console.log('\n=== Moonlanding Migration ===');
  console.log(`DB: ${DB_PATH}, dryRun: ${dryRun}`);

  console.log('\n[1] Fetching source data...');
  const [friday, mwr] = await Promise.all([
    fetchFridayData(fridayLimit),
    fetchMwrData(),
  ]);

  const fridayUsers = friday['friday/users/list'] || [];
  const fridayClients = friday['friday/clients/list'] || [];
  const fridayEngagements = friday['friday/engagements/list'] || [];
  const fridayTeams = friday['friday/teams/list'] || [];
  const fridayRfis = friday['friday/rfis/list'] || [];
  const fridayTemplates = friday['friday/templates/list'] || [];
  const mwrUsers = mwr['myworkreview/users/list'] || [];
  const mwrTeams = mwr['myworkreview/teams/list'] || [];
  const mwrReviews = mwr['myworkreview/reviews/list'] || [];
  const mwrChecklists = mwr['myworkreview/checklists/list'] || [];
  const mwrTemplates = mwr['myworkreview/templates/list'] || [];

  console.log('\n[2] Deduplicating users...');
  const { users, cloudIdToUuid } = deduplicateUsers(fridayUsers, mwrUsers);

  if (dryRun) { console.log('\nDry run complete.'); return { users: users.length }; }

  console.log('\n[3] Opening database...');
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  const ins = makeInserter(db);

  console.log('\n[4] Migrating users...');
  migrateUsers(ins, users);

  console.log('\n[5] Migrating teams...');
  const teamIdMap = migrateTeams(ins, fridayTeams, mwrTeams);

  console.log('\n[6] Migrating clients...');
  const clientIdMap = migrateClients(ins, fridayClients, cloudIdToUuid);

  console.log('\n[7] Migrating engagements...');
  const engIdMap = migrateEngagements(ins, fridayEngagements, clientIdMap, teamIdMap, cloudIdToUuid);

  console.log('\n[8] Migrating RFIs...');
  migrateRfis(ins, fridayRfis, engIdMap, cloudIdToUuid);

  console.log('\n[9] Migrating templates...');
  migrateTemplates(ins, mwrTemplates);

  console.log('\n[10] Creating synthetic engagements for MWR reviews...');
  const mwrEngMap = createMwrEngagements(ins, mwrReviews, teamIdMap, clientIdMap);

  console.log('\n[11] Migrating reviews + highlights + checklists...');
  migrateReviews(ins, mwrReviews, mwrEngMap, teamIdMap, cloudIdToUuid);

  db.pragma('foreign_keys = ON');

  console.log('\n[12] Validating...');
  const { pass, results } = checkRowCounts(db, {
    users: users.length,
    client: fridayClients.length * 0.9,
    engagement: fridayEngagements.length * 0.5,
    review: mwrReviews.length * 0.9,
  });

  db.close();
  console.log(`\n=== Migration ${pass ? 'PASSED' : 'DONE with warnings'} ===`);
  return { pass, results };
}

function migrateUsers(ins, users) {
  ins.batch(
    `INSERT OR IGNORE INTO users (id, email, name, photo_url, role, status, created_at, updated_at)
     VALUES (@id, @email, @name, @photo_url, @role, @status, @created_at, @updated_at)`,
    users.map(u => ({
      id: u.id, email: u.email, name: u.name || '', photo_url: u.photo || null,
      role: u.role || 'user', status: u.status || 'active',
      created_at: u.created_at || now(), updated_at: u.updated_at || now(),
    }))
  );
  console.log(`  Inserted ${users.length} users`);
}

function migrateTeams(ins, fridayTeams, mwrTeams) {
  const idMap = new Map();
  const ts = now();
  const rows = [];

  for (const { id, data: d } of fridayTeams) {
    const newId = uuid();
    idMap.set(id, newId);
    rows.push({ id: newId, name: d.name || 'Unnamed', context: 'friday',
      users: toJson(d.users || []), partners: toJson(d.partners || []),
      created_at: ts, updated_at: ts });
  }
  for (const { id, data: d } of mwrTeams) {
    const newId = uuid();
    idMap.set(id, newId);
    rows.push({ id: newId, name: d.name || 'Unnamed', context: 'mwr',
      users: toJson(d.users || []), partners: toJson(d.partners || []),
      created_at: ts, updated_at: ts });
  }
  ins.batch(
    `INSERT OR IGNORE INTO team (id, name, context, users, partners, created_at, updated_at)
     VALUES (@id, @name, @context, @users, @partners, @created_at, @updated_at)`, rows
  );
  console.log(`  Inserted ${rows.length} teams`);
  return idMap;
}

function migrateClients(ins, fridayClients, cloudIdToUuid) {
  const idMap = new Map();
  const rows = [];
  for (const { id, data: d } of fridayClients) {
    const newId = uuid();
    idMap.set(id, newId);
    idMap.set(d.name, newId); // also map by name for engagement lookup
    rows.push({
      id: newId, name: d.name || 'Unknown', code: d.client_code || null,
      email: d.email || (Array.isArray(d.master_emails) ? d.master_emails[0] : null) || null,
      address: typeof d.address === 'object' ? toJson(d.address) : (d.address || null),
      status: (d.status || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
      created_at: now(), updated_at: now(),
      created_by: cloudIdToUuid.get(d.created_by) || null,
    });
  }
  ins.batch(
    `INSERT OR IGNORE INTO client (id, name, code, email, address, status, created_at, updated_at, created_by)
     VALUES (@id, @name, @code, @email, @address, @status, @created_at, @updated_at, @created_by)`, rows
  );
  console.log(`  Inserted ${rows.length} clients`);
  return idMap;
}

function migrateEngagements(ins, engagements, clientIdMap, teamIdMap, cloudIdToUuid) {
  const idMap = new Map();
  const rows = [];
  for (const { id, data: d } of engagements) {
    const newId = uuid();
    idMap.set(id, newId);
    const clientId = clientIdMap.get(d.client) || clientIdMap.get(d.client_name) || clientIdMap.get(d.client_id);
    if (!clientId) continue; // skip orphaned engagements
    rows.push({
      id: newId, name: d.name || d.title || 'Unnamed',
      client_id: clientId,
      year: String(d.year || new Date().getFullYear()),
      stage: normStage(d.stage),
      status: (d.status || 'Active').toLowerCase() === 'active' ? 'active' : 'inactive',
      team_id: teamIdMap.get(d.team) || null,
      fee: d.fee || null, scope: d.scope || null,
      repeat_interval: d.repeat_interval || 'once',
      commencement_date: toDateTs(d.commencement_date),
      deadline_date: toDateTs(d.deadline_date),
      users: toJson(Array.isArray(d.user) ? d.user.map(uid => cloudIdToUuid.get(uid) || uid) : []),
      created_at: toTs(d.createdTime || d.created_at),
      updated_at: now(),
      created_by: cloudIdToUuid.get(d.createdBy) || null,
    });
  }
  ins.batch(
    `INSERT OR IGNORE INTO engagement
     (id, name, client_id, year, stage, status, team_id, fee, scope, repeat_interval,
      commencement_date, deadline_date, users, created_at, updated_at, created_by)
     VALUES (@id, @name, @client_id, @year, @stage, @status, @team_id, @fee, @scope, @repeat_interval,
      @commencement_date, @deadline_date, @users, @created_at, @updated_at, @created_by)`, rows
  );
  console.log(`  Inserted ${rows.length} engagements (skipped ${engagements.length - rows.length} orphaned)`);
  return idMap;
}

function migrateRfis(ins, rfis, engIdMap, cloudIdToUuid) {
  let count = 0;
  for (const { id, data: d } of rfis) {
    const engId = engIdMap.get(d.engagement_id) || engIdMap.get(d.engagement);
    if (!engId) continue;
    const rfiId = uuid();
    ins.run(
      `INSERT OR IGNORE INTO rfi (id, title, engagement_id, status, due_date, description, created_at, updated_at, created_by)
       VALUES (@id, @title, @engagement_id, @status, @due_date, @description, @created_at, @updated_at, @created_by)`,
      { id: rfiId, title: d.title || d.name || 'RFI', engagement_id: engId,
        status: (d.status || 'open').toLowerCase(), due_date: toDateTs(d.due_date) || toDateTs(d.deadline),
        description: d.description || null, created_at: toTs(d.created_at || d.createdTime),
        updated_at: now(), created_by: cloudIdToUuid.get(d.created_by) || null }
    );
    count++;
  }
  console.log(`  Inserted ${count} RFIs`);
}

function migrateTemplates(ins, templates) {
  const rows = templates.map(({ id, data: d }) => ({
    id: uuid(), name: d.name || 'Template',
    template_type: d.template_type || d.type || 'review_template',
    type: d.type || 'standard', content: toJson(d.sections || d.content || {}),
    is_active: 1, created_at: now(), updated_at: now(),
  }));
  ins.batch(
    `INSERT OR IGNORE INTO review_template (id, name, template_type, type, content, is_active, created_at, updated_at)
     VALUES (@id, @name, @template_type, @type, @content, @is_active, @created_at, @updated_at)`, rows
  );
  console.log(`  Inserted ${rows.length} templates`);
}

// Create one synthetic engagement per (team, financialYear) for MWR reviews
// Returns Map: mwr_review_cloud_id -> engagement_id
function createMwrEngagements(ins, reviews, teamIdMap, clientIdMap) {
  const teamYearToEngId = new Map();
  const reviewToEngId = new Map();
  const ts = now();

  // Need a fallback client for MWR synthetic engagements
  let fallbackClientId = null;
  const firstClient = ins._db?.prepare('SELECT id FROM client LIMIT 1').get();
  if (firstClient) fallbackClientId = firstClient.id;

  for (const { id, data: d } of reviews) {
    const teamCloudId = d.team?.cloud_id || d.team;
    const teamId = teamIdMap.get(teamCloudId);
    const year = String(d.financialYear || new Date().getFullYear());
    const key = `${teamId || 'none'}_${year}`;

    if (!teamYearToEngId.has(key)) {
      const engId = uuid();
      teamYearToEngId.set(key, engId);
      ins.run(
        `INSERT OR IGNORE INTO engagement
         (id, name, client_id, year, stage, status, team_id, created_at, updated_at)
         VALUES (@id, @name, @client_id, @year, @stage, @status, @team_id, @created_at, @updated_at)`,
        { id: engId, name: `MWR Reviews ${year}${teamId ? '' : ' (Unassigned)'}`,
          client_id: fallbackClientId || uuid(),
          year, stage: 'complete', status: 'inactive',
          team_id: teamId || null, created_at: ts, updated_at: ts }
      );
    }
    reviewToEngId.set(id, teamYearToEngId.get(key));
  }
  console.log(`  Created ${teamYearToEngId.size} synthetic MWR engagements for ${reviews.length} reviews`);
  return reviewToEngId;
}

function migrateReviews(ins, reviews, mwrEngMap, teamIdMap, cloudIdToUuid) {
  let reviewCount = 0, highlightCount = 0, checklistCount = 0;
  for (const { id, data: d } of reviews) {
    const teamId = teamIdMap.get(d.team?.cloud_id) || teamIdMap.get(d.team);
    const reviewId = uuid();
    const createdBy = cloudIdToUuid.get(d.user) || null;
    const engId = mwrEngMap.get(id);
    if (!engId) continue;

    const stage = (d.stage || '').toLowerCase();
    ins.run(
      `INSERT OR IGNORE INTO review
       (id, name, engagement_id, status, drive_file_id, financial_year, team_id, tags, flags,
        archived, created_at, updated_at, created_by, is_private)
       VALUES (@id, @name, @engagement_id, @status, @drive_file_id, @financial_year, @team_id,
        @tags, @flags, @archived, @created_at, @updated_at, @created_by, @is_private)`,
      { id: reviewId, name: d.groupName || 'Review', engagement_id: engId,
        status: d.status === false ? 'inactive' : 'active',
        drive_file_id: d.fileUrl || null, financial_year: String(d.financialYear || ''),
        team_id: teamId || null, tags: toJson(d.tags || []), flags: toJson(d.flags || []),
        archived: stage === 'archive' ? 1 : 0,
        created_at: toDateTs(d.published_date) || now(),
        updated_at: toDateTs(d.lastUpdated) || now(),
        created_by: createdBy, is_private: bool(d.private) }
    );
    reviewCount++;

    // Highlights
    for (const h of (d.highlights || [])) {
      ins.run(
        `INSERT OR IGNORE INTO highlight
         (id, review_id, text, comment, page_number, bounding_rect, rects, scaled_position,
          color, status, manager_resolved, partner_resolved, created_at, updated_at, created_by)
         VALUES (@id, @review_id, @text, @comment, @page_number, @bounding_rect, @rects,
          @scaled_position, @color, @status, @manager_resolved, @partner_resolved,
          @created_at, @updated_at, @created_by)`,
        { id: uuid(), review_id: reviewId, text: h.text || null, comment: h.comment || null,
          page_number: String(h.pageNumber || h.page_number || '1'),
          bounding_rect: toJson(h.boundingRect || h.bounding_rect),
          rects: toJson(h.rects), scaled_position: toJson(h.scaledPosition || h.position),
          color: h.color || 'grey',
          status: h.resolved ? 'resolved' : 'unresolved',
          manager_resolved: bool(h.managerResolved), partner_resolved: bool(h.partnerResolved),
          created_at: now(), updated_at: now(), created_by: createdBy }
      );
      highlightCount++;
    }

    // Checklists (sections)
    for (const s of (d.sections || [])) {
      const checkId = uuid();
      ins.run(
        `INSERT OR IGNORE INTO checklist (id, review_id, name, section_items, email_checklist, created_at, updated_at, created_by)
         VALUES (@id, @review_id, @name, @section_items, @email_checklist, @created_at, @updated_at, @created_by)`,
        { id: checkId, review_id: reviewId, name: s.name || 'Section',
          section_items: toJson(s.section_items || s.items || []),
          email_checklist: bool(s.emailChecklist),
          created_at: now(), updated_at: now(), created_by: createdBy }
      );
      checklistCount++;
    }
  }
  console.log(`  Inserted ${reviewCount} reviews, ${highlightCount} highlights, ${checklistCount} checklists`);
}

export { migrate };
