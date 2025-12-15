export const templates = {
  rfiReminder: ({ clientName, engagementName, rfiQuestion, deadline, portalUrl }) => ({
    subject: `RFI Reminder: ${engagementName}`,
    body: `Dear ${clientName},\n\nThis is a reminder regarding the following request for information:\n\nEngagement: ${engagementName}\nQuestion: ${rfiQuestion}\nDeadline: ${deadline}\n\nPlease respond at your earliest convenience via the client portal:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>This is a reminder regarding the following request for information:</p><ul><li><strong>Engagement:</strong> ${engagementName}</li><li><strong>Question:</strong> ${rfiQuestion}</li><li><strong>Deadline:</strong> ${deadline}</li></ul><p>Please respond at your earliest convenience via the <a href="${portalUrl}">client portal</a>.</p><p>Thank you.</p>`,
  }),
  engagementNotification: ({ clientName, engagementName, stage, message, portalUrl }) => ({
    subject: `Engagement Update: ${engagementName}`,
    body: `Dear ${clientName},\n\n${message || `Your engagement "${engagementName}" has moved to the ${stage} stage.`}\n\nAccess the client portal for more details:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>${message || `Your engagement "<strong>${engagementName}</strong>" has moved to the <strong>${stage}</strong> stage.`}</p><p>Access the <a href="${portalUrl}">client portal</a> for more details.</p><p>Thank you.</p>`,
  }),
  clientWeeklyEngagement: ({ clientName, engagements, portalUrl }) => ({
    subject: 'Weekly Engagement Summary',
    body: `Dear ${clientName},\n\nHere is your weekly engagement summary:\n\n${engagements.map(e => `- ${e.name}: ${e.status} (${e.progress}% complete)`).join('\n')}\n\nAccess the client portal for more details:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>Here is your weekly engagement summary:</p><ul>${engagements.map(e => `<li><strong>${e.name}:</strong> ${e.status} (${e.progress}% complete)</li>`).join('\n')}</ul><p>Access the <a href="${portalUrl}">client portal</a> for more details.</p><p>Thank you.</p>`,
  }),
  reviewNotification: ({ userName, reviewName, action, comments, reviewUrl }) => ({
    subject: `Review ${action}: ${reviewName}`,
    body: `Hi ${userName},\n\nA review has been ${action}:\n\nReview: ${reviewName}\n${comments ? `Comments: ${comments}` : ''}\n\nView the review:\n${reviewUrl}\n\nThank you.`,
    html: `<p>Hi ${userName},</p><p>A review has been <strong>${action}</strong>:</p><ul><li><strong>Review:</strong> ${reviewName}</li>${comments ? `<li><strong>Comments:</strong> ${comments}</li>` : ''}</ul><p><a href="${reviewUrl}">View the review</a></p><p>Thank you.</p>`,
  }),
  tenderDeadlineWarning: ({ userName, reviewName, deadline, daysRemaining, reviewUrl }) => ({
    subject: `Tender Deadline Warning: ${reviewName}`,
    body: `Hi ${userName},\n\nThis is a reminder that the tender deadline for "${reviewName}" is approaching.\n\nDeadline: ${deadline}\nDays Remaining: ${daysRemaining}\n\nView the review:\n${reviewUrl}\n\nThank you.`,
    html: `<p>Hi ${userName},</p><p>This is a reminder that the tender deadline for "<strong>${reviewName}</strong>" is approaching.</p><ul><li><strong>Deadline:</strong> ${deadline}</li><li><strong>Days Remaining:</strong> ${daysRemaining}</li></ul><p><a href="${reviewUrl}">View the review</a></p><p>Thank you.</p>`,
  }),
  passwordReset: ({ userName, resetUrl }) => ({
    subject: 'Password Reset Request',
    body: `Hi ${userName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nThank you.`,
    html: `<p>Hi ${userName},</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email.</p><p>Thank you.</p>`,
  }),
  clientSignup: ({ clientName, email, tempPassword, portalUrl }) => ({
    subject: 'Welcome to the Client Portal',
    body: `Dear ${clientName},\n\nYour client portal account has been created.\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>Your client portal account has been created.</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Temporary Password:</strong> ${tempPassword}</li></ul><p>Please <a href="${portalUrl}">log in</a> and change your password.</p><p>Thank you.</p>`,
  }),
};
