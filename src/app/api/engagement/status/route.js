import { engagementStatusService } from '@/services/engagement-status.service';
import { setCurrentRequest } from '@/engine.server';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

function wrapHandler(method) {
  return async (request, context) => {
    setCurrentRequest(request);

    try {
      if (method === 'GET') {
        return handleGET(request, context);
      } else if (method === 'POST') {
        return handlePOST(request, context);
      } else if (method === 'PATCH') {
        return handlePATCH(request, context);
      } else {
        return new Response('Method not allowed', { status: HTTP.METHOD_NOT_ALLOWED });
      }
    } catch (error) {
      console.error(`[API] Error in engagement/status ${method}:`, error.message);
      return new Response(
        JSON.stringify({
          error: error.message || 'Internal server error',
          code: error.code || 'INTERNAL_ERROR'
        }),
        {
          status: error.statusCode || HTTP.INTERNAL_SERVER_ERROR,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

async function handleGET(request, context) {
  const url = new URL(request.url);
  const engagementId = url.searchParams.get('engagement_id');
  const statusField = url.searchParams.get('field');
  const action = url.searchParams.get('action');

  if (!engagementId) {
    return new Response(
      JSON.stringify({ error: 'engagement_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'overview') {
    const overview = engagementStatusService.getStatusOverview(engagementId);
    return new Response(JSON.stringify(overview), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (action === 'options') {
    const options = engagementStatusService.getAllStatusOptions();
    return new Response(JSON.stringify(options), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (action === 'transitions' && statusField) {
    const transitions = engagementStatusService.getAvailableStatusTransitions(engagementId, statusField);
    return new Response(JSON.stringify(transitions), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (statusField) {
    const status = engagementStatusService.getStatusField(engagementId, statusField);
    return new Response(JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({ error: 'field or action required' }),
    { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handlePOST(request, context) {
  const body = await request.json();
  const { engagement_id, field, to_status, reason } = body;

  if (!engagement_id || !field || !to_status) {
    return new Response(
      JSON.stringify({ error: 'engagement_id, field, and to_status required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = engagementStatusService.transitionStatus(
    engagement_id,
    field,
    to_status,
    null,
    reason
  );

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handlePATCH(request, context) {
  const body = await request.json();
  const { engagement_id, action } = body;

  if (!engagement_id) {
    return new Response(
      JSON.stringify({ error: 'engagement_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'validate') {
    const validation = engagementStatusService.validateConsistency(engagement_id);
    return new Response(JSON.stringify(validation), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (action === 'initialize') {
    const { stage } = body;
    const result = engagementStatusService.initializeStatuses(engagement_id, stage);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({ error: 'valid action required' }),
    { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET = wrapHandler('GET');
export const POST = wrapHandler('POST');
export const PATCH = wrapHandler('PATCH');
