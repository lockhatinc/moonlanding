/**
 * Entity Migrators: Handle migration of specific entity types
 *
 * Migrates data from Firestore source to SQLite target with proper
 * transformation, normalization, and error handling
 */

import {
  transformTimestamp,
  transformReference,
  transformArray,
  transformMap,
  transformBoolean,
  transformEngagement,
  transformRFI,
  transformRFIQuestion,
  transformRFIResponse,
  transformReview,
  transformMessage,
  transformCollaborator,
  transformChecklist,
  transformChecklistItem,
  transformFile,
  transformActivityLog,
  transformPermission,
  transformHighlightCoordinates,
  validateTransformedData,
} from './transformers.js';

/**
 * Base migrator class with common functionality
 */
export class BaseMigrator {
  constructor(db, sourceDb, logger, deduplicator) {
    this.db = db;
    this.sourceDb = sourceDb;
    this.logger = logger;
    this.deduplicator = deduplicator;
    this.stats = {
      processed: 0,
      migrated: 0,
      errors: 0,
      skipped: 0,
    };
  }

  logStat(msg) {
    this.logger?.log(`  [${this.constructor.name}] ${msg}`);
  }

  recordError(id, error) {
    this.stats.errors++;
    this.logger?.error(`Error processing ${id}`, error);
  }

  getStats() {
    return {
      entity: this.constructor.name.replace('Migrator', ''),
      ...this.stats,
    };
  }
}

/**
 * Engagement Migrator
 * Migrates engagements from Firestore to SQLite
 */
export class EngagementMigrator extends BaseMigrator {
  migrate(engagements) {
    this.logStat(`Starting migration of ${engagements.length} engagements`);

    const stmt = this.db.prepare(`
      INSERT INTO engagements
      (id, client_id, status, stage, start_date, end_date, workflow_config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    engagements.forEach(eng => {
      try {
        this.stats.processed++;
        const transformed = transformEngagement(eng);
        const errors = validateTransformedData(transformed, 'engagement');

        if (errors.length > 0) {
          this.logStat(`Validation errors for engagement ${eng.id}: ${errors.join('; ')}`);
          this.stats.skipped++;
          return;
        }

        stmt.run(
          transformed.id,
          transformed.client_id,
          transformed.status,
          transformed.stage,
          transformed.start_date,
          transformed.end_date,
          transformed.workflow_config,
          transformed.created_at,
          transformed.updated_at
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(eng.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} engagements`);
    return this.getStats();
  }
}

/**
 * RFI Migrator
 * Migrates RFIs with questions and responses (subcollection normalization)
 */
