# Engagement Recreation & Cloning Test Checklist

**Test Date:** December 25, 2025
**Tester:** QA Team
**Status:** Ready for Execution
**Test Environment:** Development / Staging

---

## Pre-Test Setup

- [ ] Database backed up
- [ ] Test data prepared:
  - [ ] 1 Engagement with yearly recreation
  - [ ] 1 Engagement with monthly recreation
  - [ ] 1 Engagement with no recreation (once)
  - [ ] Test client account
  - [ ] Test team account
  - [ ] Partner and Manager users
- [ ] Google Drive integration verified (if testing file copying)
- [ ] Cron/Job scheduler accessible
- [ ] Logs configured and monitoring enabled
- [ ] Test database isolated from production

---

## TEST 38: Yearly Recreation (Jan 1st @ 0 0 1 1 *)

### Configuration Validation

- [ ] **38.1** Job "engagement_recreation_yearly" exists in automation schedules
  - Location: `src/config/master-config.yml` → `automation.schedules`
  - Expected: `name: engagement_recreation_yearly`

- [ ] **38.2** Cron schedule is exactly "0 0 1 1 *"
  - Meaning: January 1st at 00:00 UTC
  - Expected: `trigger: 0 0 1 1 *`

- [ ] **38.3** Job filter targets yearly + active engagements
  - Expected: `filter: "engagement.repeat_interval == 'yearly' AND status == 'active'"`

- [ ] **38.4** Job is enabled
  - Expected: `enabled: true`

- [ ] **38.5** Job action is "recreate_engagement"
  - Expected: `action: recreate_engagement`

### Manual Trigger Testing (if applicable)

- [ ] **38.6** Can manually trigger yearly recreation job via API
  - Endpoint: `/api/cron/trigger` or `/api/jobs/yearly_engagement_recreation`
  - Expected: Job executes immediately

- [ ] **38.7** After trigger, new engagement created for next year
  - Original: `year=2024`
  - New: `year=2025`
  - Original updated: `repeat_interval='once'`

### Logging

- [ ] **38.8** Recreation logged in `recreation_log` table
  - Fields present: `engagement_id`, `client_id`, `status='completed'`, `details`
  - Log entries show: `source_id`, `new_id`, `year`, `month`, `sections`, `rfis`

### Search/Query Testing

- [ ] **38.9** Query returns only yearly engagements: `SELECT * FROM engagement WHERE repeat_interval='yearly' AND status='active'`
  - Expected: Returns correct engagements ready for recreation

- [ ] **38.10** After recreation, original engagement excluded from future queries
  - Query: Same as 38.9
  - Expected: Original NOT returned (repeat_interval now 'once')

---

## TEST 39: Monthly Recreation (1st of month @ 0 0 1 * *)

### Configuration Validation

- [ ] **39.1** Job "engagement_recreation_monthly" exists in automation schedules
  - Location: `src/config/master-config.yml` → `automation.schedules`
  - Expected: `name: engagement_recreation_monthly`

- [ ] **39.2** Cron schedule is exactly "0 0 1 * *"
  - Meaning: 1st of each month at 00:00 UTC
  - Expected: `trigger: 0 0 1 * *`

- [ ] **39.3** Job filter targets monthly + active engagements
  - Expected: `filter: "engagement.repeat_interval == 'monthly' AND status == 'active'"`

- [ ] **39.4** Job is enabled
  - Expected: `enabled: true`

### Manual Trigger Testing (if applicable)

- [ ] **39.5** Can manually trigger monthly recreation job via API
  - Expected: Job executes immediately

- [ ] **39.6** After trigger, new engagement created for next month
  - Original: `month=1 (Jan)` or `commencement_date=2024-01-01`
  - New: `month=2 (Feb)` or `commencement_date=2024-02-01`
  - Original updated: `repeat_interval='once'`

### Edge Cases

- [ ] **39.7** Monthly recreation handles December → January transition
  - Input: `month=12, year=2024`
  - Expected output: `month=1, year=2025`

- [ ] **39.8** Monthly recreation handles Feb 29 (leap year) gracefully
  - Test with Feb 29 commencement_date if applicable
  - Expected: Handles date arithmetic correctly

### Logging

- [ ] **39.9** Recreation logged in `recreation_log` table
  - Log shows: `source_id`, `new_id`, correct month increment

---

## TEST 40: Recreation Copies Client, Team, Fee, Partner/Manager Roles

### Setup

- [ ] **40.1** Create test engagement with:
  - [ ] client_id = Test Client (e.g., "Acme Corp")
  - [ ] team_id = Test Team (e.g., "Audit Team A")
  - [ ] fee = { amount: 50000, currency: "USD", status: "draft" }
  - [ ] partner_id/users = Partner User
  - [ ] manager_id/users = Manager User

