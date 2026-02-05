/**
 * Data Transformers: Firestore → SQLite field transformations
 *
 * This module provides transformation rules for converting Firestore fields
 * to SQLite, handling type conversions, timestamp normalization, and special cases
 */

/**
 * Transform Firestore timestamp to ISO 8601 UTC string
 * @param {*} firestoreTs - Firestore Timestamp object or milliseconds
 * @returns {string} ISO 8601 UTC format (YYYY-MM-DDTHH:MM:SS.sssZ)
 */
export function transformTimestamp(firestoreTs) {
  if (!firestoreTs) return null;

  try {
    let date;
    // Handle Firestore Timestamp object
    if (firestoreTs.toMillis) {
      date = new Date(firestoreTs.toMillis());
    }
    // Handle numeric milliseconds
    else if (typeof firestoreTs === 'number') {
      date = new Date(firestoreTs);
    }
    // Handle ISO string
    else if (typeof firestoreTs === 'string') {
      date = new Date(firestoreTs);
    } else {
      return null;
    }

    // Ensure UTC and ISO format
    const iso = date.toISOString();
    if (!iso.endsWith('Z')) {
      throw new Error('Timestamp not in UTC');
    }
    return iso;
  } catch (err) {
    console.error(`Failed to transform timestamp: ${firestoreTs}`, err);
    return null;
  }
}

/**
 * Normalize timestamp to ensure UTC Z suffix
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Normalized timestamp with Z suffix
 */
export function normalizeTimestamp(timestamp) {
  if (!timestamp) return null;

  let ts = String(timestamp).trim();
  // Remove timezone offset if present
  ts = ts.replace(/[+-]\d{2}:\d{2}$/, '');
  ts = ts.replace(/Z$/, '');

  // Ensure Z suffix for UTC
  if (!ts.endsWith('Z')) {
    ts += 'Z';
  }

  return ts;
}

/**
 * Transform reference to document ID
 * @param {*} ref - Firestore reference or ID string
 * @returns {string} Document ID
 */
export function transformReference(ref) {
  if (!ref) return null;

  // If it's already a string ID, return it
  if (typeof ref === 'string') return ref;

  // If it's a Firestore DocumentReference, get the ID
  if (ref.id) return ref.id;

  // If it's an object with path, extract ID from path
  if (ref.path) {
    const parts = ref.path.split('/');
    return parts[parts.length - 1];
  }

  return null;
}

/**
 * Transform array to normalized table rows
 * @param {Array} array - Array from Firestore
 * @returns {Array} Array of objects, each representing a row
 */
export function transformArray(array, parentId = null) {
  if (!Array.isArray(array)) return [];

  return array.map((item, index) => {
    if (typeof item === 'object') {
      return {
        ...item,
        order: item.order ?? index,
      };
    }
    return {
      value: item,
      order: index,
    };
  });
}

/**
 * Transform map/object to JSON string
 * @param {Object} obj - Object from Firestore
 * @returns {string} JSON string
 */
export function transformMap(obj) {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    try {
      return JSON.stringify(obj);
    } catch (err) {
      console.error('Failed to stringify object', obj, err);
      return null;
    }
  }
  return null;
}

/**
 * Transform boolean to SQLite integer (0/1)
 * @param {boolean|*} bool - Boolean value
 * @returns {0|1|null} SQLite boolean representation
 */
export function transformBoolean(bool) {
  if (bool === null || bool === undefined) return null;
  return bool ? 1 : 0;
}

/**
 * Transform GeoPoint to JSON string
 * @param {*} geopoint - Firestore GeoPoint
 * @returns {string} JSON representation
 */
export function transformGeoPoint(geopoint) {
  if (!geopoint) return null;

  const geo = {
    latitude: geopoint.latitude,
    longitude: geopoint.longitude,
  };

  try {
    return JSON.stringify(geo);
  } catch (err) {
    console.error('Failed to stringify GeoPoint', geopoint, err);
    return null;
  }
}

/**
 * Transform bytes to base64 string
 * @param {*} bytes - Bytes value
 * @returns {string} Base64 string
 */
export function transformBytes(bytes) {
  if (!bytes) return null;

  if (typeof bytes === 'string') {
    return bytes; // Already string
  }

  if (Buffer.isBuffer(bytes)) {
    return bytes.toString('base64');
  }

  if (bytes instanceof Uint8Array) {
    return Buffer.from(bytes).toString('base64');
  }

  console.error('Unknown bytes format:', typeof bytes);
  return null;
}

/**
 * CRITICAL: Transform PDF coordinates with ±0 pixels accuracy
 * No recalculation, no transformation, direct copy only
 * @param {Object} highlight - Highlight object with coordinates
 * @returns {Object} Transformed highlight with validated coordinates
 */
