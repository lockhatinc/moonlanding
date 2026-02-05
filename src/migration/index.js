/**
 * Migration Framework - Complete Data Migration Toolkit
 *
 * Exports all migration components for Phase 3 data consolidation:
 * - Friday-staging (Firebase) → Moonlanding (SQLite)
 * - MyWorkReview-staging (Firebase) → Moonlanding (SQLite)
 * - Handle user deduplication (10-15% overlap)
 * - Preserve PDF coordinates (±0 pixels)
 * - Normalize timestamps (UTC ISO 8601)
 * - 8 comprehensive validators
 * - Master orchestrator with transaction management
 */

// Core modules
export { MigrationOrchestrator } from './orchestrator.js';
export { UserDeduplicator } from './user-dedup.js';

// Transformers
export {
  transformTimestamp,
  normalizeTimestamp,
  transformReference,
  transformArray,
  transformMap,
  transformBoolean,
  transformGeoPoint,
  transformBytes,
  transformHighlightCoordinates,
  transformUser,
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
  validateTransformedData,
} from './transformers.js';

// Entity Migrators
export {
  EngagementMigrator,
  RFIMigrator,
  ReviewMigrator,
  MessageMigrator,
  CollaboratorMigrator,
  ChecklistMigrator,
  FileMigrator,
  ActivityLogMigrator,
  PermissionMigrator,
} from './entity-migrators.js';

// Validators (8 comprehensive checks)
export {
  RowCountValidator,
  ReferentialIntegrityValidator,
  DataTypeValidator,
  PDFCoordinateValidator,
  TimestampValidator,
  FilePathValidator,
  JSONFieldValidator,
  ForeignKeyConstraintValidator,
  MasterValidator,
} from './validators.js';

/**
 * Migration Configuration
 */
export const MIGRATION_CONFIG = {
  SOURCE_SYSTEMS: {
    FRIDAY: {
      path: '/home/user/lexco/friday-staging',
      type: 'firestore',
      name: 'Friday',
      description: 'Primary engagement and review system',
    },
    MWR: {
      path: '/home/user/lexco/myworkreview-staging',
      type: 'firestore',
      name: 'MyWorkReview',
      description: 'Collaborator and review system',
    },
  },
  TARGET: {
    path: '/home/user/lexco/moonlanding',
    database: 'data/app.db',
    type: 'sqlite',
    name: 'Moonlanding',
    description: 'Consolidated system',
  },
  DATA_COUNTS: {
    expected_min: 100000,
    expected_max: 230000,
    user_dedup_rate: '10-15%',
  },
  VALIDATION_CHECKPOINTS: [
    'schema_ready',
    'scripts_ready',
    'validators_ready',
    'sample_success',
    'pilot_success',
    'full_migration_success',
    'verification_complete',
  ],
  CRITICAL_FEATURES: [
    'User deduplication by email',
    'PDF coordinate preservation (±0 pixels)',
    'Timestamp normalization (UTC ISO 8601)',
    'Subcollection normalization to SQLite tables',
    'Foreign key relationship preservation',
    'Transaction management with rollback',
    'Comprehensive validation (8 validators)',
  ],
};

/**
 * Migration Status Enum
 */
export const MIGRATION_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  VALIDATION_PENDING: 'VALIDATION_PENDING',
  ROLLBACK_REQUIRED: 'ROLLBACK_REQUIRED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

/**
 * Validator Status Enum
 */
export const VALIDATOR_STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARN: 'WARN',
  SKIP: 'SKIP',
};

/**
 * Entity migration order (dependency-based)
 */
export const MIGRATION_ORDER = [
  { step: 1, entity: 'users', dependencies: [], description: 'User deduplication and mapping' },
  { step: 2, entity: 'clients', dependencies: [], description: 'Client organizations' },
  { step: 3, entity: 'engagements', dependencies: ['clients', 'users'], description: 'Engagements' },
  { step: 4, entity: 'rfis', dependencies: ['engagements'], description: 'RFIs with questions/responses' },
  { step: 5, entity: 'reviews', dependencies: ['engagements'], description: 'Reviews with highlights' },
  { step: 6, entity: 'messages', dependencies: ['engagements', 'users'], description: 'Messages' },
  { step: 7, entity: 'collaborators', dependencies: ['engagements', 'users'], description: 'Collaborators' },
  { step: 8, entity: 'checklists', dependencies: ['engagements'], description: 'Checklists with items' },
  { step: 9, entity: 'files', dependencies: [], description: 'Files with path updates' },
  { step: 10, entity: 'activity_logs', dependencies: ['users'], description: 'Activity logs' },
  { step: 11, entity: 'permissions', dependencies: ['users'], description: 'Permissions' },
];

/**
 * Critical transformation rules
 */