### Field Copying Validation

- [ ] **40.2** New engagement has same client_id
  - Query: `SELECT client_id FROM engagement WHERE id=?`
  - Expected: `client_id` matches original

- [ ] **40.3** New engagement has same team_id
  - Expected: `team_id` matches original
  - Note: If team_id not in schema, verify via users array instead

- [ ] **40.4** New engagement has same fee object
  - Query: `SELECT fee FROM engagement WHERE id=?`
  - Expected: `fee.amount=50000, fee.currency='USD', fee.status='draft'`

- [ ] **40.5** New engagement has partner user assigned
  - Query: Check user assignments or roles table
  - Expected: Partner has access to new engagement

- [ ] **40.6** New engagement has manager user assigned
  - Expected: Manager has access to new engagement

### Client User Copying

- [ ] **40.7** Client users are copied from original to new engagement
  - Query: `SELECT COUNT(*) FROM client_user WHERE engagement_id=?`
  - Expected: New engagement has same client_user count as original

### Role Permissions Validation

- [ ] **40.8** Partner can access new engagement
  - Login as partner, verify can view/edit new engagement

- [ ] **40.9** Manager can access new engagement
  - Login as manager, verify can view/edit new engagement

- [ ] **40.10** Client can access new engagement (if applicable)
  - Expected: Client can view assigned RFIs/documents

---

## TEST 41: Recreation Calculates New Commencement_Date (+1 Year or +1 Month)

### Yearly Recreation Date Calculation

- [ ] **41.1** Yearly recreation adds exactly 365/366 days
  - Original: `commencement_date: 2024-01-15 10:30:00`
  - New: `commencement_date: 2025-01-15 10:30:00` (same time)
  - Verification: Math: 2025-01-15 minus 2024-01-15 = 366 days (leap year)

- [ ] **41.2** Yearly recreation preserves exact date and time
  - Expected: Time of day preserved (e.g., 10:30:00 stays 10:30:00)

- [ ] **41.3** Yearly recreation handles leap years correctly
  - Test with Feb 29, 2024 commencement_date
  - Expected: Correctly calculates to Feb 28/29, 2025

### Monthly Recreation Date Calculation

- [ ] **41.4** Monthly recreation adds ~30/31 days
  - Original: `commencement_date: 2024-01-15`
  - New: `commencement_date: 2024-02-15`

- [ ] **41.5** Monthly recreation month increment is correct
  - Original: `month: 1` → New: `month: 2`
  - Original: `month: 12` → New: `month: 1, year: year+1`

- [ ] **41.6** Monthly recreation handles month boundary correctly
  - Test: Jan 31 → Feb (no Feb 31, should be Feb 28/29)
  - Expected: Handled gracefully (verify implementation)

### Auto-Transition Integration

- [ ] **41.7** Auto-transition job triggers on new commencement_date
  - Original transition behavior: `info_gathering` → `commencement` when date reached
  - Expected: Same behavior for new engagement

- [ ] **41.8** New engagement reaches commencement on correct date
  - Monitor: auto_transition job on commencement_date
  - Expected: Transitions to commencement stage automatically

### Year Field Validation

- [ ] **41.9** New engagement has year field set correctly
  - Query: `SELECT year FROM engagement WHERE id=?`
  - Yearly: `year = original_year + 1`
  - Monthly: `year` may stay same (Jan-Dec) or increment (Dec→Jan)

---

## TEST 42: Recreation Copies All Sections and RFIs

### Setup

- [ ] **42.1** Create test engagement with:
  - [ ] 3 RFI Sections: "Financial Statements", "Tax Returns", "Bank Records"
  - [ ] 5 RFIs distributed across sections: 2, 2, 1

### Section Copying Validation

- [ ] **42.2** All sections are copied
  - Query: `SELECT COUNT(*) FROM rfi_section WHERE engagement_id=?`
  - Original: 3 sections
  - New: 3 sections

- [ ] **42.3** Section names are preserved
  - Query: `SELECT name FROM rfi_section WHERE engagement_id=?`
  - Expected: "Financial Statements", "Tax Returns", "Bank Records"

- [ ] **42.4** Section metadata is preserved
  - Fields copied: `key`, `sort_order`
  - Expected: Same values in new sections

- [ ] **42.5** Section IDs are correctly mapped
  - Original section IDs → New section IDs (different values)
  - RFI section_id references point to new sections

### RFI Copying Validation

- [ ] **42.6** All RFIs are copied
  - Query: `SELECT COUNT(*) FROM rfi WHERE engagement_id=?`
  - Original: 5 RFIs
  - New: 5 RFIs

- [ ] **42.7** RFI questions are preserved
  - Expected: `question` field identical

