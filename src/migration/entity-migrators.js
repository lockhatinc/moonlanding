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
      (id, client_id, status, stage, created_at, commencement_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
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
          transformed.created_at,
          transformed.commencement_date,
          transformed.description
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
    this.logStat(`Starting migration of ${rfis.length} RFIs`);

    const rfiStmt = this.db.prepare(`
      INSERT INTO rfis
      (id, engagement_id, title, status, client_status, due_date, created_at, assigned_user_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

        // Map user ID if deduplicator available
        let assignedUserId = transformed.assigned_user_id;
        if (assignedUserId && this.deduplicator) {
          assignedUserId = this.deduplicator.getMappedUserId(assignedUserId);
        }

        rfiStmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.title,
          transformed.status,
          transformed.client_status,
          transformed.due_date,
          transformed.created_at,
          assignedUserId,
          transformed.description
        );

        this.stats.migrated++;

      } catch (err) {
        this.recordError(rfiData.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} RFIs`);
    return this.getStats();
  }
}

/**
 * Review Migrator
 * Migrates reviews from Firestore to SQLite
 */
export class ReviewMigrator extends BaseMigrator {
  migrate(reviews) {
    this.logStat(`Starting migration of ${reviews.length} reviews`);

    const reviewStmt = this.db.prepare(`
      INSERT INTO reviews
      (id, engagement_id, reviewer_id, status, created_at, updated_at, document_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
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
          transformed.reviewer_id,
          transformed.status,
          transformed.created_at,
          transformed.updated_at,
          transformed.document_name
        );

        this.stats.migrated++;
      } catch (err) {
        this.recordError(review.id, err);
      }
    });

    this.logStat(`Migrated ${this.stats.migrated}/${this.stats.processed} reviews`);
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
      (id, engagement_id, sender_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
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

        // Map sender ID if deduplicating
        let senderId = transformed.sender_id || transformed.user_id;
        if (senderId && this.deduplicator) {
          senderId = this.deduplicator.getMappedUserId(senderId);
        }

        stmt.run(
          transformed.id,
          transformed.engagement_id,
          senderId,
          transformed.content,
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
      (id, engagement_id, email, name, role, expires_at, created_at, is_permanent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

        stmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.email,
          transformed.name,
          transformed.role,
          transformed.expires_at,
          transformed.created_at,
          transformed.is_permanent ? 1 : 0
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
      INSERT INTO checklists
      (id, engagement_id, title, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const itemStmt = this.db.prepare(`
      INSERT INTO checklist_items
      (id, checklist_id, title, completed, completed_at)
      VALUES (?, ?, ?, ?, ?)
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
          transformed.title,
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
                tItem.title,
                tItem.completed,
                tItem.completed_at
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
      (id, engagement_id, filename, size, created_at, uploaded_by)
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

        // Map uploader ID if deduplicating users
        let uploadedBy = transformed.uploaded_by;
        if (uploadedBy && this.deduplicator) {
          uploadedBy = this.deduplicator.getMappedUserId(uploadedBy);
        }

        stmt.run(
          transformed.id,
          transformed.engagement_id,
          transformed.filename,
          transformed.size,
          transformed.created_at,
          uploadedBy
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
      INSERT INTO activity_logs
      (id, entity_type, entity_id, action, user_id, message, created_at)
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
          transformed.message,
          transformed.created_at
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
    this.logStat(`Skipping permissions migration (no permissions table in schema)`);

    if (Array.isArray(permissions)) {
      permissions.forEach(perm => {
        try {
          this.stats.processed++;
          this.stats.skipped++;
        } catch (err) {
          this.recordError(perm.id, err);
        }
      });
    }

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
