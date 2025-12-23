import { getSpec } from './spec-helpers';

export { allSpecs } from './entities/index.js';

export const userSpec = () => getSpec('user');
export const engagementSpec = () => getSpec('engagement');
export const clientSpec = () => getSpec('client');
export const reviewSpec = () => getSpec('review');
export const highlightSpec = () => getSpec('highlight');
export const responseSpec = () => getSpec('response');
export const checklistSpec = () => getSpec('checklist');
export const rfiSpec = () => getSpec('rfi');
export const messageSpec = () => getSpec('message');
export const fileSpec = () => getSpec('file');
export const emailSpec = () => getSpec('email');
