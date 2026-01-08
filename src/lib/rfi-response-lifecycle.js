import { create, update, get } from '@/engine';
import { canAccessRow as canAccess } from '@/lib/permissions';

export const RESPONSE_STATES = {
  submitted: 'submitted',
  reviewing: 'reviewing',
  accepted: 'accepted',
  rejected: 'rejected'
};

export function validateResponseSubmission(response) {
  if (!response.response_text || response.response_text.trim().length === 0) {
    if (!response.file_attachments || response.file_attachments.length === 0) {
      throw new Error('Response must include either text or file attachments');
    }
  }

  // Validate response_text length if provided
  if (response.response_text && response.response_text.length > 50000) {
    throw new Error('Response text exceeds maximum length (50KB)');
  }

  return true;
}

export function createResponse(rfiId, submitterUserId, responseData) {
  validateResponseSubmission(responseData);

  const response = {
    rfi_id: rfiId,
    submitted_by: submitterUserId,
    response_text: responseData.response_text || '',
    file_attachments: responseData.file_attachments || [],
    status: RESPONSE_STATES.submitted,
    submitted_at: Math.floor(new Date().getTime() / 1000),
    response_chain_id: responseData.parent_response_id ? generateChainId(rfiId) : null,
    parent_response_id: responseData.parent_response_id || null,
    metadata: {
      ip_address: responseData.ip_address || null,
      user_agent: responseData.user_agent || null
    }
  };

  // Create response record in database
  const responseId = create('rfi_response', response, { id: submitterUserId, role: 'client' });

  return responseId;
}

export async function reviewResponse(responseId, reviewer) {
  if (reviewer.role !== 'partner' && reviewer.role !== 'manager') {
    throw new Error('Only partners and managers can review responses');
  }

  const response = get('rfi_response', responseId);
  if (!response) throw new Error('Response not found');

  update('rfi_response', responseId, {
    status: RESPONSE_STATES.reviewing,
    reviewed_by: reviewer.id,
    reviewed_at: Math.floor(new Date().getTime() / 1000)
  }, reviewer);

  return true;
}

export function acceptResponse(responseId, reviewer) {
  if (reviewer.role !== 'partner' && reviewer.role !== 'manager') {
    throw new Error('Only partners and managers can accept responses');
  }

  const response = get('rfi_response', responseId);
  if (!response) throw new Error('Response not found');

  const updates = {
    status: RESPONSE_STATES.accepted,
    accepted_by: reviewer.id,
    accepted_at: Math.floor(new Date().getTime() / 1000),
    parent_response_id: null // Clear parent on acceptance
  };

  update('rfi_response', responseId, updates, reviewer);

  // Increment RFI response count
  const rfi = get('rfi', response.rfi_id);
  if (rfi) {
    const currentCount = rfi.response_count || 0;
    update('rfi', response.rfi_id, { response_count: currentCount + 1 }, reviewer);
  }

  return true;
}

export function rejectResponse(responseId, reviewer, rejectionReason) {
  if (reviewer.role !== 'partner' && reviewer.role !== 'manager') {
    throw new Error('Only partners and managers can reject responses');
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  const response = get('rfi_response', responseId);
  if (!response) throw new Error('Response not found');

  update('rfi_response', responseId, {
    status: RESPONSE_STATES.rejected,
    rejected_by: reviewer.id,
    rejected_at: Math.floor(new Date().getTime() / 1000),
    rejection_reason: rejectionReason
  }, reviewer);

  // Create follow-up response prompt for client
  const followUpData = {
    rfi_id: response.rfi_id,
    submitted_by: reviewer.id,
    response_text: `Resubmit response. Feedback: ${rejectionReason}`,
    status: RESPONSE_STATES.submitted,
    submitted_at: Math.floor(new Date().getTime() / 1000),
    parent_response_id: responseId
  };

  return true;
}

export function trackResponseChain(responseId) {
  const response = get('rfi_response', responseId);
  if (!response) throw new Error('Response not found');

  if (response.parent_response_id) {
    const parent = get('rfi_response', response.parent_response_id);
    return {
      chain_id: response.response_chain_id,
      parent_id: response.parent_response_id,
      parent_status: parent.status,
      parent_submitted_at: parent.submitted_at
    };
  }

  return {
    chain_id: response.response_chain_id,
    parent_id: null,
    is_root: true
  };
}

export function getResponseChain(rfiId, responseId) {
  // Get full chain of responses for an RFI response
  // Traverse parent_response_id links
  const chain = [];
  let currentId = responseId;

  while (currentId) {
    const response = get('rfi_response', currentId);
    if (!response) break;

    chain.unshift({
      id: currentId,
      status: response.status,
      submitted_by: response.submitted_by,
      submitted_at: response.submitted_at,
      response_text: response.response_text,
      file_attachments: response.file_attachments
    });

    currentId = response.parent_response_id;
  }

  return chain;
}

function generateChainId(rfiId) {
  return `chain_${rfiId}_${Math.floor(new Date().getTime() / 1000)}`;
}

export function getResponseStats(rfiId) {
  // Calculate response statistics for RFI
  return {
    total_responses: 0, // Count from DB
    accepted_count: 0,
    rejected_count: 0,
    pending_count: 0,
    chain_count: 0 // Count of distinct response chains
  };
}
