import { list, get, update, create, remove } from '@/engine';
import { LOG_PREFIXES } from '@/config';

const now = () => Math.floor(Date.now() / 1000);
const DAY = 86400;

export const createJob = (name, schedule, description, runner, config = {}) => ({
  name, schedule, description, config,
  run: async (cfg) => runner(cfg || config)
});

export const forEachRecord = async (entity, filter, handler) => {
  for (const record of list(entity, filter)) await handler(record);
};

export const batchUpdate = async (entity, filter, condition, updates) => {
  await forEachRecord(entity, filter, async (r) => {
    if (condition(r)) update(entity, r.id, typeof updates === 'function' ? updates(r) : updates);
  });
};

export const activityLog = (entity, entityId, action, msg, user = null, details = null) =>
  create('activity_log', {
    entity_type: entity, entity_id: entityId, action, message: msg,
    details: details ? JSON.stringify(details) : null, user_email: user?.email
  }, user);

export const getDaysUntil = (timestamp) => Math.floor((timestamp - now()) / DAY);
export const getDeadlineRange = (daysFromNow) => {
  const start = Math.floor((now() + daysFromNow * DAY) / DAY) * DAY;
  return { start, end: start + DAY };
};

export const shouldRunNow = (schedule) => {
  const [m, h, dom, mon, dow] = schedule.split(' '), d = new Date();
  const match = (f, v) => f === '*' || parseInt(f) === v;
  return match(m, d.getMinutes()) && match(h, d.getHours()) && match(dom, d.getDate()) && match(mon, d.getMonth() + 1) && match(dow, d.getDay());
};

export const runJob = async (jobs, name) => {
  const job = jobs[name];
  if (!job) throw new Error(`Unknown job: ${name}`);
  try { await job.run(job.config); }
  catch (e) { console.error(`${LOG_PREFIXES.job} ${name} failed:`, e.message); throw e; }
};

export const runDueJobs = async (jobs) => {
  const results = {
    total: 0,
    executed: 0,
    failed: 0,
    details: [],
    errors: []
  };

  for (const [name, job] of Object.entries(jobs)) {
    results.total++;
    if (shouldRunNow(job.schedule)) {
      try {
        await runJob(jobs, name);
        results.executed++;
        results.details.push({ name, status: 'success' });
        console.log(`${LOG_PREFIXES.job} ${name} executed successfully`);
      } catch (e) {
        results.failed++;
        results.details.push({ name, status: 'failed', error: e.message });
        results.errors.push({ job: name, error: e.message });
        console.error(`${LOG_PREFIXES.job} ${name}:`, e.message);
      }
    }
  }

  return results;
};
