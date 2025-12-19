import { spec } from '../spec-builder.js';
import { withAuditFields } from '../spec-templates.js';

export const collaboratorSpec = withAuditFields(
  spec('collaborator')
    .label('Collaborator', 'Collaborators')
    .icon('Users')
    .order(11)
    .parent('review')
    .embedded()
)
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    user_id: { type: 'ref', ref: 'user', required: true, display: 'user.name' },
    role: { type: 'enum', options: 'collaborator_role', required: true, list: true, default: 'reviewer' },
    type: { type: 'enum', options: 'collaborator_type', required: true, list: true, default: 'permanent' },
    expires_at: { type: 'int', hidden: true },
    email: { type: 'email', required: true },
  })
  .options('collaborator_role', {
    owner: { label: 'Owner', color: 'red' },
    reviewer: { label: 'Reviewer', color: 'blue' },
    viewer: { label: 'Viewer', color: 'gray' },
  })
  .options('collaborator_type', {
    permanent: { label: 'Permanent', color: 'green' },
    temporary: { label: 'Temporary (24h)', color: 'amber' },
  })
  .fieldPermissions({
    expires_at: { view: ['partner'], edit: ['partner'] },
    type: { view: 'all', edit: ['partner'] },
  })
  .rowAccess({
    scope: 'review_team'
  })
  .validate({
    user_id: [
      { type: 'required', message: 'User is required' },
    ],
    email: [
      { type: 'required', message: 'Email is required' },
    ],
  })
  .onLifecycle({
    onCreate: { action: 'notify', template: 'collaborator_added', recipients: 'user_id' },
  })
  .build();