export const TRANSFORMATION_RULES = {
  USER_DEDUPLICATION: {
    enabled: true,
    method: 'email',
    expected_rate: '10-15%',
    action: 'merge_and_map',
    description: 'Match users by email (case-insensitive), merge Friday and MWR, preserve relationships',
  },
  PDF_COORDINATES: {
    preserved: true,
    tolerance: 0,
    unit: 'pixels',
    validation: 'exact_match',
    transformation: 'none',
    critical: true,
    description: 'Copy coordinates exactly, no zoom/rotation recalculation, validate ±0 pixels',
  },
  TIMESTAMPS: {
    format: 'ISO 8601',
    timezone: 'UTC',
    suffix: 'Z',
    transformation: 'firestore_timestamp_to_iso8601',
    validation: 'pattern_match',
    description: 'Convert Firestore Timestamp to ISO 8601 UTC format (YYYY-MM-DDTHH:MM:SS.sssZ)',
  },
  SUBCOLLECTIONS: {
    normalization: 'normalized_tables',
    method: 'one_to_many_fk',
    examples: {
      rfi_questions: 'engagement.rfi[].questions[] → separate rfi_question table with FK',
      rfi_responses: 'engagement.rfi[].questions[].responses[] → separate rfi_response table',
      review_highlights: 'engagement.reviews[].highlights[] → separate highlights table',
      messages: 'engagement.messages[] → separate messages table',
      checklists: 'engagement.checklists[].items[] → separate checklist_item table',
    },
  },
};

/**
 * Validation Framework Summary
 */
export const VALIDATORS = {
  1: {
    name: 'RowCountValidator',
    description: 'Verify source and target record counts match',
    acceptance_criteria: '100% match or documented variance',
  },
  2: {
    name: 'ReferentialIntegrityValidator',
    description: 'Verify all FK relationships intact, no orphaned records',
    acceptance_criteria: 'Zero orphaned records found',
  },
  3: {
    name: 'DataTypeValidator',
    description: 'Verify all field type conversions correct',
    acceptance_criteria: 'All fields match expected SQLite types',
  },
  4: {
    name: 'PDFCoordinateValidator',
    description: 'CRITICAL: Verify coordinates preserved ±0 pixels',
    acceptance_criteria: 'Math.abs(source - target) === 0 for 100% of coordinates',
    critical: true,
  },
  5: {
    name: 'TimestampValidator',
    description: 'Verify all timestamps in UTC ISO 8601 format',
    acceptance_criteria: 'All match pattern YYYY-MM-DDTHH:MM:SS.sssZ',
  },
  6: {
    name: 'FilePathValidator',
    description: 'Verify file paths updated and files exist',
    acceptance_criteria: '100% of paths point to existing files',
  },
  7: {
    name: 'JSONFieldValidator',
    description: 'Verify JSON fields contain valid JSON',
    acceptance_criteria: 'JSON.parse() succeeds for 100% of JSON fields',
  },
  8: {
    name: 'ForeignKeyConstraintValidator',
    description: 'Verify all SQLite FK constraints enforceable',
    acceptance_criteria: 'PRAGMA foreign_key_check returns zero violations',
  },
};

/**
 * Phase Summary
 */
export const PHASES = {
  '3.1': {
    name: 'Schema Analysis',
    duration: '2h',
    items: 8,
    status: 'COMPLETED',
  },
  '3.2': {
    name: 'Migration Scripts',
    duration: '15h',
    items: 11,
    status: 'IN_PROGRESS',
    blockedBy: ['3.1'],
  },
  '3.3': {
    name: 'Validation Framework',
    duration: '4h',
    items: 8,
    status: 'COMPLETED',
    blockedBy: ['3.1'],
    parallel_with: ['3.2'],
  },
  '3.4': {
    name: 'Sample Testing (1%)',
    duration: '3h',
    status: 'PENDING',
    blockedBy: ['3.2', '3.3'],
  },
  '3.5': {
    name: 'Pilot Testing (10%)',
    duration: '2h',
    status: 'PENDING',
    blockedBy: ['3.4'],
  },
  '3.6': {
    name: 'Full Migration (100%)',
    duration: '4h',
    status: 'PENDING',
    blockedBy: ['3.5'],
  },
  '3.7': {
    name: 'Verification',
    duration: '8h',
    items: 12,
    status: 'PENDING',
    blockedBy: ['3.6'],
  },
  '3.8': {
    name: 'Parallel Operations',
    duration: '3h',
    status: 'PENDING',
    blockedBy: ['3.7'],
  },
  '3.9': {
    name: 'Production Cutover',
    duration: '2h',
    status: 'PENDING',
    blockedBy: ['3.8'],
  },
  '3.10': {
    name: 'Post-Migration Support',
    duration: '4h',
    status: 'PENDING',
    blockedBy: ['3.9'],
  },
};

/**
 * Success Criteria
 */
export const SUCCESS_CRITERIA = [
  '100% row count match (zero data loss)',
  '100% referential integrity (no orphans)',
  'PDF coordinates preserved ±0 pixels',
  'User deduplication 100% accurate',
  'All timestamps UTC normalized',
  'Zero crashes or corruption',
  'Performance p95 <500ms @ 100K records',
];

export default {
  MIGRATION_CONFIG,
  MIGRATION_STATUS,
  VALIDATOR_STATUS,
  MIGRATION_ORDER,
  TRANSFORMATION_RULES,
  VALIDATORS,
  PHASES,
  SUCCESS_CRITERIA,
};
