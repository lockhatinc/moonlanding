import { getDatabaseService } from '@/lib/database-service';
import { emailService } from '@/services/email-service';

export async function executeWeeklyChecklistEmails() {
  const db = getDatabaseService();
  let emailsSent = 0;
  let emailsFailed = 0;

  try {
    const users = db.querySync('SELECT DISTINCT u.id, u.email, u.name FROM user u WHERE u.status = ? ORDER BY u.id', ['active']);

    for (const user of users) {
      try {
        const checklistItems = db.querySync(`
          SELECT DISTINCT ci.checklist_id, c.name, c.description, c.review_id
          FROM checklist_item ci
          JOIN checklist c ON ci.checklist_id = c.id
          WHERE ci.assigned_to = ? OR c.email_checklist = true
          ORDER BY c.created_at DESC
          LIMIT 10
        `, [user.id]);

        if (checklistItems.length === 0) continue;

        const checklistMap = new Map();
        for (const item of checklistItems) {
          if (!checklistMap.has(item.checklist_id)) {
            checklistMap.set(item.checklist_id, {
              id: item.checklist_id,
              name: item.name,
              description: item.description,
              review_id: item.review_id,
              items: []
            });
          }
        }

        for (const checklistId of checklistMap.keys()) {
          const items = db.querySync('SELECT * FROM checklist_item WHERE checklist_id = ? ORDER BY "order"', [checklistId]);
          checklistMap.get(checklistId).items = items;
        }

        const checklists = Array.from(checklistMap.values());
        const { html, text } = emailService.renderWeeklyChecklistEmail(user, checklists);

        await emailService.send(user.email, 'Weekly Checklist Summary', html, text);
        emailsSent++;
      } catch (err) {
        console.error(`[Weekly Checklist] Error sending to ${user.email}:`, err.message);
        emailsFailed++;
      }
    }

    const logEntry = {
      timestamp: new Date(),
      total_jobs: 1,
      executed_jobs: 1,
      failed_jobs: emailsFailed > 0 ? 1 : 0,
      duration_ms: Date.now(),
      status: emailsFailed === 0 ? 'success' : 'partial_failure',
      error_details: emailsFailed > 0 ? `Failed to send ${emailsFailed} emails` : null
    };

    db.insertSync('job_execution_log', logEntry);
    console.log(`[Weekly Checklist] Completed: ${emailsSent} sent, ${emailsFailed} failed`);

    return { success: true, emailsSent, emailsFailed };
  } catch (err) {
    console.error('[Weekly Checklist] Job error:', err);
    db.insertSync('job_execution_log', {
      timestamp: new Date(),
      total_jobs: 1,
      executed_jobs: 0,
      failed_jobs: 1,
      duration_ms: 0,
      status: 'error',
      error_details: err.message
    });
    throw err;
  }
}
