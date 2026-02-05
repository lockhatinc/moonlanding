/**
 * User Deduplication: Handle 10-15% email-based overlap
 *
 * This module handles matching and merging users from Friday and MyWorkReview
 * that share the same email address. Maintains ID mapping for referential integrity.
 */

/**
 * User deduplication engine
 */
export class UserDeduplicator {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    this.mapping = new Map(); // firebase_id → moonlanding_id
    this.deduplicatedCount = 0;
  }

  /**
   * Create the ID mapping table
   */
  createMappingTable() {
    this.logger?.log('Creating user_id_mapping table');

    this.db.exec(`
      DROP TABLE IF EXISTS user_id_mapping;
      CREATE TABLE user_id_mapping (
        firebase_id TEXT PRIMARY KEY,
        moonlanding_id TEXT NOT NULL,
        source TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        dedup_match INTEGER DEFAULT 0
      );
      CREATE INDEX idx_email ON user_id_mapping(email);
      CREATE INDEX idx_source ON user_id_mapping(source);
    `);

    this.logger?.log('user_id_mapping table created');
  }

  /**
   * Analyze existing users in Moonlanding
   * @returns {Object} Map of email → user data
   */
  analyzeExistingUsers() {
    this.logger?.log('Analyzing existing Moonlanding users');

    const users = this.db.prepare('SELECT id, email FROM users').all();
    const emailMap = new Map();

    users.forEach(user => {
      if (user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        emailMap.set(normalizedEmail, {
          id: user.id,
          email: user.email,
          source: 'moonlanding',
        });
      }
    });

    this.logger?.log(`Found ${emailMap.size} unique emails in existing Moonlanding users`);
    return emailMap;
  }

  /**
   * Process Friday users - match with existing, deduplicate with MWR
   * @param {Array} fridayUsers - Users from Friday
   * @returns {Object} { newUsers, mappedUsers, stats }
   */
  processFridayUsers(fridayUsers) {
    this.logger?.log(`Processing ${fridayUsers.length} Friday users`);

    const existingEmails = this.analyzeExistingUsers();
    const newUsers = [];
    const mappedUsers = [];
    let deduplicatedCount = 0;

    const stats = {
      friday_total: fridayUsers.length,
      friday_new: 0,
      friday_deduplicated: 0,
      friday_errors: 0,
    };

    fridayUsers.forEach(user => {
      try {
        if (!user.id || !user.email) {
          stats.friday_errors++;
          this.logger?.warn(`Friday user missing id or email: ${JSON.stringify(user)}`);
          return;
        }

        const normalizedEmail = user.email.toLowerCase().trim();

        // Check if email exists in Moonlanding
        if (existingEmails.has(normalizedEmail)) {
          // Deduplicate: use existing user
          const existing = existingEmails.get(normalizedEmail);
          this.mapping.set(user.id, existing.id);
          mappedUsers.push({
            firebase_id: user.id,
            moonlanding_id: existing.id,
            source: 'friday',
            email: normalizedEmail,
            dedup_match: 1,
          });
          deduplicatedCount++;
          stats.friday_deduplicated++;
        } else {
          // New user: add to Moonlanding
          newUsers.push({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'collaborator',
            type: user.type || 'external',
            phone: user.phone,
            created_at: user.created_at,
            updated_at: user.updated_at,
            source: 'friday',
          });
          this.mapping.set(user.id, user.id);
          mappedUsers.push({
            firebase_id: user.id,
            moonlanding_id: user.id,
            source: 'friday',
            email: normalizedEmail,
            dedup_match: 0,
          });
          stats.friday_new++;
        }
      } catch (err) {
        stats.friday_errors++;
        this.logger?.error(`Error processing Friday user ${user.id}`, err);
      }
    });

    this.logger?.log(`Friday users processed: ${stats.friday_new} new, ${stats.friday_deduplicated} deduplicated, ${stats.friday_errors} errors`);
    return { newUsers, mappedUsers, stats };
  }

  /**
   * Process MyWorkReview users - match with existing or Friday
   * @param {Array} mwrUsers - Users from MyWorkReview
   * @returns {Object} { newUsers, mappedUsers, stats }
   */
  processMWRUsers(mwrUsers, fridayMapping) {
    this.logger?.log(`Processing ${mwrUsers.length} MyWorkReview users`);

    const existingEmails = this.analyzeExistingUsers();
    const newUsers = [];
    const mappedUsers = [];
    let deduplicatedCount = 0;

    const stats = {
      mwr_total: mwrUsers.length,
      mwr_new: 0,
      mwr_deduplicated_existing: 0,
      mwr_deduplicated_friday: 0,
      mwr_errors: 0,
    };

    mwrUsers.forEach(user => {
      try {
        if (!user.id || !user.email) {
          stats.mwr_errors++;
          this.logger?.warn(`MWR user missing id or email: ${JSON.stringify(user)}`);
          return;
        }

        const normalizedEmail = user.email.toLowerCase().trim();

        // Check if this email was in Friday (already mapped)
        const fridayMatch = fridayMapping.find(m =>
          m.email === normalizedEmail && m.source === 'friday'
        );

        if (fridayMatch) {
          // Deduplicate with Friday user
          this.mapping.set(user.id, fridayMatch.moonlanding_id);
          mappedUsers.push({
            firebase_id: user.id,
            moonlanding_id: fridayMatch.moonlanding_id,
            source: 'mwr',
            email: normalizedEmail,
            dedup_match: 1,
          });
          stats.mwr_deduplicated_friday++;
        } else if (existingEmails.has(normalizedEmail)) {
          // Deduplicate with existing Moonlanding user
          const existing = existingEmails.get(normalizedEmail);
          this.mapping.set(user.id, existing.id);
          mappedUsers.push({
            firebase_id: user.id,
            moonlanding_id: existing.id,
            source: 'mwr',
            email: normalizedEmail,
            dedup_match: 1,
          });
          stats.mwr_deduplicated_existing++;
        } else {
          // New user
          newUsers.push({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'collaborator',
            type: user.type || 'external',
            phone: user.phone,
            created_at: user.created_at,
            updated_at: user.updated_at,
            source: 'mwr',
          });
          this.mapping.set(user.id, user.id);
          mappedUsers.push({
            firebase_id: user.id,
            moonlanding_id: user.id,
            source: 'mwr',
            email: normalizedEmail,
            dedup_match: 0,
          });
          stats.mwr_new++;
        }
      } catch (err) {
        stats.mwr_errors++;
        this.logger?.error(`Error processing MWR user ${user.id}`, err);
      }
    });

    this.logger?.log(`MWR users processed: ${stats.mwr_new} new, ${stats.mwr_deduplicated_friday} deduplicated with Friday, ${stats.mwr_deduplicated_existing} deduplicated with existing, ${stats.mwr_errors} errors`);
    return { newUsers, mappedUsers, stats };
  }

  /**
   * Save mapping to database
   * @param {Array} mappings - Mapping records
   */
  saveMappings(mappings) {
    this.logger?.log(`Saving ${mappings.length} user ID mappings`);

    const stmt = this.db.prepare(`
      INSERT INTO user_id_mapping
      (firebase_id, moonlanding_id, source, email, created_at, dedup_match)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let saved = 0;
    mappings.forEach(mapping => {
      try {
        stmt.run(
          mapping.firebase_id,
          mapping.moonlanding_id,
          mapping.source,
          mapping.email,
          new Date().toISOString(),
          mapping.dedup_match
        );
        saved++;
      } catch (err) {
        this.logger?.error(`Failed to save mapping ${mapping.firebase_id}`, err);
      }
    });

    this.logger?.log(`Saved ${saved}/${mappings.length} mappings`);
  }

  /**
   * Get mapped user ID (handles both new and deduplicated)
   * @param {string} firebaseId - Original Firebase user ID
   * @returns {string} Mapped Moonlanding user ID
   */
  getMappedUserId(firebaseId) {
    return this.mapping.get(firebaseId) || firebaseId;
  }

  /**
   * Verify deduplication by checking email uniqueness
   * @returns {Object} Verification results
   */
  verifyDeduplication() {
    this.logger?.log('Verifying user deduplication');

    const result = {
      total_users: 0,
      unique_emails: 0,
      duplicate_emails: [],
      duplicates_count: 0,
    };

    const users = this.db.prepare('SELECT id, email FROM users').all();
    const emailMap = new Map();

    result.total_users = users.length;

    users.forEach(user => {
      if (user.email) {
        const normalized = user.email.toLowerCase().trim();
        if (!emailMap.has(normalized)) {
          emailMap.set(normalized, []);
        }
        emailMap.get(normalized).push(user.id);
      }
    });

    result.unique_emails = emailMap.size;

    // Find duplicates (should be none after dedup)
    emailMap.forEach((ids, email) => {
      if (ids.length > 1) {
        result.duplicate_emails.push({
          email,
          count: ids.length,
          ids,
        });
        result.duplicates_count += ids.length;
      }
    });

    const deducedMetrics = {
      deduplication_rate: result.total_users > 0
        ? ((result.total_users - result.unique_emails) / result.total_users * 100).toFixed(2) + '%'
        : '0%',
      expected_rate: '10-15%',
      status: result.duplicate_emails.length === 0 ? 'PASS' : 'FAIL',
    };

    this.logger?.log(`Deduplication verification: ${result.unique_emails}/${result.total_users} unique emails`);
    if (result.duplicate_emails.length > 0) {
      this.logger?.warn(`Found ${result.duplicate_emails.length} duplicate email groups`);
    }

    return { ...result, ...deducedMetrics };
  }

  /**
   * Update foreign keys after user deduplication
   * Tables to update: engagements, reviews, messages, collaborators, activity_log, permissions
   */
  updateForeignKeys() {
    this.logger?.log('Updating foreign keys with deduplicated user IDs');

    const tables = [
      { table: 'engagements', field: 'user_id' },
      { table: 'reviews', field: 'reviewer_id' },
      { table: 'messages', field: 'user_id' },
      { table: 'collaborators', field: 'user_id' },
      { table: 'activity_log', field: 'user_id' },
      { table: 'permissions', field: 'user_id' },
      { table: 'rfi_response', field: 'user_id' },
    ];

    let totalUpdated = 0;

    tables.forEach(({ table, field }) => {
      try {
        // Get all records that might need updating
        const records = this.db.prepare(`
          SELECT id, ${field} FROM ${table} WHERE ${field} IS NOT NULL
        `).all();

        records.forEach(record => {
          const mappedId = this.getMappedUserId(record[field]);
          if (mappedId !== record[field]) {
            this.db.prepare(`
              UPDATE ${table} SET ${field} = ? WHERE id = ?
            `).run(mappedId, record.id);
            totalUpdated++;
          }
        });

        this.logger?.log(`Updated ${table}.${field}: checked ${records.length} records`);
      } catch (err) {
        this.logger?.error(`Failed to update ${table}.${field}`, err);
      }
    });

    this.logger?.log(`Total foreign key updates: ${totalUpdated}`);
    return totalUpdated;
  }

  /**
   * Get comprehensive deduplication report
   */
  getReport() {
    return {
      mapping_count: this.mapping.size,
      timestamp: new Date().toISOString(),
      verification: this.verifyDeduplication(),
    };
  }
}

export default UserDeduplicator;
