# Manual Testing Guide: Tender Deadlines & Weekly Reporting

This guide provides step-by-step instructions to manually test the MWR tender deadline and weekly reporting system.

---

## Prerequisites

- Access to the application as a user with `partner` or `manager` role
- Database access for verification
- Access to email service (for email delivery testing)
- Ability to simulate/trigger scheduled jobs

---

## TEST 69: 7-Day Warning Notification

### Setup

1. **Create a Test Review with Tender Deadline**
   - Navigate to Reviews > Create Review
   - Fill in:
     - Name: "Test Tender Review 69"
     - Engagement: Select active engagement
     - Status: "Open"
   - Click Save

2. **Add Tender Information**
   - In the review, navigate to "Tender" section
   - Click "Add Tender"
   - Fill in:
     - Name: "7-Day Warning Test"
     - Type: "government"
     - Priority: "high"
     - Deadline: 8 days from today (e.g., if today is Dec 25, set Dec 33)
     - Estimated Value: 100,000

3. **Verify Configuration**
   - Check database:
     ```sql
     SELECT id, name, deadline, tender_status, priority_level
     FROM tender
     WHERE name = '7-Day Warning Test';
     ```
   - Verify `deadline` is exactly 8 days in future
   - Verify `tender_status = 'open'`

### Test Execution

**Option A: Wait for Automatic Job (Manual)**
1. Job runs daily at 09:00 UTC
2. Wait until next scheduled time
3. Check notification sent to your email

**Option B: Manually Trigger Job (For Testing)**
1. Server logs or admin panel: Manually run `daily_tender_notifications` job
   ```bash
   # If available in API:
   POST /api/jobs/run
   { "jobName": "daily_tender_notifications" }
   ```
2. Or trigger via Node.js console in dev environment

### Verification Steps

1. **Check Notification Created**
   ```sql
   SELECT * FROM notification
   WHERE type = 'tender_deadline_warning'
   AND created_at >= (SELECT max(created_at) FROM notification) - 300
   ORDER BY created_at DESC LIMIT 5;
   ```
   Expected: One notification row with:
   - `type = 'tender_deadline_warning'`
   - `recipient_id` = your user id
   - `content` contains "7 days"

2. **Check Email Queued**
   ```sql
   SELECT * FROM email
   WHERE subject LIKE '%tender%'
   AND subject LIKE '%7%'
   AND created_at >= datetime('now', '-5 minutes')
   ORDER BY created_at DESC LIMIT 1;
   ```
   Expected: Email record with:
   - `subject` contains "tender" and "7 days"
   - `recipient_email` = your email
   - `status = 'pending'`

3. **Check Activity Log**
   ```sql
   SELECT * FROM activity_log
   WHERE entity_type = 'tender'
   AND action = 'warning_sent'
   ORDER BY created_at DESC LIMIT 1;
   ```
   Expected: Log entry with message "7-day warning notification sent"

4. **Verify In-App Notification**
   - Refresh browser
   - Check notification bell icon
   - Click to view: Should see tender deadline warning

5. **Check Email Delivery**
   - Wait 5-10 minutes for email processing
   - Check email inbox
   - Subject should be: "Tender Deadline in 7 Days: 7-Day Warning Test"

### Expected Behavior

| Step | Expected Result | Status |
|------|-----------------|--------|
| Notification created | Row in `notification` table | ✅ |
| Email queued | Row in `email` with status=pending | ✅ |
| Activity logged | `activity_log` entry for warning | ✅ |
| In-app notification | Bell icon shows notification | ✅ |
| Email received | Email in inbox within 10 min | ✅ |
| Message content | Includes "7 days" and tender name | ✅ |

---

## TEST 70: Missed Deadline Auto-Close & Flag

### Setup - Part A: Test Missed Deadline Detection

1. **Create Review with Past Deadline**
   - Create new review: "Test Missed Deadline 70A"
   - Add tender with deadline 5 days ago (e.g., Dec 20)
   - Set `tender_status = 'open'`
   - Save

2. **Verify Initial State**
   ```sql
   SELECT id, deadline, tender_status, tender_flags
   FROM tender
   WHERE name = 'Test Missed Deadline 70A';
   ```
   Expected: `deadline < now()`, `tender_status = 'open'`, `tender_flags = NULL or []`

### Test Execution - Part A

1. **Trigger Auto-Close Job**
   - Run `daily_tender_missed` or `tender_auto_close` job
   - This typically runs at 10:00 UTC daily
   - Or manually trigger if available

