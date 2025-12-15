import { entityHandlers } from './events-entity';
import { scheduledJobs } from './events-jobs';
import { get } from '../engine.js';
import { ENGAGEMENT_STAGE, ENGAGEMENT_STATUS, RFI_STATUS, canTransitionStage } from '@/lib/status-helpers';

const handlers = { entity: entityHandlers, scheduled: scheduledJobs };
const stageSequence = [
  ENGAGEMENT_STAGE.INFO_GATHERING,
  ENGAGEMENT_STAGE.COMMENCEMENT,
  ENGAGEMENT_STAGE.TEAM_EXECUTION,
  ENGAGEMENT_STAGE.PARTNER_REVIEW,
  ENGAGEMENT_STAGE.FINALIZATION,
  ENGAGEMENT_STAGE.CLOSE_OUT,
];

export async function validateStageTransition(engagement, newStage, user) {
  const curr = stageSequence.indexOf(engagement.stage), next = stageSequence.indexOf(newStage);

  if (!['partner', 'manager'].includes(user.role)) throw new Error('Only partners and managers can change stage');
  if (engagement.status === ENGAGEMENT_STATUS.PENDING) throw new Error('Cannot change stage while pending');
  if (newStage === ENGAGEMENT_STAGE.CLOSE_OUT && user.role !== 'partner') throw new Error('Only partners can close out');
  if (newStage === ENGAGEMENT_STAGE.CLOSE_OUT && engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0) {
    throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
  }
  if (!canTransitionStage(engagement.stage, newStage)) {
    throw new Error(`Cannot go backward from ${engagement.stage} to ${newStage}`);
  }
  return true;
}

export async function validateRfiStatusChange(rfi, newStatus, user) {
  if (user.type !== 'auditor' || user.role === 'clerk') {
    const e = get('engagement', rfi.engagement_id);
    if (!e?.clerks_can_approve) throw new Error('Only auditors (not clerks) can change RFI status');
  }
  if (newStatus === RFI_STATUS.COMPLETED) {
    const hasFiles = rfi.files_count > 0 || JSON.parse(rfi.files || '[]').length > 0;
    const hasResponses = rfi.response_count > 0 || JSON.parse(rfi.responses || '[]').length > 0;
    if (!hasFiles && !hasResponses) throw new Error('RFI must have files or responses before completing');
  }
  return true;
}

export async function emit(entityName, event, ...args) {
  const handler = handlers.entity[entityName]?.[event];
  if (!handler) return;
  try {
    await handler(...args);
  } catch (error) {
    console.error(`[EVENT] ${entityName}.${event} error:`, error.message);
    if (error.message.includes('Cannot') || error.message.includes('Only') || error.message.includes('Permission') || error.message.includes('Failed')) throw error;
  }
}

export async function runJob(name) {
  const job = handlers.scheduled[name];
  if (!job) throw new Error(`Unknown job: ${name}`);
  try {
    await job.run(job.config);
  } catch (e) {
    console.error(`[JOB] ${name} failed:`, e.message);
    throw e;
  }
}

function getJobs() {
  return Object.entries(handlers.scheduled).map(([name, job]) => ({ name, schedule: job.schedule, description: job.description }));
}

function shouldRunNow(schedule) {
  const [m, h, dom, mon, dow] = schedule.split(' '), now = new Date();
  const match = (f, v) => f === '*' || parseInt(f) === v;
  return match(m, now.getMinutes()) && match(h, now.getHours()) && match(dom, now.getDate()) && match(mon, now.getMonth() + 1) && match(dow, now.getDay());
}

export async function runDueJobs() {
  for (const [name, job] of Object.entries(handlers.scheduled)) {
    if (shouldRunNow(job.schedule)) {
      try { await runJob(name); } catch (e) { console.error(`[JOB] ${name}:`, e.message); }
    }
  }
}

export const triggers = handlers.entity;
export { scheduledJobs } from './events-jobs';
export const executeTrigger = emit;