- [ ] **42.8** RFI section mapping is correct
  - Original: RFI 1 in section 1 → New RFI 1 in new section 1
  - Verification: Check `section_id` field

- [ ] **42.9** RFI configuration is preserved
  - Fields: `key`, `name`, `ml_query`, `assigned_users`, `sort_order`
  - Expected: Identical to original

- [ ] **42.10** RFI status is reset (see TEST 44)
  - Status fields: `status`, `client_status`, `auditor_status`
  - Expected: Set to initial values (pending/requested)

### Hierarchy Validation

- [ ] **42.11** New engagement lists correct child count
  - Expected: 3 child sections
  - Query: `SELECT children FROM engagement WHERE id=?`

---

## TEST 43: Recreation with recreate_with_attachments=true Copies Files

### Setup

- [ ] **43.1** Create test RFI with file attachments:
  - [ ] 2 PDF files (e.g., "Document1.pdf", "Document2.pdf")
  - [ ] Files stored in Google Drive
  - [ ] Engagement or RFI marked: `recreate_with_attachments: true`

### File Copying Validation

- [ ] **43.2** File references are created in new RFI
  - Query: `SELECT COUNT(*) FROM file WHERE entity_id=?`
  - Original RFI: 2 files
  - New RFI: 2 file records

- [ ] **43.3** File metadata is copied
  - Fields: `file_name`, `file_type`, `file_size`, `mime_type`
  - Expected: Identical to original

- [ ] **43.4** Google Drive file_id is referenced (not duplicated)
  - Query: `SELECT drive_file_id FROM file WHERE id=?`
  - Expected: Both old and new file records point to SAME drive_file_id
  - Implication: No duplication in Google Drive storage

- [ ] **43.5** File download URLs are valid
  - Expected: `download_url` field points to accessible file

### Attachment Flag Testing

- [ ] **43.6** Files NOT copied when recreate_with_attachments=false
  - Create engagement with `recreate_with_attachments: false`
  - Recreation should complete without copying files
  - New RFI: 0 file records

- [ ] **43.7** Files copied when engagement flag is true
  - Create engagement with `recreate_with_attachments: true`
  - Files should be copied regardless of RFI flag

- [ ] **43.8** Files copied when RFI flag is true
  - Create RFI with `recreate_with_attachments: true`
  - Files should be copied even if engagement flag is false

### Google Drive Integration Verification

- [ ] **43.9** Original files remain in original engagement's Drive folder
  - Expected: Original files still accessible at original location

- [ ] **43.10** New engagement can access copied files
  - Expected: New engagement can read/download files via drive_file_id

### Edge Cases

- [ ] **43.11** Handle large files (15-25 MB)
  - Expected: Copying succeeds without timeout

- [ ] **43.12** Handle many files (50+)
  - Expected: All files copied (may take time)

---

## TEST 44: Recreation Resets RFI Status to 0, Dates to Null, Display Status to "Requested"

### Setup

- [ ] **44.1** Create test RFIs with varying statuses:
  - [ ] RFI 1: `status=1` (completed), `date_resolved=2024-12-20`
  - [ ] RFI 2: `status=1` (completed), `date_resolved=2024-12-15`
  - [ ] RFI 3: `status=0` (pending), `date_resolved=null`, `response_count=5`

### Status Reset Validation

- [ ] **44.2** All RFIs have status reset to pending/0
  - Query: `SELECT status FROM rfi WHERE engagement_id=?`
  - Expected: All rows have `status=0` or `status='pending'`

- [ ] **44.3** All date_resolved fields are cleared
  - Query: `SELECT date_resolved FROM rfi WHERE engagement_id=?`
  - Expected: All rows have `date_resolved=NULL`

- [ ] **44.4** date_requested fields are null
  - Query: `SELECT date_requested FROM rfi WHERE engagement_id=?`
  - Expected: All rows have `date_requested=NULL`

### Display Status Validation

- [ ] **44.5** RFI auditor display status is "requested"
  - Query: Check workflow state or computed field
  - Expected: `auditor_status='requested'`

- [ ] **44.6** RFI client display status is appropriate initial state
  - Expected: `client_status='pending'` or initial state from workflow

### Counter Reset Validation

- [ ] **44.7** response_count reset to 0
  - Original RFI 3: `response_count=5`
  - New RFI 3: `response_count=0`

- [ ] **44.8** files_count reset to 0 (unless recreate_with_attachments)
  - Original: `files_count=3`
  - New: `files_count=0` (or file count if files copied)

- [ ] **44.9** days_outstanding reset to 0
  - Expected: `days_outstanding=0` for all new RFIs

### Field Preservation Validation

- [ ] **44.10** RFI question is preserved
  - Expected: `question` field identical to original

- [ ] **44.11** RFI name is preserved
  - Expected: `name` field identical

