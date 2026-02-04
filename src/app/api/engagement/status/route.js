import { get, update } from '@/engine';
import { getConfigEngineSync } from '@/lib/config-generator-engine';
import { setCurrentRequest } from '@/engine.server';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

const STATUS_FIELDS = [
  'client_status', 'letter_client_status', 'letter_auditor_status',
  'post_rfi_client_status', 'post_rfi_auditor_status', 'auditor_status'
];

function getStatusOptionsForField(statusField) {
  const engine = getConfigEngineSync();
  const statusTypes = engine.getConfig().engagement_status_types || {};
  return statusTypes[statusField]?.options || [];
}

function getStatusLabelForField(statusField, statusValue) {
  const option = getStatusOptionsForField(statusField).find(o => o.value === statusValue);
  return option?.label || statusValue;
}

function wrapHandler(method) {
  return async (request, context) => {
    setCurrentRequest(request);
    try {
      if (method === 'GET') return handleGET(request, context);
      if (method === 'POST') return handlePOST(request, context);
      if (method === 'PATCH') return handlePATCH(request, context);
      return new Response('Method not allowed', { status: HTTP.METHOD_NOT_ALLOWED });
    } catch (error) {
      console.error(`[API] Error in engagement/status ${method}:`, error.message);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error', code: error.code || 'INTERNAL_ERROR' }),
        { status: error.statusCode || HTTP.INTERNAL_SERVER_ERROR, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

async function handleGET(request) {
  const url = new URL(request.url);
  const engagementId = url.searchParams.get('engagement_id');
  const statusField = url.searchParams.get('field');
  const action = url.searchParams.get('action');

  if (action === 'options') {
    const options = {};
    for (const field of STATUS_FIELDS) options[field] = getStatusOptionsForField(field);
    return new Response(JSON.stringify(options), { headers: { 'Content-Type': 'application/json' } });
  }

  if (!engagementId) {
    return new Response(JSON.stringify({ error: 'engagement_id required' }), { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } });
  }

  const engagement = get('engagement', engagementId);
  if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

  if (action === 'overview') {
    const overview = { id: engagement.id, stage: engagement.stage, statuses: {} };
    for (const field of STATUS_FIELDS) {
      overview.statuses[field] = {
        value: engagement[field] || null,
        label: engagement[field] ? getStatusLabelForField(field, engagement[field]) : null
      };
    }
    return new Response(JSON.stringify(overview), { headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'transitions' && statusField) {
    return new Response(JSON.stringify({ field: statusField, current: engagement[statusField] || null, available: getStatusOptionsForField(statusField) }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (statusField) {
    return new Response(JSON.stringify({ field: statusField, value: engagement[statusField] || null, label: getStatusLabelForField(statusField, engagement[statusField]) }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'field or action required' }), { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } });
}

async function handlePOST(request) {
  const body = await request.json();
  const { engagement_id, field, to_status, reason } = body;

  if (!engagement_id || !field || !to_status) {
    return new Response(JSON.stringify({ error: 'engagement_id, field, and to_status required' }), { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } });
  }

  const engagement = get('engagement', engagement_id);
  if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

  const updates = { [field]: to_status, [`${field}_updated_at`]: Math.floor(Date.now() / 1000) };
  update('engagement', engagement_id, updates);

  return new Response(JSON.stringify({ success: true, field, from: engagement[field], to: to_status, timestamp: Math.floor(Date.now() / 1000) }), { headers: { 'Content-Type': 'application/json' } });
}

async function handlePATCH(request) {
  const body = await request.json();
  const { engagement_id, action: patchAction } = body;

  if (!engagement_id) {
    return new Response(JSON.stringify({ error: 'engagement_id required' }), { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } });
  }

  const engagement = get('engagement', engagement_id);
  if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

  if (patchAction === 'validate') {
    const errors = [];
    const warnings = [];
    for (const field of STATUS_FIELDS) {
      if (engagement[field]) {
        const options = getStatusOptionsForField(field);
        if (options.length > 0 && !options.find(o => o.value === engagement[field])) {
          errors.push(`Invalid status in ${field}: ${engagement[field]}`);
        }
      }
    }
    return new Response(JSON.stringify({ valid: errors.length === 0, errors, warnings }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (patchAction === 'initialize') {
    const statuses = {};
    for (const field of STATUS_FIELDS) {
      const options = getStatusOptionsForField(field);
      statuses[field] = options[0]?.value || 'pending';
    }
    update('engagement', engagement_id, statuses);
    return new Response(JSON.stringify({ success: true, statuses }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'valid action required' }), { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } });
}

export const GET = wrapHandler('GET');
export const POST = wrapHandler('POST');
export const PATCH = wrapHandler('PATCH');
