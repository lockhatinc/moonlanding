import { list, get, create } from '@/lib/query-engine';
import { notificationService } from '@/services/notification.service';

class MentionNotificationService {
  extractMentions(text) {
    const mentions = [];
    const regex = /@(\w+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return [...new Set(mentions)];
  }

  findUserByName(name) {
    const users = list('user', {});
    return users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
  }

  async sendMentionNotification(mentionedUser, mentioner, entity, entityId, content) {
    if (!mentionedUser || !mentionedUser.email) return;

    const emailBody = `
${mentioner.name} mentioned you in a comment:

"${content}"

Entity: ${entity} (ID: ${entityId})

Review the update in the system.
    `.trim();

    try {
      await notificationService.send(
        mentionedUser.email,
        `${mentioner.name} mentioned you`,
        emailBody,
        { from: 'noreply@bidwise.app' }
      );
    } catch (err) {
      console.error('Failed to send mention notification:', err);
    }
  }

  async processMentions(text, entity, entityId, authorId) {
    const mentions = this.extractMentions(text);
    const author = get('user', authorId);

    for (const mentionName of mentions) {
      const mentionedUser = this.findUserByName(mentionName);
      if (mentionedUser && mentionedUser.id !== authorId) {
        await this.sendMentionNotification(
          mentionedUser,
          author,
          entity,
          entityId,
          text.substring(0, 100)
        );
      }
    }

    return mentions.map(name => {
      const user = this.findUserByName(name);
      return user ? user.id : null;
    }).filter(Boolean);
  }
}

export const mentionNotificationService = new MentionNotificationService();
