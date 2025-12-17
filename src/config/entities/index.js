export { userSpec } from './user.spec.js';
export { engagementSpec } from './engagement.spec.js';
export { clientSpec } from './client.spec.js';
export { reviewSpec } from './review.spec.js';
export { highlightSpec } from './highlight.spec.js';
export { responseSpec } from './response.spec.js';
export { checklistSpec } from './checklist.spec.js';
export { rfiSpec } from './rfi.spec.js';
export { messageSpec } from './message.spec.js';
export { fileSpec } from './file.spec.js';
export { emailSpec } from './email.spec.js';

import { userSpec } from './user.spec.js';
import { engagementSpec } from './engagement.spec.js';
import { clientSpec } from './client.spec.js';
import { reviewSpec } from './review.spec.js';
import { highlightSpec } from './highlight.spec.js';
import { responseSpec } from './response.spec.js';
import { checklistSpec } from './checklist.spec.js';
import { rfiSpec } from './rfi.spec.js';
import { messageSpec } from './message.spec.js';
import { fileSpec } from './file.spec.js';
import { emailSpec } from './email.spec.js';

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