export function transformHighlightCoordinates(highlight) {
  if (!highlight) return null;

  // CRITICAL: Direct copy, no calculation
  const transformed = {
    ...highlight,
    x: highlight.x,           // Exact copy
    y: highlight.y,           // Exact copy
    page: highlight.page,     // Exact copy
    width: highlight.width,   // Exact copy
    height: highlight.height, // Exact copy
  };

  // Validate all coordinates are numbers
  ['x', 'y', 'page', 'width', 'height'].forEach(coord => {
    if (typeof transformed[coord] !== 'number' && transformed[coord] !== undefined) {
      throw new Error(`Invalid coordinate type for ${coord}: ${typeof transformed[coord]}`);
    }
  });

  return transformed;
}

/**
 * Transform user data with deduplication preparation
 * @param {Object} user - User object from Firestore
 * @param {string} source - Source system ('friday' or 'mwr')
 * @returns {Object} Transformed user object
 */
export function transformUser(user, source) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email?.toLowerCase?.() || user.email,
    name: user.name,
    role: user.role,
    type: user.type,
    phone: user.phone,
    created_at: transformTimestamp(user.created_at),
    updated_at: transformTimestamp(user.updated_at),
    source: source, // Track source for deduplication
    metadata: transformMap(user.metadata),
  };
}

/**
 * Transform engagement data
 * @param {Object} engagement - Engagement from Firestore
 * @returns {Object} Transformed engagement
 */
export function transformEngagement(engagement) {
  if (!engagement) return null;

  return {
    id: engagement.id,
    client_id: transformReference(engagement.client_id || engagement.clientId),
    status: engagement.status || 'pending',
    stage: engagement.stage,
    start_date: transformTimestamp(engagement.start_date || engagement.startDate),
    end_date: transformTimestamp(engagement.end_date || engagement.endDate),
    workflow_config: transformMap(engagement.workflow_config || engagement.workflowConfig),
    created_at: transformTimestamp(engagement.created_at),
    updated_at: transformTimestamp(engagement.updated_at),
  };
}

/**
 * Transform RFI data
 * @param {Object} rfi - RFI from Firestore
 * @param {string} engagementId - Parent engagement ID
 * @returns {Object} Transformed RFI
 */
export function transformRFI(rfi, engagementId) {
  if (!rfi) return null;

  return {
    id: rfi.id,
    engagement_id: engagementId,
    status: rfi.status || 'pending',
    due_date: transformTimestamp(rfi.due_date || rfi.dueDate),
    metadata: transformMap(rfi.metadata),
    created_at: transformTimestamp(rfi.created_at),
    updated_at: transformTimestamp(rfi.updated_at),
  };
}

/**
 * Transform RFI question data
 * @param {Object} question - Question from Firestore
 * @param {string} rfiId - Parent RFI ID
 * @param {number} order - Question order in sequence
 * @returns {Object} Transformed question
 */
export function transformRFIQuestion(question, rfiId, order) {
  if (!question) return null;

  return {
    id: question.id,
    rfi_id: rfiId,
    question_text: question.text || question.question || question.question_text,
    order: order,
    metadata: transformMap(question.metadata),
    created_at: transformTimestamp(question.created_at),
  };
}

/**
 * Transform RFI response data
 * @param {Object} response - Response from Firestore
 * @param {string} rfiQuestionId - Parent question ID
 * @returns {Object} Transformed response
 */
export function transformRFIResponse(response, rfiQuestionId) {
  if (!response) return null;

  return {
    id: response.id,
    rfi_question_id: rfiQuestionId,
    user_id: transformReference(response.user_id || response.userId),
    response_text: response.text || response.response || response.response_text,
    metadata: transformMap(response.metadata),
    created_at: transformTimestamp(response.created_at),
  };
}

/**
 * Transform review data
 * @param {Object} review - Review from Firestore
 * @param {string} engagementId - Parent engagement ID
 * @returns {Object} Transformed review
 */
export function transformReview(review, engagementId) {
  if (!review) return null;

  return {
    id: review.id,
    engagement_id: engagementId,
    status: review.status || 'pending',
    reviewer_id: transformReference(review.reviewer_id || review.reviewerId),
    created_at: transformTimestamp(review.created_at),
    updated_at: transformTimestamp(review.updated_at),
    metadata: transformMap(review.metadata),
  };
}

/**
 * Transform message data
 * @param {Object} message - Message from Firestore
 * @param {string} engagementId - Parent engagement ID
 * @returns {Object} Transformed message
 */
