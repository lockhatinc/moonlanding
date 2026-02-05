/**
 * Migration Orchestrator
 *
 * Coordinates the complete data migration process:
 * - Manages transactions
 * - Executes migrations in dependency order
 * - Runs validators
 * - Handles errors and rollback
 * - Produces comprehensive reports
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { UserDeduplicator } from './user-dedup.js';
import {
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
import { MasterValidator } from './validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration Orchestrator - Master controller
 */
export class MigrationOrchestrator {
  constructor(targetDbPath, logger) {
    this.targetDbPath = targetDbPath;
    this.logger = logger;
    this.db = null;
    this.sourceDb = null;
    this.deduplicator = null;
    this.migrationStats = {};
    this.backupPath = null;
  }

  /**
   * Initialize database connections
   */
  initialize() {
    this.logger?.log('Initializing database connections...');

    try {
      this.db = new Database(this.targetDbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('busy_timeout = 5000');
      this.db.pragma('synchronous = NORMAL');

      // Start with FK off, turn on after migration
      this.db.pragma('foreign_keys = OFF');

      this.logger?.log('✓ Target database connected');
    } catch (err) {
      throw new Error(`Failed to initialize database: ${err.message}`);
    }
  }

  /**
   * Create backup before migration
   */
  createBackup(label = 'pre-migration') {
    this.logger?.log(`Creating backup: ${label}`);

    const backupDir = path.join(path.dirname(this.targetDbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupName = `app-${label}-${Date.now()}.db`;
    this.backupPath = path.join(backupDir, backupName);

    try {
      fs.copyFileSync(this.targetDbPath, this.backupPath);
      this.logger?.log(`✓ Backup created: ${this.backupPath}`);
      return this.backupPath;
    } catch (err) {
      throw new Error(`Backup failed: ${err.message}`);
    }
  }

  /**
   * Execute complete migration
   */
  async executeMigration(sourceData) {
    this.logger?.log('========== STARTING MIGRATION ORCHESTRATOR ==========');

    try {
      this.initialize();
      this.createBackup('pre-migration');

      // Start transaction
      this.logger?.log('Beginning transaction...');
      this.db.exec('BEGIN TRANSACTION');

      // Phase 1: User Deduplication (prerequisite for all)
      await this.migrateUsers(sourceData.users);

      // Phase 2: Core entities (no dependencies on others)
      await this.migrateClients(sourceData.clients);

      // Phase 3: Engagements (depends on clients)
      await this.migrateEngagements(sourceData.engagements);

      // Phase 4: Engagement-related entities (depends on engagements)
      await this.migrateRFIs(sourceData.rfis);
      await this.migrateReviews(sourceData.reviews);
      await this.migrateMessages(sourceData.messages);
      await this.migrateCollaborators(sourceData.collaborators);
      await this.migrateChecklists(sourceData.checklists);

      // Phase 5: Support data (can be parallel)
      await this.migrateFiles(sourceData.files);
      await this.migrateActivityLogs(sourceData.activityLogs);
      await this.migratePermissions(sourceData.permissions);

      // Commit transaction
      this.logger?.log('Committing transaction...');
      this.db.exec('COMMIT');
      this.logger?.log('✓ Transaction committed');

      // Post-migration setup
      this.enableForeignKeys();

      // Run validators
      const validationResults = await this.validateMigration();

      // Generate report
      const report = this.generateReport(validationResults);

      this.logger?.log('========== MIGRATION ORCHESTRATOR COMPLETE ==========');
      return report;

    } catch (error) {
      this.logger?.error('Migration failed - rolling back', error);
      try {
        this.db.exec('ROLLBACK');
        this.logger?.log('✓ Rollback completed');
      } catch (rbErr) {
        this.logger?.error('Rollback failed', rbErr);
      }
      throw error;
    }
  }

  /**
   * Enable foreign key constraints (after migration)
   */
  enableForeignKeys() {
    this.logger?.log('Enabling foreign key constraints...');
    this.db.pragma('foreign_keys = ON');
    this.logger?.log('✓ Foreign keys enabled');
  }

  /**
   * Migrate users with deduplication
   */
  async migrateUsers(users) {
    this.logger?.log('\n--- MIGRATING USERS ---');

    try {
      // Create deduplicator
      this.deduplicator = new UserDeduplicator(this.db, this.logger);
      this.deduplicator.createMappingTable();

      // Process Friday users
      const fridayUsers = users.filter(u => u.source === 'friday');
      const { newUsers: fridayNew, mappedUsers: fridayMapped, stats: fridayStats } =
        this.deduplicator.processFridayUsers(fridayUsers);

      // Save Friday mappings
      this.deduplicator.saveMappings(fridayMapped);

      // Process MyWorkReview users
      const mwrUsers = users.filter(u => u.source === 'mwr');
      const { newUsers: mwrNew, mappedUsers: mwrMapped, stats: mwrStats } =
        this.deduplicator.processMWRUsers(mwrUsers, fridayMapped);

      // Save MWR mappings
      this.deduplicator.saveMappings(mwrMapped);

      // Insert new users
      const allNewUsers = [...fridayNew, ...mwrNew];
      this.logger?.log(`Inserting ${allNewUsers.length} new users...`);

      const userStmt = this.db.prepare(`
        INSERT INTO users
        (id, email, name, role, type, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      allNewUsers.forEach(user => {
        userStmt.run(
          user.id,
          user.email,
          user.name,
          user.role,
          user.type,
          user.phone,
          user.created_at,
          user.updated_at
        );
      });

      // Verify deduplication
      const dedupVerification = this.deduplicator.verifyDeduplication();
      this.migrationStats.users = {
        friday: fridayStats,
        mwr: mwrStats,
        deduplication: dedupVerification,
      };

      this.logger?.log(`✓ Users migrated: ${allNewUsers.length} new, ${fridayStats.friday_deduplicated + mwrStats.mwr_deduplicated_friday + mwrStats.mwr_deduplicated_existing} deduplicated`);

      return this.deduplicator;

    } catch (err) {
      this.logger?.error('User migration failed', err);
      throw err;
    }
  }

  /**
   * Migrate clients
   */
  async migrateClients(clients) {
    this.logger?.log('\n--- MIGRATING CLIENTS ---');

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO clients
        (id, name, status, created_at)
        VALUES (?, ?, ?, ?)
      `);

      clients.forEach(client => {
        stmt.run(
          client.id,
          client.name,
          client.status || 'active',
          client.created_at
        );
      });

      this.logger?.log(`✓ Migrated ${clients.length} clients`);
      this.migrationStats.clients = { count: clients.length };

    } catch (err) {
      this.logger?.error('Client migration failed', err);
      throw err;
    }
  }

  /**
   * Migrate engagements
   */
  async migrateEngagements(engagements) {
    this.logger?.log('\n--- MIGRATING ENGAGEMENTS ---');

    const migrator = new EngagementMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(engagements);
    this.migrationStats.engagements = stats;
    this.logger?.log(`✓ ${stats.migrated} engagements migrated`);
  }

  /**
   * Migrate RFIs
   */
  async migrateRFIs(rfis) {
    this.logger?.log('\n--- MIGRATING RFIs (with questions/responses) ---');

    const migrator = new RFIMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(rfis);
    this.migrationStats.rfis = stats;
    this.logger?.log(`✓ ${stats.migrated} RFIs with questions/responses migrated`);
  }

  /**
   * Migrate reviews
   */
  async migrateReviews(reviews) {
    this.logger?.log('\n--- MIGRATING REVIEWS (with highlights) ---');

    const migrator = new ReviewMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(reviews);
    this.migrationStats.reviews = stats;
    this.logger?.log(`✓ ${stats.migrated} reviews with highlights migrated`);
  }

  /**
   * Migrate messages
   */
  async migrateMessages(messages) {
    this.logger?.log('\n--- MIGRATING MESSAGES ---');

    const migrator = new MessageMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(messages);
    this.migrationStats.messages = stats;
    this.logger?.log(`✓ ${stats.migrated} messages migrated`);
  }

  /**
   * Migrate collaborators
   */
  async migrateCollaborators(collaborators) {
    this.logger?.log('\n--- MIGRATING COLLABORATORS ---');

    const migrator = new CollaboratorMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(collaborators);
    this.migrationStats.collaborators = stats;
    this.logger?.log(`✓ ${stats.migrated} collaborators migrated`);
  }

  /**
   * Migrate checklists
   */
  async migrateChecklists(checklists) {
    this.logger?.log('\n--- MIGRATING CHECKLISTS (with items) ---');

    const migrator = new ChecklistMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(checklists);
    this.migrationStats.checklists = stats;
    this.logger?.log(`✓ ${stats.migrated} checklists with items migrated`);
  }

  /**
   * Migrate files
   */
  async migrateFiles(files) {
    this.logger?.log('\n--- MIGRATING FILES ---');

    const migrator = new FileMigrator(this.db, null, this.logger, this.deduplicator);
    const sourcePath = '/home/user/lexco/friday-staging';
    const targetPath = '/home/user/lexco/moonlanding';
    const stats = migrator.migrate(files, sourcePath, targetPath);
    this.migrationStats.files = stats;
    this.logger?.log(`✓ ${stats.migrated} files migrated`);
  }

  /**
   * Migrate activity logs
   */
  async migrateActivityLogs(logs) {
    this.logger?.log('\n--- MIGRATING ACTIVITY LOGS ---');

    const migrator = new ActivityLogMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(logs);
    this.migrationStats.activityLogs = stats;
    this.logger?.log(`✓ ${stats.migrated} activity logs migrated`);
  }

  /**
   * Migrate permissions
   */
  async migratePermissions(permissions) {
    this.logger?.log('\n--- MIGRATING PERMISSIONS ---');

    const migrator = new PermissionMigrator(this.db, null, this.logger, this.deduplicator);
    const stats = migrator.migrate(permissions);
    this.migrationStats.permissions = stats;
    this.logger?.log(`✓ ${stats.migrated} permissions migrated`);
  }

  /**
   * Validate migration
   */
  async validateMigration() {
    this.logger?.log('\n========== RUNNING VALIDATORS ==========');

    const validator = new MasterValidator(this.db, null, this.logger);
    const results = await validator.runAll();

    return results;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(validationResults) {
    return {
      timestamp: new Date().toISOString(),
      status: validationResults?.overall_status === 'PASS' ? 'SUCCESS' : 'PARTIAL',
      migration_stats: this.migrationStats,
      validation_results: validationResults,
      backup_path: this.backupPath,
    };
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) this.db.close();
    if (this.sourceDb) this.sourceDb.close();
  }

  /**
   * Cleanup after migration
   */
  cleanup() {
    this.logger?.log('Cleaning up resources...');
    this.close();
    this.logger?.log('✓ Cleanup complete');
  }
}

export default MigrationOrchestrator;
