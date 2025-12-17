import { spec } from './spec-builder';
import { ROLES, ENGAGEMENT_STATUS, ENGAGEMENT_STAGE, REVIEW_STATUS, HIGHLIGHT_STATUS, RFI_CLIENT_STATUS, RFI_AUDITOR_STATUS } from './constants';

export const userSpec = spec('user')
  .label('User', 'Users')
  .icon('User')
  .order(1)
  .fields({
    email: { type: 'email', required: true, unique: true, list: true, search: true },
    name: { type: 'text', required: true, list: true, search: true },
    role: { type: 'enum', options: 'roles', required: true, list: true },
  })
  .options('roles', {
    partner: { label: 'Partner', color: 'red' },
    manager: { label: 'Manager', color: 'blue' },
    clerk: { label: 'Clerk', color: 'gray' },
    auditor: { label: 'Auditor', color: 'amber' },
    client: { label: 'Client', color: 'green' },
  })
  .access({
    list: [ROLES.PARTNER, ROLES.MANAGER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    create: [ROLES.PARTNER],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
  })
  .build();

export const engagementSpec = spec('engagement')
  .label('Engagement', 'Engagements')
  .icon('Briefcase')
  .order(2)
  .fields({
    client_id: { type: 'ref', ref: 'client', display: 'client.name', required: true, list: true },
    year: { type: 'int', required: true, list: true },
    status: { type: 'enum', options: 'engagement_status', required: true, list: true, default: 'pending' },
    stage: { type: 'enum', options: 'engagement_stage', required: true, list: true, default: 'info_gathering' },
    title: { type: 'text', required: true, list: true, search: true },
    description: { type: 'textarea' },
    start_date: { type: 'date' },
    end_date: { type: 'date' },
  })
  .options('engagement_status', {
    pending: { label: 'Pending', color: 'yellow' },
    active: { label: 'Active', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    archived: { label: 'Archived', color: 'gray' },
  })
  .options('engagement_stage', {
    info_gathering: { label: 'Info Gathering', color: 'blue' },
    commencement: { label: 'Commencement', color: 'blue' },
    team_execution: { label: 'Team Execution', color: 'amber' },
    partner_review: { label: 'Partner Review', color: 'amber' },
    finalization: { label: 'Finalization', color: 'green' },
    close_out: { label: 'Close Out', color: 'green' },
  })
  .children({
    reviews: {
      entity: 'review',
      label: 'Reviews',
      fk: 'engagement_id',
    },
    rfis: {
      entity: 'rfi',
      label: 'RFIs',
      fk: 'engagement_id',
    },
  })
  .list({ groupBy: 'status', defaultSort: { field: 'created_at', dir: 'desc' } })
  .build();

export const clientSpec = spec('client')
  .label('Client', 'Clients')
  .icon('Building')
  .order(3)
  .embedded()
  .fields({
    name: { type: 'text', required: true, list: true, search: true },
    email: { type: 'email' },
    phone: { type: 'text' },
    address: { type: 'textarea' },
  })
  .access({
    list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
  })
  .build();

export const reviewSpec = spec('review')
  .label('Review', 'Reviews')
  .icon('FileText')
  .order(4)
  .parent('engagement')
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true },
    document_url: { type: 'text' },
    status: { type: 'enum', options: 'review_status', required: true, list: true, default: 'open' },
    reviewer_id: { type: 'ref', ref: 'user', display: 'user.name' },
  })
  .options('review_status', {
    open: { label: 'Open', color: 'yellow' },
    closed: { label: 'Closed', color: 'green' },
  })
  .children({
    highlights: {
      entity: 'highlight',
      label: 'Highlights',
      fk: 'review_id',
    },
    checklists: {
      entity: 'checklist',
      label: 'Checklists',
      fk: 'review_id',
    },
  })
  .form({
    sections: [
      { label: 'Basic Info', fields: ['title', 'document_url', 'reviewer_id'] },
      { label: 'Review', fields: ['status'] },
    ],
  })
  .build();