export function transformMessage(message, engagementId) {
  if (!message) return null;

  return {
    id: message.id,
    engagement_id: engagementId,
    user_id: transformReference(message.user_id || message.userId),
    content: message.content || message.text || message.message,
    thread_id: message.thread_id || message.threadId,
    created_at: transformTimestamp(message.created_at),
    updated_at: transformTimestamp(message.updated_at),
  };
}

/**
 * Transform collaborator data
 * @param {Object} collab - Collaborator from Firestore
 * @returns {Object} Transformed collaborator
 */
export function transformCollaborator(collab) {
  if (!collab) return null;

  return {
    id: collab.id,
    engagement_id: transformReference(collab.engagement_id || collab.engagementId),
    user_id: transformReference(collab.user_id || collab.userId),
    role: collab.role,
    status: collab.status || 'active',
    assigned_at: transformTimestamp(collab.assigned_at || collab.assignedAt),
    metadata: transformMap(collab.metadata),
  };
}

/**
 * Transform checklist data
 * @param {Object} checklist - Checklist from Firestore
 * @param {string} engagementId - Parent engagement ID
 * @returns {Object} Transformed checklist
 */
export function transformChecklist(checklist, engagementId) {
  if (!checklist) return null;

  return {
    id: checklist.id,
    engagement_id: engagementId,
    name: checklist.name,
    status: checklist.status || 'pending',
    created_at: transformTimestamp(checklist.created_at),
    updated_at: transformTimestamp(checklist.updated_at),
  };
}

/**
 * Transform checklist item data
 * @param {Object} item - Item from Firestore
 * @param {string} checklistId - Parent checklist ID
 * @param {number} order - Item order
 * @returns {Object} Transformed item
 */
export function transformChecklistItem(item, checklistId, order) {
  if (!item) return null;

  return {
    id: item.id,
    checklist_id: checklistId,
    task_name: item.task_name || item.name || item.task,
    completed: transformBoolean(item.completed),
    completed_at: item.completed ? transformTimestamp(item.completed_at) : null,
    order: order,
    created_at: transformTimestamp(item.created_at),
  };
}

/**
 * Transform file data
 * @param {Object} file - File from Firestore
 * @param {string} sourcePath - Source system path
 * @param {string} targetPath - Target system path
 * @returns {Object} Transformed file
 */
export function transformFile(file, sourcePath = '', targetPath = '') {
  if (!file) return null;

  let filePath = file.path || '';
  // Update path from source to target
  if (sourcePath && targetPath) {
    filePath = filePath.replace(sourcePath, targetPath);
  }

  return {
    id: file.id,
    name: file.name,
    path: filePath,
    size: file.size,
    mime_type: file.mime_type || file.mimeType || file.contentType,
    created_at: transformTimestamp(file.created_at),
  };
}

/**
 * Transform activity log entry
 * @param {Object} log - Activity log from Firestore
 * @returns {Object} Transformed log
 */
export function transformActivityLog(log) {
  if (!log) return null;

  return {
    id: log.id,
    entity_type: log.entity_type || log.entityType,
    entity_id: transformReference(log.entity_id || log.entityId),
    action: log.action,
    user_id: transformReference(log.user_id || log.userId),
    changes: transformMap(log.changes),
    timestamp: transformTimestamp(log.timestamp || log.created_at),
  };
}

/**
 * Transform permission data
 * @param {Object} perm - Permission from Firestore
 * @returns {Object} Transformed permission
 */
export function transformPermission(perm) {
  if (!perm) return null;

  return {
    id: perm.id,
    user_id: transformReference(perm.user_id || perm.userId),
    role: perm.role,
    resource_type: perm.resource_type || perm.resourceType,
    resource_id: transformReference(perm.resource_id || perm.resourceId),
    created_at: transformTimestamp(perm.created_at),
  };
}

/**
 * Validate transformed data
 * @param {Object} data - Transformed data
 * @param {string} entityType - Entity type (user, engagement, rfi, etc)
 * @returns {Array} Array of validation errors (empty if valid)
 */
export function validateTransformedData(data, entityType) {
  const errors = [];

  if (!data || !data.id) {
    errors.push(`Missing required id field`);
  }

  // Check timestamps are properly formatted
  ['created_at', 'updated_at', 'assigned_at', 'due_date', 'start_date', 'end_date'].forEach(field => {
    if (data[field] && !data[field].endsWith('Z')) {
      errors.push(`Timestamp field ${field} not in UTC: ${data[field]}`);
    }
  });

  // Check references are valid strings
  ['user_id', 'engagement_id', 'client_id', 'rfi_id', 'rfi_question_id', 'checklist_id'].forEach(field => {
    if (data[field] && typeof data[field] !== 'string') {
      errors.push(`Reference field ${field} is not a string: ${typeof data[field]}`);
    }
  });

  return errors;
}
