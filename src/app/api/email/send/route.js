import { NextResponse } from 'next/server';
import { getDatabase, now } from '@/lib/database-core';
import { sendEmail } from '@/adapters/google-gmail';
import { EMAIL_STATUS } from '@/config/constants';
import { config } from '@/config/env';

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 6000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email address required' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

function validateEmailData(emailRecord) {
  const errors = [];

  const recipientValidation = validateEmail(emailRecord.recipient_email);
  if (!recipientValidation.valid) {
    errors.push(`Recipient: ${recipientValidation.error}`);
  }

  const senderValidation = validateEmail(emailRecord.sender_email);
  if (!senderValidation.valid) {
    errors.push(`Sender: ${senderValidation.error}`);
  }

  if (emailRecord.sender_email && config.email.from && emailRecord.sender_email !== config.email.from) {
    errors.push(`Sender email (${emailRecord.sender_email}) does not match configured email (${config.email.from})`);
  }

  if (!emailRecord.subject || emailRecord.subject.trim() === '') {
    errors.push('Subject cannot be empty');
  }

  if (!emailRecord.body && !emailRecord.html_body) {
    errors.push('Email must have either body or html_body');
  }

  return errors;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exponentialBackoff(attempt) {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  await sleep(delay);
}

function parseAttachments(attachmentsJson) {
  if (!attachmentsJson) return [];
  try {
    const attachments = typeof attachmentsJson === 'string' ? JSON.parse(attachmentsJson) : attachmentsJson;
    return Array.isArray(attachments) ? attachments : [];
  } catch (e) {
    console.error('[EMAIL] Failed to parse attachments:', e.message);
    return [];
  }
}

async function sendSingleEmail(db, emailRecord, attempt = 1) {
  const validationErrors = validateEmailData(emailRecord);
  if (validationErrors.length > 0) {
    const errorMsg = validationErrors.join('; ');
    console.error('[EMAIL] Validation failed:', { id: emailRecord.id, errors: errorMsg });

    db.prepare(`
      UPDATE email
      SET status = ?,
          processing_error = ?,
          retry_count = ?,
          updated_at = ?
      WHERE id = ?
    `).run(EMAIL_STATUS.FAILED, errorMsg, attempt, now(), emailRecord.id);

    logActivity(db, emailRecord.id, 'email_send_failed', { error: errorMsg, attempt });

    return { success: false, error: errorMsg, emailId: emailRecord.id };
  }

  try {
    const attachments = parseAttachments(emailRecord.attachments);

    const emailData = {
      to: emailRecord.recipient_email,
      from: emailRecord.sender_email || config.email.from,
      subject: emailRecord.subject,
      body: emailRecord.body,
      html: emailRecord.html_body,
      cc: emailRecord.cc,
      bcc: emailRecord.bcc,
      attachments,
    };

    if (emailRecord.in_reply_to) {
      emailData.inReplyTo = emailRecord.in_reply_to;
    }
    if (emailRecord.references) {
      emailData.references = emailRecord.references;
    }

    console.log('[EMAIL] Sending email:', { id: emailRecord.id, to: emailData.to, subject: emailData.subject, attempt });

    const result = await sendEmail(emailData);

    db.prepare(`
      UPDATE email
      SET status = ?,
          processed = ?,
          message_id = ?,
          processing_error = NULL,
          retry_count = ?,
          processed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(EMAIL_STATUS.PROCESSED, true, result.id || result.messageId, attempt, now(), now(), emailRecord.id);

    logActivity(db, emailRecord.id, 'email_sent', {
      messageId: result.id || result.messageId,
      to: emailData.to,
      attempt
    });

    console.log('[EMAIL] Email sent successfully:', { id: emailRecord.id, messageId: result.id || result.messageId });

    return { success: true, messageId: result.id || result.messageId, emailId: emailRecord.id };
  } catch (error) {
    console.error('[EMAIL] Send error:', { id: emailRecord.id, error: error.message, attempt });

    const isRateLimitError = error.message?.includes('429') || error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('rate limit');
    const isBounceError = error.message?.includes('550') || error.message?.includes('551') || error.message?.toLowerCase().includes('no such user') || error.message?.toLowerCase().includes('user unknown') || error.message?.toLowerCase().includes('mailbox not found');
    const isPermanentError = error.message?.includes('400') || error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('not found') || isBounceError;

    if (isPermanentError || attempt >= MAX_RETRIES) {
      const bounceStatus = isBounceError ? 'bounced' : EMAIL_STATUS.FAILED;
      db.prepare(`
        UPDATE email
        SET status = ?,
            processing_error = ?,
            retry_count = ?,
            bounce_reason = ?,
            bounced_at = ?,
            bounce_permanent = ?,
            updated_at = ?
        WHERE id = ?
      `).run(bounceStatus, error.message, attempt, isBounceError ? error.message : null, isBounceError ? now() : null, isBounceError ? 1 : 0, now(), emailRecord.id);

      logActivity(db, emailRecord.id, 'email_send_failed', {
        error: error.message,
        attempt,
        permanent: isPermanentError,
        maxRetriesReached: attempt >= MAX_RETRIES
      });

      return { success: false, error: error.message, emailId: emailRecord.id, permanent: isPermanentError };
    }

    if (isRateLimitError) {
      await exponentialBackoff(attempt);
    }

    db.prepare(`
      UPDATE email
      SET retry_count = ?,
          processing_error = ?,
          updated_at = ?
      WHERE id = ?
    `).run(attempt, error.message, now(), emailRecord.id);

    return sendSingleEmail(db, emailRecord, attempt + 1);
  }
}

function logActivity(db, emailId, action, metadata = {}) {
  try {
    db.prepare(`
      INSERT INTO activity_log (id, entity_type, entity_id, action, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
      'email',
      emailId,
      action,
      JSON.stringify(metadata),
      now()
    );
  } catch (e) {
    console.error('[EMAIL] Failed to log activity:', e.message);
  }
}

function checkFailureRate(db) {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed
      FROM email
      WHERE created_at >= ?
    `).get(EMAIL_STATUS.FAILED, now() - 86400);

    if (stats.total > 0) {
      const failureRate = stats.failed / stats.total;
      if (failureRate > 0.5 && stats.total > 10) {
        console.warn('[EMAIL] HIGH FAILURE RATE ALERT:', {
          failureRate: `${(failureRate * 100).toFixed(1)}%`,
          failed: stats.failed,
          total: stats.total,
          period: 'last 24 hours'
        });
      }
    }
  } catch (e) {
    console.error('[EMAIL] Failed to check failure rate:', e.message);
  }
}

export async function POST(request) {
  const db = getDatabase();

  try {
    const pendingEmails = db.prepare(`
      SELECT * FROM email
      WHERE status = ?
        AND (retry_count IS NULL OR retry_count < ?)
      ORDER BY created_at ASC
      LIMIT ?
    `).all(EMAIL_STATUS.PENDING, MAX_RETRIES, BATCH_SIZE);

    if (pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending emails',
        processed: 0
      });
    }

    console.log('[EMAIL] Processing batch:', { count: pendingEmails.length });

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < pendingEmails.length; i++) {
      const email = pendingEmails[i];

      db.prepare(`
        UPDATE email
        SET status = ?,
            updated_at = ?
        WHERE id = ?
      `).run(EMAIL_STATUS.PROCESSING, now(), email.id);

      const result = await sendSingleEmail(db, email, email.retry_count || 1);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      if (i < pendingEmails.length - 1) {
        await sleep(RATE_LIMIT_DELAY);
      }
    }

    checkFailureRate(db);

    console.log('[EMAIL] Batch completed:', {
      total: pendingEmails.length,
      success: successCount,
      failed: failureCount
    });

    return NextResponse.json({
      success: true,
      processed: pendingEmails.length,
      results: {
        success: successCount,
        failed: failureCount,
      },
      details: results,
    });

  } catch (error) {
    console.error('[EMAIL] Queue processing error:', error);
    return NextResponse.json(
      { error: 'Email queue processing failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const db = getDatabase();

  try {
    const stats = db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM email
      GROUP BY status
    `).all();

    const failureStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed
      FROM email
      WHERE created_at >= ?
    `).get(EMAIL_STATUS.FAILED, now() - 86400);

    const recentFailures = db.prepare(`
      SELECT id, recipient_email, subject, processing_error, retry_count, created_at
      FROM email
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(EMAIL_STATUS.FAILED);

    return NextResponse.json({
      stats: stats.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      failureRate: failureStats.total > 0 ? (failureStats.failed / failureStats.total) : 0,
      recentFailures,
    });

  } catch (error) {
    console.error('[EMAIL] Stats query error:', error);
    return NextResponse.json(
      { error: 'Failed to get email stats', details: error.message },
      { status: 500 }
    );
  }
}
