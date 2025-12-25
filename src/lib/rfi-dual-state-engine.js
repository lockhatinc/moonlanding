export const RFI_INTERNAL_STATES = {
  waiting: 0,
  completed: 1
};

export const AUDITOR_DISPLAY_STATES = {
  requested: 'requested',
  reviewing: 'reviewing',
  queries: 'queries',
  received: 'received'
};

export const CLIENT_DISPLAY_STATES = {
  pending: 'pending',
  partially_sent: 'partially_sent',
  sent: 'sent'
};

export function calculateDaysOutstanding(rfi, engagementStage) {
  if (engagementStage === 'info_gathering') return 0;
  if (!rfi.date_requested) return 0;

  const requestedDate = new Date(rfi.date_requested * 1000);
  const resolvedDate = rfi.date_resolved ? new Date(rfi.date_resolved * 1000) : new Date();

  return getWorkingDaysBetween(requestedDate, resolvedDate);
}

function getWorkingDaysBetween(startDate, endDate) {
  let workingDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays - 1; // Exclude start day
}

export function deriveInternalState(rfi) {
  if (rfi.status === 1) return RFI_INTERNAL_STATES.completed;
  return RFI_INTERNAL_STATES.waiting;
}

export function getAuditorDisplayState(rfi, daysOutstanding) {
  const internalState = deriveInternalState(rfi);

  if (internalState === RFI_INTERNAL_STATES.completed) {
    return AUDITOR_DISPLAY_STATES.received;
  }

  if (rfi.auditor_status === 'queries') {
    return AUDITOR_DISPLAY_STATES.queries;
  }

  if (rfi.auditor_status === 'reviewing') {
    return AUDITOR_DISPLAY_STATES.reviewing;
  }

  return AUDITOR_DISPLAY_STATES.requested;
}

export function getClientDisplayState(rfi) {
  if (rfi.status === 1) {
    return CLIENT_DISPLAY_STATES.sent;
  }

  // Check if any items in bulk RFI are answered
  if (rfi.questions && Array.isArray(rfi.questions)) {
    const answered = rfi.questions.filter(q => q.response_text || q.file_attachment).length;
    if (answered > 0 && answered < rfi.questions.length) {
      return CLIENT_DISPLAY_STATES.partially_sent;
    }
  }

  return CLIENT_DISPLAY_STATES.pending;
}

export function validateRFICompletion(rfi) {
  const hasFileUpload = rfi.file_attachments && rfi.file_attachments.length > 0;
  const hasTextResponse = rfi.response_text && rfi.response_text.trim().length > 0;

  if (!hasFileUpload && !hasTextResponse) {
    throw new Error('RFI completion requires either file upload or text response');
  }

  return true;
}

export function getEscalationThreshold(daysOutstanding) {
  const thresholds = [3, 7, 14];

  for (const threshold of thresholds) {
    if (daysOutstanding === threshold) {
      return threshold;
    }
  }

  return null;
}

export function checkEscalationTrigger(rfi, engagementStage) {
  if (engagementStage === 'info_gathering') return false;

  const daysOut = calculateDaysOutstanding(rfi, engagementStage);
  return getEscalationThreshold(daysOut) !== null;
}

export function transitionRFIState(rfi, newStatus, user) {
  if (newStatus === 1) {
    // Completing RFI - validate it has response
    validateRFICompletion(rfi);

    return {
      status: 1,
      date_resolved: Math.floor(new Date().getTime() / 1000),
      resolved_by: user.id
    };
  }

  if (newStatus === 0) {
    // Reopening RFI
    return {
      status: 0,
      date_resolved: null,
      resolved_by: null
    };
  }

  throw new Error(`Invalid status: ${newStatus}`);
}

export function getCurrentState(rfi, engagementStage) {
  return {
    internal_state: deriveInternalState(rfi),
    auditor_display: getAuditorDisplayState(rfi),
    client_display: getClientDisplayState(rfi),
    days_outstanding: calculateDaysOutstanding(rfi, engagementStage),
    escalation_triggered: checkEscalationTrigger(rfi, engagementStage),
    completion_valid: validateCompletion(rfi)
  };
}

function validateCompletion(rfi) {
  try {
    validateRFICompletion(rfi);
    return true;
  } catch (e) {
    return false;
  }
}