export const highlightSpec = spec('highlight')
  .label('Highlight', 'Highlights')
  .icon('Highlighter')
  .order(5)
  .parent('review')
  .embedded()
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    page_number: { type: 'int', required: true },
    text: { type: 'textarea', required: true },
    position_data: { type: 'json' },
    status: { type: 'enum', options: 'highlight_status', required: true, default: 'unresolved' },
    severity: { type: 'enum', options: 'severity', default: 'medium' },
  })
  .options('highlight_status', {
    unresolved: { label: 'Unresolved', color: 'red' },
    partially_resolved: { label: 'Partially Resolved', color: 'yellow' },
    resolved: { label: 'Resolved', color: 'green' },
  })
  .options('severity', {
    low: { label: 'Low', color: 'green' },
    medium: { label: 'Medium', color: 'yellow' },
    high: { label: 'High', color: 'red' },
  })
  .children({
    responses: {
      entity: 'response',
      label: 'Responses',
      fk: 'highlight_id',
    },
  })
  .build();

export const responseSpec = spec('response')
  .label('Response', 'Responses')
  .icon('MessageSquare')
  .order(6)
  .parent('highlight')
  .embedded()
  .fields({
    highlight_id: { type: 'ref', ref: 'highlight', required: true },
    author_id: { type: 'ref', ref: 'user', display: 'user.name', required: true },
    text: { type: 'textarea', required: true },
  })
  .build();

export const checklistSpec = spec('checklist')
  .label('Checklist', 'Checklists')
  .icon('CheckCircle')
  .order(7)
  .parent('review')
  .embedded()
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    title: { type: 'text', required: true, list: true },
    items: { type: 'json', default: [] },
  })
  .build();

export const rfiSpec = spec('rfi')
  .label('Request For Information', 'RFIs')
  .icon('HelpCircle')
  .order(8)
  .parent('engagement')
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true },
    description: { type: 'textarea' },
    client_status: { type: 'enum', options: 'rfi_client_status', required: true, list: true, default: 'pending' },
    auditor_status: { type: 'enum', options: 'rfi_auditor_status', required: true, list: true, default: 'requested' },
    due_date: { type: 'date' },
  })
  .options('rfi_client_status', {
    pending: { label: 'Pending', color: 'yellow' },
    sent: { label: 'Sent', color: 'blue' },
    responded: { label: 'Responded', color: 'amber' },
    completed: { label: 'Completed', color: 'green' },
  })
  .options('rfi_auditor_status', {
    requested: { label: 'Requested', color: 'red' },
    reviewing: { label: 'Reviewing', color: 'blue' },
    queries: { label: 'Queries', color: 'amber' },
    received: { label: 'Received', color: 'green' },
  })
  .children({
    messages: {
      entity: 'message',
      label: 'Messages',
      fk: 'rfi_id',
    },
  })
  .build();

export const messageSpec = spec('message')
  .label('Message', 'Messages')
  .icon('MessageCircle')
  .order(9)
  .parent('rfi')
  .embedded()
  .fields({
    rfi_id: { type: 'ref', ref: 'rfi', required: true },
    author_id: { type: 'ref', ref: 'user', display: 'user.name', required: true },
    text: { type: 'textarea', required: true },
  })
  .build();

export const fileSpec = spec('file')
  .label('File', 'Files')
  .icon('File')
  .fields({
    entity_type: { type: 'text', required: true },
    entity_id: { type: 'text', required: true },
    drive_file_id: { type: 'text', required: true },
    file_name: { type: 'text', required: true },
    file_type: { type: 'text' },
    file_size: { type: 'int' },
    mime_type: { type: 'text' },
    download_url: { type: 'text' },
  })
  .access({
    list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    create: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
  })
  .build();

export const emailSpec = spec('email')
  .label('Email', 'Emails')
  .icon('Mail')
  .fields({
    to: { type: 'email', required: true },
    subject: { type: 'text', required: true },
    body: { type: 'textarea', required: true },
    template: { type: 'text' },
  })
  .access({
    list: [ROLES.PARTNER, ROLES.MANAGER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [],
    delete: [],
  })
  .build();

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
