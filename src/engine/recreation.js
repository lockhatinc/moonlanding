// Engagement Recreation - Logic for recreating engagements
// From Friday: engagementRecreation.js

import { list, get, update, create, remove } from '../engine';

/**
 * Recreate an engagement for the next period
 * From Friday: recreateEngagement process
 *
 * Process:
 * 1. Get source engagement
 * 2. Calculate new dates (year/month based on repeat_interval)
 * 3. Check for duplicates
 * 4. Create new engagement (inherits repeat_interval)
 * 5. Copy sections
 * 6. Copy RFIs
 * 7. If recreate_with_attachments=true: copy files and responses
 * 8. Reset RFI fields (status, dates, counts)
 * 9. Update original engagement (set repeat_interval to 'once')
 * 10. Log recreation
 */
export async function recreateEngagement(sourceEngagementId, options = {}) {
  const source = get('engagement', sourceEngagementId);
  if (!source) {
    throw new Error('Source engagement not found');
  }

  // 1. Calculate new dates based on repeat_interval
  let newYear = source.year;
  let newMonth = source.month;

  if (source.repeat_interval === 'yearly') {
    newYear = source.year + 1;
  } else if (source.repeat_interval === 'monthly') {
    if (source.month === 12) {
      newMonth = 1;
      newYear = source.year + 1;
    } else {
      newMonth = (source.month || 0) + 1;
    }
  } else {
    throw new Error('Engagement does not have a repeat interval');
  }

  // 2. Check for duplicates
  const existingEngagements = list('engagement', {
    client_id: source.client_id,
    engagement_type: source.engagement_type,
  });

  const duplicate = existingEngagements.find(e =>
    e.year === newYear &&
    e.month === newMonth &&
    e.id !== sourceEngagementId
  );

  if (duplicate) {
    throw new Error(`Engagement already exists for ${newYear}/${newMonth || 'annual'}`);
  }

  let newEngagement = null;

  try {
    // 3. Create new engagement
    const engagementData = {
      name: source.name,
      client_id: source.client_id,
      year: newYear,
      month: newMonth,
      stage: 'info_gathering',
      status: 'pending',
      team_id: source.team_id,
      template_id: source.template_id,
      engagement_type: source.engagement_type,
      // Reset progress
      progress: 0,
      client_progress: 0,
      // Reset status fields
      client_status: 'pending',
      auditor_status: 'requested',
      letter_client_status: 'pending',
      letter_auditor_status: 'pending',
      post_rfi_client_status: 'pending',
      post_rfi_auditor_status: 'pending',
      // Inherit settings
      repeat_interval: source.repeat_interval, // New engagement inherits interval
      recreate_with_attachments: source.recreate_with_attachments,
      clerks_can_approve: source.clerks_can_approve,
      is_private: source.is_private,
      fee: source.fee,
      // Copy user assignments
      users: source.users,
      client_users: source.client_users,
      // Link to previous review
      previous_year_review_id: source.review_id,
    };

    newEngagement = create('engagement', engagementData);

    // 4. Copy sections
    const sections = list('engagement_section', { engagement_id: sourceEngagementId });
    const sectionIdMap = {}; // Map old section IDs to new ones

    for (const section of sections) {
      const newSection = create('engagement_section', {
        engagement_id: newEngagement.id,
        name: section.name,
        key: section.key,
        sort_order: section.sort_order,
      });
      sectionIdMap[section.id] = newSection.id;
    }

    // 5. Copy RFIs
    const rfis = list('rfi', { engagement_id: sourceEngagementId });

    for (const rfi of rfis) {
      const rfiData = {
        engagement_id: newEngagement.id,
        section_id: rfi.section_id ? sectionIdMap[rfi.section_id] : null,
        key: rfi.key,
        name: rfi.name,
        question: rfi.question,
        // Reset status fields
        status: 0,
        rfi_status: 'pending',
        client_status: 'pending',
        auditor_status: 'requested',
        // Clear dates
        date_requested: null,
        date_resolved: null,
        deadline: null,
        deadline_date: null,
        days_outstanding: 0,
        // Reset counts
        response_count: 0,
        files_count: 0,
        // Clear data (unless copying)
        responses: null,
        files: null,
        // Inherit settings
        flag: false,
        ml_query: rfi.ml_query,
        assigned_users: rfi.assigned_users,
        recreate_with_attachments: rfi.recreate_with_attachments,
        sort_order: rfi.sort_order,
      };

      const newRfi = create('rfi', rfiData);

      // 6. Copy attachments and responses if enabled
      if (source.recreate_with_attachments || rfi.recreate_with_attachments) {
        await copyRfiAttachments(rfi.id, newRfi.id);
        await copyRfiResponses(rfi.id, newRfi.id);
      }
    }

    // 7. Update original engagement - set repeat_interval to 'once'
    update('engagement', sourceEngagementId, {
      repeat_interval: 'once',
    });

    // 8. Log successful recreation
    create('recreation_log', {
      engagement_id: sourceEngagementId,
      client_id: source.client_id,
      engagement_type_id: source.engagement_type,
      status: 'completed',
      details: JSON.stringify({
        source_id: sourceEngagementId,
        new_id: newEngagement.id,
        year: newYear,
        month: newMonth,
        sections_copied: sections.length,
        rfis_copied: rfis.length,
        with_attachments: source.recreate_with_attachments,
      }),
    });

    return newEngagement;
  } catch (error) {
    // Rollback: delete new engagement if created
    if (newEngagement?.id) {
      try {
        // Delete RFIs
        const newRfis = list('rfi', { engagement_id: newEngagement.id });
        for (const rfi of newRfis) {
          remove('rfi', rfi.id);
        }
        // Delete sections
        const newSections = list('engagement_section', { engagement_id: newEngagement.id });
        for (const section of newSections) {
          remove('engagement_section', section.id);
        }
        // Delete engagement
        remove('engagement', newEngagement.id);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }

    // Revert original engagement
    update('engagement', sourceEngagementId, {
      repeat_interval: source.repeat_interval,
    });

    // Log failed recreation
    create('recreation_log', {
      engagement_id: sourceEngagementId,
      client_id: source.client_id,
      engagement_type_id: source.engagement_type,
      status: 'failed',
      error: error.message,
      details: JSON.stringify({
        source_id: sourceEngagementId,
        year: newYear,
        month: newMonth,
      }),
    });

    throw error;
  }
}

/**
 * Copy RFI attachments from source to target
 */
async function copyRfiAttachments(sourceRfiId, targetRfiId) {
  const sourceRfi = get('rfi', sourceRfiId);
  if (!sourceRfi) return;

  // Get files from the files entity
  const files = list('file', {
    entity_type: 'rfi',
    entity_id: sourceRfiId,
  });

  for (const file of files) {
    // Create a copy of the file reference (actual file copy would need Drive API)
    create('file', {
      entity_type: 'rfi',
      entity_id: targetRfiId,
      drive_file_id: file.drive_file_id, // Reference same Drive file
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size,
      mime_type: file.mime_type,
      download_url: file.download_url,
    });
  }

  // Also copy files from JSON field if present
  if (sourceRfi.files) {
    const filesJson = JSON.parse(sourceRfi.files || '[]');
    if (filesJson.length > 0) {
      update('rfi', targetRfiId, {
        files: sourceRfi.files,
        files_count: filesJson.length,
      });
    }
  }
}

/**
 * Copy RFI responses from source to target
 */
async function copyRfiResponses(sourceRfiId, targetRfiId) {
  // Get responses from the rfi_response entity
  const responses = list('rfi_response', { rfi_id: sourceRfiId });

  for (const response of responses) {
    create('rfi_response', {
      rfi_id: targetRfiId,
      content: response.content,
      attachments: response.attachments,
      is_client: response.is_client,
    });
  }

  // Also copy responses from JSON field if present
  const sourceRfi = get('rfi', sourceRfiId);
  if (sourceRfi?.responses) {
    const responsesJson = JSON.parse(sourceRfi.responses || '[]');
    if (responsesJson.length > 0) {
      update('rfi', targetRfiId, {
        responses: sourceRfi.responses,
        response_count: responsesJson.length,
      });
    }
  }
}

/**
 * Batch recreate multiple engagements
 * From Friday: process-engagement-batch
 */
export async function batchRecreateEngagements(engagementIds, options = {}) {
  const results = {
    success: [],
    failed: [],
  };

  for (const id of engagementIds) {
    try {
      const newEngagement = await recreateEngagement(id, options);
      results.success.push({
        sourceId: id,
        newId: newEngagement.id,
      });
    } catch (error) {
      results.failed.push({
        sourceId: id,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get engagements due for recreation
 */
export function getEngagementsDueForRecreation(interval) {
  const engagements = list('engagement', {
    repeat_interval: interval,
    status: 'active',
  });

  // Filter to completed or close_out stage engagements
  return engagements.filter(e =>
    e.stage === 'close_out' ||
    e.status === 'completed'
  );
}

/**
 * Preview what a recreation would produce without creating it
 */
export function previewRecreation(sourceEngagementId) {
  const source = get('engagement', sourceEngagementId);
  if (!source) {
    throw new Error('Source engagement not found');
  }

  let newYear = source.year;
  let newMonth = source.month;

  if (source.repeat_interval === 'yearly') {
    newYear = source.year + 1;
  } else if (source.repeat_interval === 'monthly') {
    if (source.month === 12) {
      newMonth = 1;
      newYear = source.year + 1;
    } else {
      newMonth = (source.month || 0) + 1;
    }
  }

  const sections = list('engagement_section', { engagement_id: sourceEngagementId });
  const rfis = list('rfi', { engagement_id: sourceEngagementId });

  return {
    source: {
      id: source.id,
      name: source.name,
      year: source.year,
      month: source.month,
      repeat_interval: source.repeat_interval,
    },
    preview: {
      year: newYear,
      month: newMonth,
      sections_count: sections.length,
      rfis_count: rfis.length,
      will_copy_attachments: source.recreate_with_attachments,
    },
  };
}