2. **Verify Auto-Close**
   ```sql
   SELECT id, deadline, tender_status, tender_flags
   FROM tender
   WHERE name = 'Test Missed Deadline 70A';
   ```
   Expected:
   - `tender_status = 'closed'` (changed from 'open')
   - `tender_flags` contains 'missed'

3. **Check Activity Log**
   ```sql
   SELECT * FROM activity_log
   WHERE entity_type = 'tender'
   AND entity_id = (SELECT id FROM tender WHERE name = 'Test Missed Deadline 70A')
   ORDER BY created_at DESC LIMIT 3;
   ```
   Expected: Entries showing:
   - "Tender auto-closed due to expired deadline"
   - "Missed flag applied"

4. **Check Notification**
   ```sql
   SELECT * FROM notification
   WHERE type = 'tender_closed'
   AND entity_id = (SELECT id FROM tender WHERE name = 'Test Missed Deadline 70A');
   ```
   Expected: Notification with "Review deadline missed" message

### Setup - Part B: Test Exemption for Closed Reviews

1. **Create Closed Review with Past Deadline**
   - Create new review: "Test Closed Review 70B"
   - Add tender with deadline 5 days ago
   - Close the review: Change status to "Closed"
   - Save

2. **Verify Initial State**
   ```sql
   SELECT id, status, deadline, tender_status, tender_flags
   FROM review
   WHERE name = 'Test Closed Review 70B';
   ```
   Expected: `status = 'closed'`

### Test Execution - Part B

1. **Trigger Auto-Close Job**
   - Run the missed deadline job
   - Expected: Job should skip closed reviews

2. **Verify No "Missed" Flag Applied**
   ```sql
   SELECT tender_flags FROM review
   WHERE name = 'Test Closed Review 70B';
   ```
   Expected: `tender_flags` should NOT contain 'missed'
   Or: No modification should occur

3. **Check Activity Log**
   ```sql
   SELECT * FROM activity_log
   WHERE entity_type = 'review'
   AND entity_id = (SELECT id FROM review WHERE name = 'Test Closed Review 70B')
   AND action = 'flag_applied';
   ```
   Expected: No entries (or comment saying "review is closed, skipped")

### Setup - Part C: Test "Today" Deadline (No Flag Yet)

1. **Create Review with Today's Deadline**
   - Create review: "Test Today Deadline 70C"
   - Add tender with deadline = today at 23:59 UTC
   - Status: "Open"
   - Save

2. **Verify Initial State**
   ```sql
   SELECT id, deadline, tender_status, tender_flags
   FROM review
   WHERE name = 'Test Today Deadline 70C';
   ```
   Expected: `deadline = today`, `tender_flags` not marked as missed yet

### Test Execution - Part C

1. **Run Missed Deadline Job**
   - Should NOT apply missed flag yet
   - Deadline hasn't passed yet (it's today)

2. **Verify No Missed Flag**
   ```sql
   SELECT tender_flags FROM review
   WHERE name = 'Test Today Deadline 70C';
   ```
   Expected: No 'missed' flag

3. **Run Next Day (Post-Deadline)**
   - Advance system clock or wait until tomorrow
   - Run job again
   - Now it should apply missed flag

### Verification Summary

