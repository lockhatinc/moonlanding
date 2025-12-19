import { userSpec } from './user.config.js';
import { engagementSpec } from './engagement.config.js';
import { clientSpec } from './client.config.js';
import { clientUserSpec } from './client-user.config.js';
import { teamSpec } from './team.config.js';
import { reviewSpec } from './review.config.js';
import { highlightSpec } from './highlight.config.js';
import { responseSpec } from './response.config.js';
import { checklistSpec } from './checklist.config.js';
import { rfiSpec } from './rfi.config.js';
import { messageSpec } from './message.config.js';
import { fileSpec } from './file.config.js';
import { emailSpec } from './email.config.js';

export { userSpec, engagementSpec, clientSpec, clientUserSpec, teamSpec, reviewSpec, highlightSpec, responseSpec, checklistSpec, rfiSpec, messageSpec, fileSpec, emailSpec };

export const allSpecs = { user: userSpec, engagement: engagementSpec, client: clientSpec, client_user: clientUserSpec, team: teamSpec, review: reviewSpec, highlight: highlightSpec, response: responseSpec, checklist: checklistSpec, rfi: rfiSpec, message: messageSpec, file: fileSpec, email: emailSpec };
