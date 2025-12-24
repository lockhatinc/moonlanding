export const EMAIL_TEMPLATES = {
  engagement_created: (context) => ({
    subject: `New Engagement: ${context.record?.title || 'Untitled'}`,
    body: `A new engagement has been created. Details: Title: ${context.record?.title}, Created: ${new Date().toISOString()}`,
    html: `<p>A new engagement has been created.</p><p><strong>${context.record?.title}</strong></p>`,
  }),

  engagement_updated: (context) => ({
    subject: `Engagement Updated: ${context.record?.title || 'Untitled'}`,
    body: `Engagement has been updated.`,
    html: `<p>Engagement has been updated.</p>`,
  }),

  engagement_info_gathering: (context) => ({
    subject: `New Engagement: ${context.engagement?.name || 'Untitled'}`,
    body: `Engagement: ${context.engagement?.name}\nClient: ${context.client?.name}\nYear: ${context.year}\nType: ${context.engagement_type}`,
    html: `<h2>New Engagement: ${context.engagement?.name}</h2><ul><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Client:</strong> ${context.client?.name}</li><li><strong>Year:</strong> ${context.year}</li><li><strong>Type:</strong> ${context.engagement_type}</li></ul><p><a href="${context.engagement_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Engagement</a></p>`,
  }),

  engagement_commencement: (context) => ({
    subject: `Engagement Commenced: ${context.engagement?.name || 'Untitled'}`,
    body: `Engagement: ${context.engagement?.name}\nClient: ${context.client?.name}\nDate: ${context.commencement_date}`,
    html: `<h2>Engagement Commenced: ${context.engagement?.name}</h2><ul><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Client:</strong> ${context.client?.name}</li><li><strong>Date:</strong> ${context.commencement_date}</li></ul><p><a href="${context.engagement_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Engagement</a></p>`,
  }),

  engagement_finalization: (context) => ({
    subject: `Engagement Complete: ${context.engagement?.name || 'Untitled'}`,
    body: `Engagement: ${context.engagement?.name}\nClient: ${context.client?.name}\nYear: ${context.year}`,
    html: `<h2>Engagement Complete: ${context.engagement?.name}</h2><ul><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Client:</strong> ${context.client?.name}</li><li><strong>Year:</strong> ${context.year}</li></ul><p><a href="${context.engagement_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">Rate Engagement</a></p>`,
  }),

  engagement_stage_change: (context) => ({
    subject: `Stage Changed: ${context.engagement?.name || 'Untitled'}`,
    body: `Engagement: ${context.engagement?.name}\nFrom: ${context.from_stage}\nTo: ${context.to_stage}`,
    html: `<h2>Stage Changed: ${context.engagement?.name}</h2><ul><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>From:</strong> ${context.from_stage}</li><li><strong>To:</strong> ${context.to_stage}</li></ul><p><a href="${context.engagement_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Engagement</a></p>`,
  }),

  engagement_date_change: (context) => ({
    subject: `Date Updated: ${context.engagement?.name || 'Untitled'}`,
    body: `Engagement: ${context.engagement?.name}\nField: ${context.field}\nNew Date: ${context.new_date}`,
    html: `<h2>Date Updated: ${context.engagement?.name}</h2><ul><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Field:</strong> ${context.field}</li><li><strong>New Date:</strong> ${context.new_date}</li></ul><p><a href="${context.engagement_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Engagement</a></p>`,
  }),

  review_created: (context) => ({
    subject: `New Review: ${context.review?.name || 'Untitled'}`,
    body: `Review: ${context.review?.name}\nTeam: ${context.team_name}\nYear: ${context.financial_year}\nCreated By: ${context.created_by}`,
    html: `<h2>New Review: ${context.review?.name}</h2><ul><li><strong>Review:</strong> ${context.review?.name}</li><li><strong>Team:</strong> ${context.team_name}</li><li><strong>Year:</strong> ${context.financial_year}</li><li><strong>Created By:</strong> ${context.created_by}</li></ul><p><a href="${context.review_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Review</a></p>`,
  }),

  review_assigned: (context) => ({
    subject: `Review Assigned: ${context.record?.title || 'Untitled'}`,
    body: `You have been assigned to review this item.`,
    html: `<p>You have been assigned to a review.</p>`,
  }),

  review_status_change: (context) => ({
    subject: `Review Status: ${context.review?.name || 'Untitled'}`,
    body: `Review: ${context.review?.name}\nFrom: ${context.from_status}\nTo: ${context.to_status}`,
    html: `<h2>Review Status: ${context.review?.name}</h2><ul><li><strong>Review:</strong> ${context.review?.name}</li><li><strong>From:</strong> ${context.from_status}</li><li><strong>To:</strong> ${context.to_status}</li></ul><p><a href="${context.review_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Review</a></p>`,
  }),

  rfi_deadline: (context) => ({
    subject: `RFI Deadline: ${context.engagement?.name || 'Untitled'}`,
    body: `Question: ${context.question}\nEngagement: ${context.engagement?.name}\nDeadline: ${context.deadline}\nDays Until: ${context.daysUntil}`,
    html: `<h2>RFI Deadline: ${context.engagement?.name}</h2><ul><li><strong>Question:</strong> ${context.question}</li><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Deadline:</strong> ${context.deadline}</li><li><strong>Days Until:</strong> ${context.daysUntil}</li></ul><p><a href="${context.rfi_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View RFI</a></p>`,
  }),

  rfi_status_change: (context) => ({
    subject: `RFI Status: ${context.engagement?.name || 'Untitled'}`,
    body: `Question: ${context.question}\nFrom: ${context.from_status}\nTo: ${context.to_status}`,
    html: `<h2>RFI Status: ${context.engagement?.name}</h2><ul><li><strong>Question:</strong> ${context.question}</li><li><strong>From:</strong> ${context.from_status}</li><li><strong>To:</strong> ${context.to_status}</li></ul><p><a href="${context.rfi_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View RFI</a></p>`,
  }),

  rfi_deadline_change: (context) => ({
    subject: `RFI Deadline Changed: ${context.engagement?.name || 'Untitled'}`,
    body: `Question: ${context.question}\nNew Deadline: ${context.new_deadline}`,
    html: `<h2>RFI Deadline Changed: ${context.engagement?.name}</h2><ul><li><strong>Question:</strong> ${context.question}</li><li><strong>New Deadline:</strong> ${context.new_deadline}</li></ul><p><a href="${context.rfi_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View RFI</a></p>`,
  }),

  rfi_response: (context) => ({
    subject: `New RFI Response: ${context.engagement?.name || 'Untitled'}`,
    body: `Question: ${context.question}\nResponded By: ${context.responded_by}`,
    html: `<h2>New RFI Response: ${context.engagement?.name}</h2><ul><li><strong>Question:</strong> ${context.question}</li><li><strong>Responded By:</strong> ${context.responded_by}</li></ul><p><a href="${context.rfi_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Response</a></p>`,
  }),

  rfi_reminder: (context) => ({
    subject: `RFI Reminder: ${context.engagement?.name || 'Untitled'}`,
    body: `Question: ${context.question}\nEngagement: ${context.engagement?.name}\nDays Outstanding: ${context.days_outstanding}`,
    html: `<h2>RFI Reminder: ${context.engagement?.name}</h2><ul><li><strong>Question:</strong> ${context.question}</li><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Days Outstanding:</strong> ${context.days_outstanding}</li></ul><p><a href="${context.rfi_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">Respond</a></p>`,
  }),

  rfi_escalation: (context) => ({
    subject: `ESCALATION: RFI Outstanding ${context.daysOutstanding} Days - ${context.engagement?.name || 'Untitled'}`,
    body: `RFI has been outstanding for ${context.daysOutstanding} days.\n\nQuestion: ${context.rfi?.question}\nEngagement: ${context.engagement?.name}\nClient: ${context.client?.name}\nDate Requested: ${context.rfi?.date_requested}\nDays Outstanding: ${context.daysOutstanding}`,
    html: `<h2 style="color:#dc2626">ESCALATION: RFI Outstanding ${context.daysOutstanding} Days</h2><p>This RFI requires immediate attention.</p><ul><li><strong>Question:</strong> ${context.rfi?.question}</li><li><strong>Engagement:</strong> ${context.engagement?.name}</li><li><strong>Client:</strong> ${context.client?.name}</li><li><strong>Date Requested:</strong> ${context.rfi?.date_requested}</li><li><strong>Days Outstanding:</strong> ${context.daysOutstanding}</li></ul><p><a href="${context.rfi_url}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:4px">View RFI</a></p>`,
  }),

  collaborator_added: (context) => ({
    subject: `Collaborator Access: ${context.review?.name || 'Untitled'}`,
    body: `Review: ${context.review?.name}\nType: ${context.access_type}\nExpires: ${context.expires_at}\nAdded By: ${context.added_by}`,
    html: `<h2>Collaborator Access: ${context.review?.name}</h2><ul><li><strong>Review:</strong> ${context.review?.name}</li><li><strong>Type:</strong> ${context.access_type}</li><li><strong>Expires:</strong> ${context.expires_at}</li><li><strong>Added By:</strong> ${context.added_by}</li></ul><p><a href="${context.review_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Review</a></p>`,
  }),

  collaborator_expiry_7day_warning: (context) => ({
    subject: `Review Collaboration Access Expiring in 7 Days - ${context.review_name || 'Review'}`,
    body: `Hello ${context.collaborator_name},\n\nYour collaboration access to the review "${context.review_name}" will expire in 7 days on ${context.expires_date}.\n\nPlease complete any outstanding work before your access is automatically revoked.\n\nReview: ${context.review_name}\nExpires: ${context.expires_date}\n\nIf you need extended access, please contact the review owner.`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#f59e0b;margin-bottom:20px">Collaboration Access Expiring Soon</h2>
        <p>Hello <strong>${context.collaborator_name}</strong>,</p>
        <p>Your collaboration access to the review <strong>"${context.review_name}"</strong> will expire in <strong>7 days</strong> on <strong>${context.expires_date}</strong>.</p>
        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0">
          <p style="margin:0;color:#92400e">
            <strong>Action Required:</strong> Please complete any outstanding work before your access is automatically revoked.
          </p>
        </div>
        <div style="background:#f9fafb;padding:15px;border-radius:8px;margin:20px 0">
          <p style="margin:5px 0"><strong>Review:</strong> ${context.review_name}</p>
          <p style="margin:5px 0"><strong>Access Expires:</strong> ${context.expires_date}</p>
        </div>
        <p style="margin:20px 0">
          <a href="${context.review_url}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
            View Review
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;margin-top:30px;border-top:1px solid #e5e7eb;padding-top:15px">
          If you need extended access, please contact the review owner.
        </p>
      </div>
    `,
  }),

  tender_deadline_7days: (context) => ({
    subject: `Tender Deadline in 7 Days: ${context.review?.name || 'Untitled'}`,
    body: `Review: ${context.review?.name}\nDeadline: ${context.deadline}\nTeam: ${context.team_name}`,
    html: `<h2>Tender Deadline in 7 Days: ${context.review?.name}</h2><ul><li><strong>Review:</strong> ${context.review?.name}</li><li><strong>Deadline:</strong> ${context.deadline}</li><li><strong>Team:</strong> ${context.team_name}</li></ul><p><a href="${context.review_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Review</a></p>`,
  }),

  tender_deadline_today: (context) => ({
    subject: `URGENT: Tender Due Today: ${context.review?.name || 'Untitled'}`,
    body: `Review: ${context.review?.name}\nDeadline: ${context.deadline}`,
    html: `<h2>URGENT: Tender Due Today: ${context.review?.name}</h2><ul><li><strong>Review:</strong> ${context.review?.name}</li><li><strong>Deadline:</strong> ${context.deadline}</li></ul><p><a href="${context.review_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Review</a></p>`,
  }),

  client_signup: (context) => ({
    subject: 'Welcome to the Client Portal',
    body: `Your account: ${context.email}\nSet Password: ${context.password_reset_url}`,
    html: `<h2>Welcome!</h2><p>Your account: ${context.email}</p><p><a href="${context.password_reset_url}">Set Password</a></p>`,
  }),

  password_reset: (context) => ({
    subject: 'Password Reset Request',
    body: `Reset Password: ${context.reset_url}`,
    html: `<h2>Password Reset</h2><p><a href="${context.reset_url}">Reset Password</a></p>`,
  }),

  weekly_checklist_pdf: (context) => ({
    subject: `Weekly Checklist Report - ${context.date}`,
    body: `Report Date: ${context.date}`,
    html: `<h2>Weekly Checklist Report</h2><p>Report Date: ${context.date}</p>`,
  }),

  weekly_client_engagement: (context) => ({
    subject: `Weekly Summary: ${context.client?.name || 'Client'}`,
    body: `Client: ${context.client?.name}\nEngagements: ${context.engagement_count}`,
    html: `<h2>Weekly Summary: ${context.client?.name}</h2><ul><li><strong>Client:</strong> ${context.client?.name}</li><li><strong>Engagements:</strong> ${context.engagement_count}</li></ul><p><a href="${context.portal_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Portal</a></p>`,
  }),

  weekly_client_master: (context) => ({
    subject: 'Weekly Master Summary',
    body: `Total Engagements: ${context.total_engagements}\nOutstanding RFIs: ${context.total_outstanding_rfis}`,
    html: `<h2>Weekly Master Summary</h2><ul><li><strong>Total Engagements:</strong> ${context.total_engagements}</li><li><strong>Outstanding RFIs:</strong> ${context.total_outstanding_rfis}</li></ul><p><a href="${context.portal_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Portal</a></p>`,
  }),

  daily_digest: (context) => ({
    subject: `Daily Summary - ${context.date}`,
    body: `Date: ${context.date}\nNotifications: ${(context.notifications || []).length}`,
    html: `<h2>Daily Summary</h2><p>${context.date}</p><p>${(context.notifications || []).length} notifications</p>`,
  }),

  bug_report: (context) => ({
    subject: `Bug Report: ${context.summary}`,
    body: `${context.summary}\n${context.details}`,
    html: `<h2>Bug Report</h2><pre>${context.summary}\n${context.details}</pre>`,
  }),
};
