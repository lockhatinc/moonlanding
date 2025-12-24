import { getDatabase } from '@/lib/database-core';
import { getConfigEngine } from '@/lib/config-generator-engine';

let emailConfig = null;

async function getEmailConfig() {
  if (!emailConfig) {
    try {
      const engine = await getConfigEngine();
      const masterConfig = engine.getConfig();
      emailConfig = masterConfig?.thresholds?.email || {};
    } catch (e) {
      console.warn('[EMAIL_PARSER] Failed to load email config, using defaults:', e.message);
      emailConfig = {
        allocation_confidence_base: 50,
        allocation_confidence_subject_bonus: 30,
        allocation_confidence_body_bonus: 20,
        allocation_min_body_length: 50,
      };
    }
  }
  return emailConfig;
}

const ENGAGEMENT_PATTERNS = [
  /engagement[:\s#-]*([a-zA-Z0-9_-]+)/i,
  /eng[:\s#-]*([a-zA-Z0-9_-]+)/i,
  /\[ENG[:\s#-]*([a-zA-Z0-9_-]+)\]/i,
  /re[:\s]*engagement[:\s]*([a-zA-Z0-9_-]+)/i,
  /client[:\s]*([a-zA-Z0-9_-]+)[:\s]*engagement/i,
];

const RFI_PATTERNS = [
  /rfi[:\s#-]*([a-zA-Z0-9_-]+)/i,
  /\[RFI[:\s#-]*([a-zA-Z0-9_-]+)\]/i,
  /request[:\s]*for[:\s]*information[:\s#-]*([a-zA-Z0-9_-]+)/i,
  /information[:\s]*request[:\s#-]*([a-zA-Z0-9_-]+)/i,
];

export function extractEngagementId(text) {
  if (!text) return null;

  for (const pattern of ENGAGEMENT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export function extractRfiId(text) {
  if (!text) return null;

  for (const pattern of RFI_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export async function parseEmailForAllocation(email) {
  const { subject, body, html_body } = email;
  const searchText = `${subject || ''} ${body || ''} ${html_body || ''}`;

  const engagementId = extractEngagementId(searchText);
  const rfiId = extractRfiId(searchText);

  return {
    engagement_id: engagementId,
    rfi_id: rfiId,
    confidence: await calculateConfidence(subject, body, engagementId, rfiId),
  };
}

async function calculateConfidence(subject, body, engagementId, rfiId) {
  let confidence = 0;

  if (engagementId || rfiId) {
    const emailCfg = await getEmailConfig();

    confidence += emailCfg.allocation_confidence_base || 50;

    if (subject && (engagementId || rfiId)) {
      confidence += emailCfg.allocation_confidence_subject_bonus || 30;
    }

    if (body && body.length > (emailCfg.allocation_min_body_length || 50)) {
      confidence += emailCfg.allocation_confidence_body_bonus || 20;
    }
  }

  return Math.min(confidence, 100);
}

export function validateAllocation(email, entityType, entityId) {
  const db = getDatabase();

  if (entityType === 'engagement') {
    const engagement = db.prepare('SELECT id FROM engagement WHERE id = ?').get(entityId);
    return !!engagement;
  }

  if (entityType === 'rfi') {
    const rfi = db.prepare('SELECT id FROM rfi WHERE id = ?').get(entityId);
    return !!rfi;
  }

  return false;
}

export function findEntityByAlternateId(entityType, searchId) {
  const db = getDatabase();

  if (entityType === 'engagement') {
    let engagement = db.prepare('SELECT id FROM engagement WHERE id = ?').get(searchId);
    if (engagement) return engagement.id;

    engagement = db.prepare('SELECT id FROM engagement WHERE reference_number = ?').get(searchId);
    if (engagement) return engagement.id;

    engagement = db.prepare('SELECT id FROM engagement WHERE client_reference = ?').get(searchId);
    if (engagement) return engagement.id;
  }

  if (entityType === 'rfi') {
    let rfi = db.prepare('SELECT id FROM rfi WHERE id = ?').get(searchId);
    if (rfi) return rfi.id;

    rfi = db.prepare('SELECT id FROM rfi WHERE reference_number = ?').get(searchId);
    if (rfi) return rfi.id;
  }

  return null;
}

export function allocateEmailToEntity(emailId, engagementId = null, rfiId = null) {
  const db = getDatabase();

  const email = db.prepare('SELECT * FROM email WHERE id = ?').get(emailId);

  if (!email) {
    throw new Error('Email not found');
  }

  if (email.allocated) {
    throw new Error('Email already allocated');
  }

  if (!engagementId && !rfiId) {
    throw new Error('Either engagement_id or rfi_id must be provided');
  }

  if (engagementId && !validateAllocation(email, 'engagement', engagementId)) {
    throw new Error('Invalid engagement_id');
  }

  if (rfiId && !validateAllocation(email, 'rfi', rfiId)) {
    throw new Error('Invalid rfi_id');
  }

  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    UPDATE email
    SET allocated = 1,
        engagement_id = ?,
        rfi_id = ?,
        status = 'processed',
        processed = 1,
        updated_at = ?
    WHERE id = ?
  `).run(engagementId || null, rfiId || null, now, emailId);

  return db.prepare('SELECT * FROM email WHERE id = ?').get(emailId);
}

export function extractResponseText(emailBody) {
  if (!emailBody) return null;
  const lines = emailBody.split('\n');
  const quoteIdx = lines.findIndex(l => l.includes('---') || l.includes('wrote:') || l.includes('On '));
  const responseLines = quoteIdx > 0 ? lines.slice(0, quoteIdx) : lines;
  return responseLines.join('\n').trim() || null;
}

export async function autoAllocateEmail(email) {
  const parsed = await parseEmailForAllocation(email);

  if (!parsed.engagement_id && !parsed.rfi_id) {
    return { success: false, reason: 'no_identifiers', confidence: 0 };
  }

  let engagementId = null;
  let rfiId = null;

  if (parsed.engagement_id) {
    engagementId = findEntityByAlternateId('engagement', parsed.engagement_id);
  }

  if (parsed.rfi_id) {
    rfiId = findEntityByAlternateId('rfi', parsed.rfi_id);
  }

  if (!engagementId && !rfiId) {
    return { success: false, reason: 'entity_not_found', confidence: parsed.confidence };
  }

  try {
    const responseText = rfiId ? extractResponseText(email.body) : null;
    const allocated = allocateEmailToEntity(email.id, engagementId, rfiId);
    return {
      success: true,
      email: allocated,
      engagement_id: engagementId,
      rfi_id: rfiId,
      response_text: responseText,
      confidence: parsed.confidence,
    };
  } catch (error) {
    return { success: false, reason: error.message, confidence: parsed.confidence };
  }
}
