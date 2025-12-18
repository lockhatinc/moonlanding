export { userSpec } from './user.config.js';
export { engagementSpec } from './engagement.config.js';
export { clientSpec } from './client.config.js';
export { reviewSpec } from './review.config.js';
export { highlightSpec } from './highlight.config.js';
export { responseSpec } from './response.config.js';
export { checklistSpec } from './checklist.config.js';
export { rfiSpec } from './rfi.config.js';
export { messageSpec } from './message.config.js';
export { fileSpec } from './file.config.js';
export { emailSpec } from './email.config.js';

import { userSpec } from './user.config.js';
import { engagementSpec } from './engagement.config.js';
import { clientSpec } from './client.config.js';
import { reviewSpec } from './review.config.js';
import { highlightSpec } from './highlight.config.js';
import { responseSpec } from './response.config.js';
import { checklistSpec } from './checklist.config.js';
import { rfiSpec } from './rfi.config.js';
import { messageSpec } from './message.config.js';
import { fileSpec } from './file.config.js';
import { emailSpec } from './email.config.js';

export const allSpecs = {
  user: userSpec,
  engagement: engagementSpec,
  client: clientSpec,
  review: reviewSpec,
  highlight: highlightSpec,
  response: responseSpec,
  checklist: checklistSpec,
  rfi: rfiSpec,
  message: messageSpec,
  file: fileSpec,
  email: emailSpec,
};