export class RFIMigrator extends BaseMigrator {
  migrate(rfis) {
    this.logStat(`Starting migration of ${rfis.length} RFIs (with questions/responses)`);

    const rfiStmt = this.db.prepare(`
      INSERT INTO rfi
      (id, engagement_id, status, due_date, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const questionStmt = this.db.prepare(`
      INSERT INTO rfi_question
      (id, rfi_id, question_text, order, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const responseStmt = this.db.prepare(`
      INSERT INTO rfi_response
      (id, rfi_question_id, user_id, response_text, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    rfis.forEach(rfiData => {
      try {
        this.stats.processed++;

        // Migrate RFI
        const transformed = transformRFI(rfiData, rfiData.engagement_id);
        const errors = validateTransformedData(transformed, 'rfi');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        rfiStmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.status,
          transformed.due_date,
          transformed.metadata,
          transformed.created_at,
          transformed.updated_at
        );

        this.stats.migrated++;

        // Migrate questions (subcollection)
        if (Array.isArray(rfiData.questions)) {
          rfiData.questions.forEach((q, idx) => {
            try {
              const tQuestion = transformRFIQuestion(q, rfiData.id, idx);
              questionStmt.run(
                tQuestion.id,
                tQuestion.rfi_id,
                tQuestion.question_text,
                tQuestion.order,
                tQuestion.metadata,
                tQuestion.created_at
              );

              // Migrate responses (sub-subcollection)
              if (Array.isArray(q.responses)) {
                q.responses.forEach(r => {
                  try {
                    const tResponse = transformRFIResponse(r, tQuestion.id);
                    if (tResponse.user_id && this.deduplicator) {
                      tResponse.user_id = this.deduplicator.getMappedUserId(tResponse.user_id);
                    }
                    responseStmt.run(
                      tResponse.id,
                      tResponse.rfi_question_id,
                      tResponse.user_id,
                      tResponse.response_text,
                      tResponse.metadata,
                      tResponse.created_at
                    );
                  } catch (err) {
                    this.logger?.error(`Error migrating RFI response`, err);
                  }
                });
              }
            } catch (err) {
              this.logger?.error(`Error migrating RFI question`, err);
            }
          });
        }
      } catch (err) {
        this.recordError(rfiData.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} RFIs with questions/responses`);
    return this.getStats();
  }
}

/**
 * Review Migrator
 * Migrates reviews from Firestore to SQLite
 */
export class ReviewMigrator extends BaseMigrator {
  migrate(reviews) {
    this.logStat(`Starting migration of ${reviews.length} reviews (with highlights)`);

    const reviewStmt = this.db.prepare(`
      INSERT INTO reviews
      (id, engagement_id, status, reviewer_id, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const highlightStmt = this.db.prepare(`
      INSERT INTO highlights
      (id, review_id, x, y, page, width, height, text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    reviews.forEach(review => {
      try {
        this.stats.processed++;

        // Transform review
        const transformed = transformReview(review, review.engagement_id);
        const errors = validateTransformedData(transformed, 'review');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        // Map reviewer ID if deduplicating users
        if (transformed.reviewer_id && this.deduplicator) {
          transformed.reviewer_id = this.deduplicator.getMappedUserId(transformed.reviewer_id);
        }

        reviewStmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.status,
          transformed.reviewer_id,
          transformed.created_at,
          transformed.updated_at,
          transformed.metadata
        );

        this.stats.migrated++;

        // Migrate highlights (subcollection)
        if (Array.isArray(review.highlights)) {
          review.highlights.forEach(hl => {
            try {
              // CRITICAL: Preserve PDF coordinates exactly (±0 pixels)
              const tHighlight = transformHighlightCoordinates(hl);
              highlightStmt.run(
                tHighlight.id,
                transformed.id,
                tHighlight.x,
                tHighlight.y,
                tHighlight.page,
                tHighlight.width,
                tHighlight.height,
                tHighlight.text,
                transformTimestamp(tHighlight.created_at)
              );
            } catch (err) {
              this.logger?.error(`Error migrating highlight for review ${review.id}`, err);
            }
          });
        }
      } catch (err) {
        this.recordError(review.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} reviews with highlights`);
    return this.getStats();
  }
}

/**
 * Message Migrator
 * Migrates messages from Firestore to SQLite
 */
export class MessageMigrator extends BaseMigrator {
  migrate(messages) {
    this.logStat(`Starting migration of ${messages.length} messages`);

    const stmt = this.db.prepare(`
      INSERT INTO messages
      (id, engagement_id, user_id, content, thread_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    messages.forEach(msg => {
      try {
        this.stats.processed++;

        const transformed = transformMessage(msg, msg.engagement_id);
        const errors = validateTransformedData(transformed, 'message');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        // Map user ID if deduplicating
        if (transformed.user_id && this.deduplicator) {
          transformed.user_id = this.deduplicator.getMappedUserId(transformed.user_id);
        }

        stmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.user_id,
          transformed.content,
          transformed.thread_id,
          transformed.created_at,
          transformed.updated_at
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(msg.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} messages`);
    return this.getStats();
  }
}

/**
 * Collaborator Migrator
 * Migrates collaborators (users assigned to engagements)
 */
export class CollaboratorMigrator extends BaseMigrator {
  migrate(collaborators) {
    this.logStat(`Starting migration of ${collaborators.length} collaborators`);

    const stmt = this.db.prepare(`
      INSERT INTO collaborators
      (id, engagement_id, user_id, role, status, assigned_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    collaborators.forEach(collab => {
      try {
        this.stats.processed++;

        const transformed = transformCollaborator(collab);
        const errors = validateTransformedData(transformed, 'collaborator');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        // Map user ID if deduplicating
        if (transformed.user_id && this.deduplicator) {
          transformed.user_id = this.deduplicator.getMappedUserId(transformed.user_id);
        }

        stmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.user_id,
          transformed.role,
          transformed.status,
          transformed.assigned_at,
          transformed.metadata
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(collab.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} collaborators`);
    return this.getStats();
  }
}

/**
 * Checklist Migrator
 * Migrates checklists with items (subcollection normalization)
 */
export class ChecklistMigrator extends BaseMigrator {
  migrate(checklists) {
    this.logStat(`Starting migration of ${checklists.length} checklists (with items)`);

    const checklistStmt = this.db.prepare(`
      INSERT INTO checklist
      (id, engagement_id, name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const itemStmt = this.db.prepare(`
      INSERT INTO checklist_item
      (id, checklist_id, task_name, completed, completed_at, order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    checklists.forEach(chk => {
      try {
        this.stats.processed++;

        const transformed = transformChecklist(chk, chk.engagement_id);
        const errors = validateTransformedData(transformed, 'checklist');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        checklistStmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.name,
          transformed.status,
          transformed.created_at,
          transformed.updated_at
        );

        this.stats.migrated++;

        // Migrate items (subcollection)
        if (Array.isArray(chk.items)) {
          chk.items.forEach((item, idx) => {
            try {
              const tItem = transformChecklistItem(item, chk.id, idx);
              itemStmt.run(
                tItem.id,
                tItem.checklist_id,
                tItem.task_name,
                tItem.completed,
                tItem.completed_at,
                tItem.order,
                tItem.created_at
              );
            } catch (err) {
              this.logger?.error(`Error migrating checklist item`, err);
            }
          });
        }
      } catch (err) {
        this.recordError(chk.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} checklists with items`);
    return this.getStats();
  }
}

/**
 * File Migrator
 * Migrates file references with path updates
 */
export class FileMigrator extends BaseMigrator {
  migrate(files, sourcePathPrefix = '', targetPathPrefix = '') {
    this.logStat(`Starting migration of ${files.length} files`);

    const stmt = this.db.prepare(`
      INSERT INTO files
      (id, name, path, size, mime_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    files.forEach(file => {
      try {
        this.stats.processed++;

        const transformed = transformFile(file, sourcePathPrefix, targetPathPrefix);
        const errors = validateTransformedData(transformed, 'file');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        stmt.run(
          transformed.id,
          transformed.name,
          transformed.path,
          transformed.size,
          transformed.mime_type,
          transformed.created_at
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(file.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} files`);
    return this.getStats();
  }
}

/**
 * Activity Log Migrator
 * Migrates activity logs and audit trails
 */
export class ActivityLogMigrator extends BaseMigrator {
  migrate(logs) {
    this.logStat(`Starting migration of ${logs.length} activity logs`);

    const stmt = this.db.prepare(`
      INSERT INTO activity_log
      (id, entity_type, entity_id, action, user_id, changes, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    logs.forEach(log => {
      try {
        this.stats.processed++;

        const transformed = transformActivityLog(log);
        const errors = validateTransformedData(transformed, 'activity_log');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        // Map user ID if deduplicating
        if (transformed.user_id && this.deduplicator) {
          transformed.user_id = this.deduplicator.getMappedUserId(transformed.user_id);
        }

        stmt.run(
          transformed.id,
          transformed.entity_type,
          transformed.entity_id,
          transformed.action,
          transformed.user_id,
          transformed.changes,
          transformed.timestamp
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(log.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} activity logs`);
    return this.getStats();
  }
}

/**
 * Permission Migrator
 * Migrates permission records
 */
export class PermissionMigrator extends BaseMigrator {
  migrate(permissions) {
    this.logStat(`Starting migration of ${permissions.length} permissions`);

    const stmt = this.db.prepare(`
      INSERT INTO permissions
      (id, user_id, role, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    permissions.forEach(perm => {
      try {
        this.stats.processed++;

        const transformed = transformPermission(perm);
        const errors = validateTransformedData(transformed, 'permission');

        if (errors.length > 0) {
          this.stats.skipped++;
          return;
        }

        // Map user ID if deduplicating
        if (transformed.user_id && this.deduplicator) {
          transformed.user_id = this.deduplicator.getMappedUserId(transformed.user_id);
        }

        stmt.run(
          transformed.id,
          transformed.user_id,
          transformed.role,
          transformed.resource_type,
          transformed.resource_id,
          transformed.created_at
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(perm.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} permissions`);
    return this.getStats();
  }
}

export default {
  EngagementMigrator,
  RFIMigrator,
  ReviewMigrator,
  MessageMigrator,
  CollaboratorMigrator,
  ChecklistMigrator,
  FileMigrator,
  ActivityLogMigrator,
  PermissionMigrator,
};
