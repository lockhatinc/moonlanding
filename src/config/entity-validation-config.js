import { field, schema } from './validation-dsl';

export const ENTITY_VALIDATION_RULES = {
  engagement: schema(
    field('title', 'Title').required().minLength(5).maxLength(255),
    field('description', 'Description').minLength(10).maxLength(2000),
    field('year', 'Year').required().minValue(2000).maxValue(new Date().getFullYear() + 5),
    field('client_id', 'Client').required(),
    field('status', 'Status').required(),
    field('start_date', 'Start Date').required(),
    field('end_date', 'End Date').required(),
  ),

  review: schema(
    field('title', 'Title').required().minLength(5).maxLength(255),
    field('description', 'Description').minLength(10).maxLength(2000),
    field('engagement_id', 'Engagement').required(),
    field('status', 'Status').required(),
    field('assigned_to', 'Assigned To'),
  ),

  highlight: schema(
    field('text', 'Highlighted Text').required().minLength(1).maxLength(1000),
    field('page_number', 'Page Number').required().minValue(1),
    field('review_id', 'Review').required(),
    field('status', 'Status').required(),
  ),

  response: schema(
    field('text', 'Response Text').required().minLength(5).maxLength(2000),
    field('highlight_id', 'Highlight').required(),
    field('author_id', 'Author').required(),
  ),

  message: schema(
    field('text', 'Message').required().minLength(1).maxLength(5000),
    field('entity_type', 'Entity Type').required(),
    field('entity_id', 'Entity ID').required(),
    field('sender_id', 'Sender').required(),
  ),

  rfi: schema(
    field('title', 'Title').required().minLength(5).maxLength(255),
    field('description', 'Description').minLength(10).maxLength(2000),
    field('client_status', 'Client Status').required(),
    field('auditor_status', 'Auditor Status').required(),
  ),

  checklist: schema(
    field('name', 'Name').required().minLength(3).maxLength(255),
    field('description', 'Description').minLength(5).maxLength(1000),
    field('review_id', 'Review').required(),
    field('completed', 'Completed'),
  ),

  user: schema(
    field('email', 'Email').required().email(),
    field('name', 'Name').required().minLength(2).maxLength(255),
    field('role', 'Role').required(),
  ),
};

export const FIELD_VALIDATION_RULES = {
  required: {
    validate: (value) => value != null && value !== '' && value !== false,
    message: 'This field is required',
  },
  email: {
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
    message: 'Must be a valid email address',
  },
  url: {
    validate: (value) => !value || /^https?:\/\/.+/.test(String(value)),
    message: 'Must be a valid URL',
  },
  phone: {
    validate: (value) => !value || /^[\d\-\+\s\(\)]{10,}$/.test(String(value)),
    message: 'Must be a valid phone number',
  },
  numeric: {
    validate: (value) => !value || !isNaN(Number(value)),
    message: 'Must be a number',
  },
  alphanumeric: {
    validate: (value) => !value || /^[a-zA-Z0-9]+$/.test(String(value)),
    message: 'Must contain only letters and numbers',
  },
};

export const VALIDATION_SCHEMAS = {
  engagement: ENTITY_VALIDATION_RULES.engagement,
  review: ENTITY_VALIDATION_RULES.review,
  highlight: ENTITY_VALIDATION_RULES.highlight,
  response: ENTITY_VALIDATION_RULES.response,
  message: ENTITY_VALIDATION_RULES.message,
  rfi: ENTITY_VALIDATION_RULES.rfi,
  checklist: ENTITY_VALIDATION_RULES.checklist,
  user: ENTITY_VALIDATION_RULES.user,
};

export function getValidationRules(entity) {
  return VALIDATION_SCHEMAS[entity] || {};
}

export function getFieldRules(entity, field) {
  const entityRules = VALIDATION_SCHEMAS[entity];
  if (!entityRules) return [];
  return entityRules[field] || [];
}
