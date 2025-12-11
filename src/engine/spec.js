import engagement from '@/specs/engagement';
import review from '@/specs/review';
import client from '@/specs/client';
import rfi from '@/specs/rfi';
import highlight from '@/specs/highlight';
import highlightResponse from '@/specs/highlight_response';
import user from '@/specs/user';
import team from '@/specs/team';
import teamMember from '@/specs/team_member';
import file from '@/specs/file';
import chatMessage from '@/specs/chat_message';
import template from '@/specs/template';
import checklist from '@/specs/checklist';
import reviewChecklist from '@/specs/review_checklist';
import clientUser from '@/specs/client_user';

export const specs = {
  engagement,
  review,
  client,
  rfi,
  highlight,
  highlight_response: highlightResponse,
  user,
  team,
  team_member: teamMember,
  file,
  chat_message: chatMessage,
  template,
  checklist,
  review_checklist: reviewChecklist,
  client_user: clientUser,
};

export function getSpec(name) {
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

// Get fields that should appear in list
export function getListFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.list)
    .map(([key, f]) => ({ key, ...f }));
}

// Get fields for form (editable, not hidden)
export function getFormFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));
}

// Get options for an enum field
export function getOptions(spec, optionsKey) {
  return spec.options?.[optionsKey] || [];
}

// Get navigation items (entities that are not embedded)
export function getNavItems() {
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent)
    .map(s => ({
      name: s.name,
      label: s.labelPlural,
      icon: s.icon,
      href: `/${s.name}`,
    }));
}

// Validate spec structure
export function validateSpec(spec) {
  const errors = [];

  if (!spec.name) errors.push('Spec must have a name');
  if (!spec.fields) errors.push('Spec must have fields');
  if (!spec.fields?.id && !spec.primaryKey) errors.push('Spec must have an id field or primaryKey');

  // Validate field types
  const validTypes = ['id', 'text', 'textarea', 'email', 'int', 'decimal', 'bool', 'date', 'timestamp', 'json', 'image', 'ref', 'enum'];
  for (const [key, field] of Object.entries(spec.fields || {})) {
    if (!validTypes.includes(field.type)) {
      errors.push(`Invalid field type "${field.type}" for field "${key}"`);
    }
    if (field.type === 'ref' && !field.ref) {
      errors.push(`Ref field "${key}" must specify ref entity`);
    }
    if (field.type === 'enum' && !field.options) {
      errors.push(`Enum field "${key}" must specify options key`);
    }
  }

  return errors;
}