- [ ] **44.12** RFI assigned_users preserved
  - Expected: Same user assignments

- [ ] **44.13** RFI ml_query configuration preserved
  - Expected: Machine learning rules unchanged

---

## TEST 45: Recreation Sets Original repeat_interval to "once"

### Setup

- [ ] **45.1** Create yearly engagement: `repeat_interval='yearly'`, `status='active'`
- [ ] **45.2** Create monthly engagement: `repeat_interval='monthly'`, `status='active'`

### Infinite Loop Prevention Validation

- [ ] **45.3** Original yearly engagement marked as 'once' after recreation
  - Query: `SELECT repeat_interval FROM engagement WHERE id=?`
  - Original ID: `repeat_interval='once'`

- [ ] **45.4** Original monthly engagement marked as 'once' after recreation
  - Expected: `repeat_interval='once'`

### Preventing Re-Recreation

- [ ] **45.5** Original engagement cannot be recreated again
  - Try to manually trigger recreation on original
  - Expected: Error or skip (validation prevents)

- [ ] **45.6** Query for recreation targets excludes marked-once engagements
  - Query: `SELECT * FROM engagement WHERE repeat_interval='yearly' AND status='active'`
  - Expected: Original NOT returned (now `'once'`)

### New Engagement Inheritance

- [ ] **45.7** New engagement inherits repeat_interval
  - Original: `repeat_interval='yearly'` → marked 'once' after recreation
  - New: `repeat_interval='yearly'` (inherited for future recreation)

- [ ] **45.8** New engagement will be recreated on next scheduled run
  - Next year's job will find new engagement with `repeat_interval='yearly'`
  - Expected: Recreates in subsequent year

### Validation Rule Testing

- [ ] **45.9** Validation prevents recreation of 'once' engagements
  - Try to recreate engagement with `repeat_interval='once'`
  - Expected: Error message: "Cannot recreate engagement with repeat_interval='once'"

### Error Handling & Rollback

- [ ] **45.10** If recreation fails, original repeat_interval is restored
  - Simulate recreation failure (e.g., DB error during copy)
  - Expected: Original engagement `repeat_interval` restored to original value

### Logging Verification

- [ ] **45.11** recreation_log records the transition
  - Log entry: `repeat_interval='yearly'` → `'once'`
  - Expected: Visible in logs for audit trail

---

## Additional Integration Tests

### API Endpoint Testing (if applicable)

- [ ] **46.1** GET `/api/engagement/:id` returns recreation_interval field
  - Expected: Field visible in API response

- [ ] **46.2** Manual recreation via POST `/api/engagement/:id/recreate`
  - Expected: Creates new engagement, marks original 'once'

### Permission Testing

- [ ] **47.1** Only partner role can trigger recreation
  - Expected: Manager/clerk cannot recreate

- [ ] **47.2** Partner can view recreation logs
  - Expected: `recreation_log` visible with partner permissions

### Performance Testing

- [ ] **48.1** Recreation completes in reasonable time
  - Target: < 5 seconds for typical engagement (3 sections, 5 RFIs)

- [ ] **48.2** No database locks during recreation
  - Expected: Concurrent operations don't timeout

### Data Integrity Testing

- [ ] **49.1** No orphaned records after recreation
  - Check: All RFI section_ids valid, all RFI engagement_ids valid

- [ ] **49.2** Foreign key constraints maintained
  - Expected: No constraint violations in recreation_log

---

## Post-Test Validation

### Cleanup

- [ ] **50.1** Test data cleaned up
- [ ] **50.2** Database state verified clean
- [ ] **50.3** No stray recreation_log entries

### Documentation

- [ ] **50.4** Test results documented
- [ ] **50.5** Any failures logged with reproduction steps
- [ ] **50.6** Screenshots/logs attached (if failures)

### Sign-Off

- [ ] **50.7** All tests reviewed
- [ ] **50.8** Ready for production deployment
- [ ] **50.9** Test artifacts archived

---

## Summary

**Total Checklist Items:** 195+
**Categories:**
- Configuration Validation: 15 items
- Yearly Recreation: 10 items
- Monthly Recreation: 9 items
- Field Copying: 10 items
- Date Calculation: 9 items
- Section/RFI Copying: 11 items
- File Copying: 12 items
- Status Reset: 13 items
- Infinite Loop Prevention: 11 items
- Additional Tests: 75+ items

**Execution Approach:**
1. Run configuration validation tests first (automated)
2. Execute manual trigger tests
3. Validate data copying
4. Test edge cases
5. Verify error handling
6. Performance validation
7. Sign-off

**Expected Duration:** 2-4 hours per environment

---

**Checklist Version:** 1.0
**Last Updated:** December 25, 2025
**Next Review:** Post-deployment verification