| Scenario | Expected Behavior | Verification |
|----------|-------------------|--------------|
| Deadline 5 days ago, open | Auto-close to closed, add 'missed' flag | ✅ |
| Deadline 5 days ago, closed | NO flag (exempted) | ✅ |
| Deadline today | NO flag yet (deadline hasn't passed) | ✅ |
| Deadline tomorrow (next day) | Flag applied after job runs | ✅ |

---

## TEST 71: Weekly Report Monday 8:00 AM

### Setup

1. **Create Test Reviews with Checklists**

   **Review A - Multiple Open Items**
   - Name: "Review A - 5 Open Items"
   - Create Checklist: "Quality Assurance"
   - Add 5 items:
     - Item 1: "Code Review" - assigned to manager1 - due Dec 27
     - Item 2: "Testing" - assigned to manager2 - due Dec 28
     - Item 3: "Documentation" - assigned to manager1 - due Dec 29
     - Item 4: "Security Review" - assigned to partner1 - due Dec 30
     - Item 5: "Deployment" - assigned to partner1 - due Dec 31
   - Mark items 1-3 as is_done = false (open)
   - Mark items 4-5 as is_done = true (done)

   **Review B - 2 Open Items**
   - Name: "Review B - 2 Open Items"
   - Create Checklist: "Final Review"
   - Add 2 items:
     - Item 1: "Signoff" - assigned to partner1
     - Item 2: "Archive" - assigned to clerk1
   - Mark as is_done = false

   **Review C - All Complete**
   - Name: "Review C - All Complete"
   - Create Checklist: "Completed"
   - Add 1 item: "Final Sign"
   - Mark as is_done = true

2. **Verify Database State**
   ```sql
   SELECT r.name, COUNT(ci.id) as total_items,
          SUM(CASE WHEN ci.is_done = 0 THEN 1 ELSE 0 END) as open_items
   FROM review r
   LEFT JOIN checklist c ON r.id = c.review_id
   LEFT JOIN checklist_item ci ON c.id = ci.checklist_id
   WHERE r.name LIKE 'Review%'
   GROUP BY r.id
   ORDER BY r.name;
   ```
   Expected:
   ```
   Review A - 5 Open Items     | 5  | 3
   Review B - 2 Open Items     | 2  | 2
   Review C - All Complete     | 1  | 0
   ```

### Test Execution

**Option A: Wait for Automatic Schedule**
1. Schedule runs Monday at 08:00 UTC
2. Wait until next Monday morning
3. Check for generated reports

**Option B: Manually Trigger (Recommended for Testing)**
1. Manually invoke job:
   ```bash
   POST /api/jobs/run
   { "jobName": "weekly_checklist_pdfs" }
   ```
2. Or in dev environment console

### Verification Steps

1. **Check PDF Generation Started**
   - Check server logs for: "Generating checklist PDF for partner"
   - Look for files created in `/tmp` or output directory

2. **Check Email Queue**
   ```sql
   SELECT id, recipient_email, subject, status, created_at
   FROM email
   WHERE subject LIKE '%checklist%'
   AND subject LIKE '%PDF%'
   AND created_at >= datetime('now', '-10 minutes')
   ORDER BY created_at DESC;
   ```
   Expected: One email per active partner with:
   - Subject like: "Weekly Review Status Report - [Date]"
   - Status: 'pending'
   - Has attachment reference

3. **Check Activity Log**
   ```sql
   SELECT * FROM activity_log
   WHERE action = 'pdf_generated'
   AND created_at >= datetime('now', '-10 minutes')
   ORDER BY created_at DESC LIMIT 5;
   ```
   Expected: Log entries for each PDF generated

4. **Verify Email Content**
   - After processing (5-10 minutes), check email inbox
   - Should have attachment: "Weekly_Checklist_Report_[Date].pdf"
   - Email should include:
     - List of open items
     - Assigned team members
     - Due dates
     - Review names

5. **Verify Report Content in PDF**
   - Download and open PDF
   - Should contain:
     - Review A: 3 open items (not 5 total)
     - Review B: 2 open items
     - Review C: Not listed (0 open items) OR listed as "Complete"
     - Section headers for each review
     - Proper formatting

### Expected Structure

The PDF should be formatted like:

```
WEEKLY REVIEW STATUS REPORT
Generated: Monday, December 25, 2025

REVIEW A: Quality Assurance
  Open Items: 3/5

  1. Code Review
     Assigned: Manager 1
     Due: Dec 27, 2025

  2. Testing
     Assigned: Manager 2
     Due: Dec 28, 2025

  3. Documentation
     Assigned: Manager 1
     Due: Dec 29, 2025

REVIEW B: Final Review
  Open Items: 2/2

  1. Signoff
     Assigned: Partner 1

  2. Archive
     Assigned: Clerk 1

REVIEW C: All Items Complete
  Status: All 1 items completed

Generated by Bidwise MWR System
```

### Verification Summary

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Job triggers Monday 08:00 UTC | Log shows job execution | ✅ |
| PDF generated for each review | Files created in output dir | ✅ |
| Email queued | Email records with status=pending | ✅ |
| Open items only | Review C (all done) not in list | ✅ |
| Item details included | Names, assignees, due dates | ✅ |
| Email sent | Email in inbox within 10 min | ✅ |
| PDF attachment | File attached to email | ✅ |
| Activity logged | Log entry for report_generated | ✅ |

---

## TEST 72: Email Distribution & Retry

### Setup

1. **Create 3 Reviews for Email Testing**
   - Review 72-A: "Email Test A"
   - Review 72-B: "Email Test B"
   - Review 72-C: "Email Test C"
   - Each with 2+ checklist items

2. **Configure Recipients**
   - Ensure at least 2 active partner users
   - Ensure email addresses are valid

### Test Execution - Part A: Normal Email Delivery

1. **Trigger PDF Report Generation**
   ```bash
   POST /api/jobs/run
   { "jobName": "weekly_checklist_pdfs" }
   ```

2. **Check Email Queue Before Processing**
   ```sql
   SELECT id, recipient_email, subject, status, retry_count
   FROM email
   WHERE subject LIKE '%checklist%'
   AND created_at >= datetime('now', '-5 minutes');
   ```
   Expected: Multiple rows with status='pending', retry_count=0

3. **Verify Rate Limiting**
   - Set expectations: 6 seconds between emails
   - With 2 partners × 3 reviews = up to 6 emails
   - Total time should be ~36 seconds

4. **Manually Run Email Queue Processing**
   ```bash
   POST /api/jobs/run
   { "jobName": "hourly_email_processing" }
   ```

5. **Check Email Status After Processing**
   ```sql
   SELECT id, recipient_email, status, retry_count, processed_at
   FROM email
   WHERE subject LIKE '%checklist%'
   ORDER BY processed_at DESC;
   ```
   Expected:
   - Status: 'processed' (successful) or 'failed' (with retries)
   - retry_count: 0 (if successful)
   - processed_at: Recent timestamp

6. **Verify In Inbox**
   - Check each recipient's email inbox
   - Should receive 1 PDF report per Monday
   - Contains checklist items and due dates

### Test Execution - Part B: Email Retry on Failure

1. **Simulate Email Send Failure**
   - Manually update email status to 'failed':
   ```sql
   UPDATE email
   SET status = 'failed',
       processing_error = 'Simulated SMTP timeout',
       retry_count = 0
   WHERE subject LIKE '%checklist%'
   LIMIT 1;
   ```

2. **Run Email Processing Job**
   - Run hourly job again
   - Expected: Job detects failed status and retries

3. **Verify Retry Attempt**
   ```sql
   SELECT id, status, retry_count, processing_error, updated_at
   FROM email
   WHERE subject LIKE '%checklist%'
   ORDER BY updated_at DESC LIMIT 1;
   ```
   Expected:
   - retry_count incremented (now = 1)
   - status might be 'processing' or back to 'failed' if still failing

4. **Test Max Retries (3 Attempts)**
   - Simulate failure again:
   ```sql
   UPDATE email
   SET status = 'failed', retry_count = 2
   WHERE subject LIKE '%checklist%' LIMIT 1;
   ```
   - Run job again
   - Check retry_count = 3 (final attempt)

5. **Verify Permanent Failure After Max Retries**
   ```sql
   SELECT status, retry_count FROM email
   WHERE retry_count >= 3
   AND subject LIKE '%checklist%';
   ```
   Expected: status='failed', retry_count=3 (no more retries)

### Test Execution - Part C: Bounce Detection

1. **Setup Bounce Scenario**
   - Create email to non-existent address:
   ```sql
   INSERT INTO email
   (id, sender_email, recipient_email, subject, body, status, created_at)
   VALUES
   (?, 'system@bidwise.app', 'bounced@invalid.local',
    'Test Bounce', 'Body', 'pending', strftime('%s', 'now'));
   ```

2. **Run Email Processing**
   - Process email with invalid recipient
   - Gmail API returns 550/551 bounce error

3. **Verify Bounce Handling**
   ```sql
   SELECT * FROM email
   WHERE recipient_email = 'bounced@invalid.local'
   AND processing_error LIKE '%bounce%';
   ```
   Expected:
   - status: 'bounced' (or 'failed' with bounce info)
   - Flag: bounce_permanent = 1
   - Excluded from retry queue

### Test Execution - Part D: Attachment Validation

1. **Check Email Attachment Field**
   ```sql
   SELECT id, subject, attachments
   FROM email
   WHERE subject LIKE '%checklist%'
   AND attachments IS NOT NULL
   LIMIT 1;
   ```
   Expected: JSON structure like:
   ```json
   [
     {
       "filename": "Weekly_Checklist_Report_2025-12-22.pdf",
       "url": "gs://storage/...pdf",
       "size_bytes": 45000,
       "mime_type": "application/pdf"
     }
   ]
   ```

2. **Verify PDF Link Works**
   - Extract URL from attachments JSON
   - Verify file exists and is valid PDF
   - Check file size > 10KB (not empty)

### Verification Summary

| Scenario | Expected Behavior | Verification |
|----------|-------------------|--------------|
| Normal delivery | Email sent, status=processed | ✅ |
| Rate limiting | 6s between emails maintained | ✅ |
| Transient failure | Auto-retry after delay | ✅ |
| Max retries | 3 attempts, then give up | ✅ |
| Permanent bounce | Skip retry, mark bounced | ✅ |
| Attachment included | PDF file in email | ✅ |
| Activity logged | Email send logged | ✅ |

---

## Quick Reference: Job Triggers

### Manual Job Execution (Development)

If available in your API or console:

```bash
# Tender warnings
POST /api/jobs/run?name=daily_tender_notifications

# Tender auto-close
POST /api/jobs/run?name=daily_tender_missed

# Weekly checklist PDF
POST /api/jobs/run?name=weekly_checklist_pdfs

# Email queue processing
POST /api/jobs/run?name=hourly_email_processing

# Or Node.js console:
const jobs = require('@/config/jobs');
await jobs.runJobByName('daily_tender_notifications');
```

### Expected Cron Schedule (Production)

| Job | Schedule | Time (UTC) |
|-----|----------|-----------|
| Tender notifications | 0 9 * * * | 09:00 daily |
| Tender auto-close | 0 10 * * * | 10:00 daily |
| Tender critical alerts | 0 * * * * | Every hour |
| Weekly checklist PDF | 0 8 * * 1 | Monday 08:00 |
| Weekly client emails | 0 9 * * 1 | Monday 09:00 |
| Email queue process | 0 * * * * | Every hour |

---

## Troubleshooting

### Issue: Email not received

**Checks:**
1. Is email queued?
   ```sql
   SELECT COUNT(*) FROM email WHERE status != 'processed';
   ```

2. Is processing job running?
   - Check logs for hourly_email_processing execution

3. Is rate limiting working?
   - Monitor logs for "Rate limited" messages
   - Check interval between sends: should be 6s

4. Is there a bounce?
   ```sql
   SELECT * FROM email WHERE status = 'bounced';
   ```

### Issue: Missed deadline flag not applied

**Checks:**
1. Is tender past deadline?
   ```sql
   SELECT deadline - strftime('%s', 'now') as seconds_remaining
   FROM tender WHERE id = ?;
   ```
   Should be negative.

2. Is review open?
   ```sql
   SELECT status FROM review WHERE id = ?;
   ```
   Should be 'open' (unless testing exemption)

3. Did job run?
   - Check logs for daily_tender_missed execution
   - Check timestamp in activity log

### Issue: PDF not generated

**Checks:**
1. Are checklists present?
   ```sql
   SELECT COUNT(*) FROM checklist WHERE review_id IN (SELECT id FROM review);
   ```

2. Are items open?
   ```sql
   SELECT COUNT(*) FROM checklist_item WHERE is_done = 0;
   ```

3. Are partners active?
   ```sql
   SELECT COUNT(*) FROM users WHERE role = 'partner' AND status = 'active';
   ```

---

## Test Cleanup

After testing, clean up test data:

```sql
-- Delete test emails
DELETE FROM email WHERE subject LIKE 'Test%' OR subject LIKE '%Checklist%';

-- Delete test notifications
DELETE FROM notification WHERE entity_id IN
  (SELECT id FROM review WHERE name LIKE 'Test%');

-- Delete test reviews
DELETE FROM review WHERE name LIKE 'Test%' OR name LIKE 'Review%';

-- Verify cleanup
SELECT COUNT(*) FROM review WHERE name LIKE 'Test%';
SELECT COUNT(*) FROM email WHERE subject LIKE 'Test%';
```

---

## Success Criteria

All tests pass when:

1. ✅ Tender warnings sent 7 days before deadline
2. ✅ Missed deadline flags applied automatically
3. ✅ Closed reviews exempt from missed flag
4. ✅ Weekly PDFs generated Monday 08:00 UTC
5. ✅ Open items only in PDF (complete items excluded)
6. ✅ Emails distributed with proper formatting
7. ✅ Attachments included in emails
8. ✅ Retry logic works (up to 3 attempts)
9. ✅ Bounce detection implemented
10. ✅ Activity logged for all operations

---

**Document Version:** 1.0
**Last Updated:** 2025-12-25
**Status:** Ready for Testing
