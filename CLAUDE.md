# Ultra-Minimal Unified Platform
## One Spec = Everything

---

# The Concept

**One entity definition generates:**
- Database table (auto-migration)
- List view (columns, sorting, filtering, search)
- Create/Edit form (fields, validation, lookups)
- Detail view (display, tabs, actions)
- API endpoints (CRUD)
- Permissions (who can do what)

**You write specs. The system writes the app.**

---

# Project Structure

```
platform/
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js                    # Dashboard
│   │   ├── login/page.js
│   │   ├── [entity]/                  # Dynamic - handles ALL entities
│   │   │   ├── page.js                # List view
│   │   │   ├── new/page.js            # Create form
│   │   │   └── [id]/
│   │   │       ├── page.js            # Detail view
│   │   │       └── edit/page.js       # Edit form
│   │   └── api/
│   │       └── [entity]/
│   │           └── [[...path]]/route.js  # Dynamic API
│   │
│   ├── engine/                        # THE CORE (~500 lines total)
│   │   ├── spec.js                    # Spec loader & validator
│   │   ├── db.js                      # SQLite + auto-migration
│   │   ├── crud.js                    # Generic CRUD operations
│   │   ├── auth.js                    # Lucia auth
│   │   └── render.js                  # Component renderer
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn (unchanged)
│   │   ├── entity-list.jsx            # Generic list
│   │   ├── entity-form.jsx            # Generic form
│   │   ├── entity-detail.jsx          # Generic detail
│   │   ├── field-render.jsx           # Field type renderer
│   │   └── layout/
│   │       ├── shell.jsx
│   │       └── nav.jsx
│   │
│   ├── specs/                         # YOUR DEFINITIONS
│   │   ├── engagement.js
│   │   ├── review.js
│   │   ├── client.js
│   │   ├── rfi.js
│   │   ├── user.js
│   │   ├── team.js
│   │   └── index.js                   # Exports all specs
│   │
│   └── domain/                        # Custom overrides (only if needed)
│       ├── pdf-viewer.jsx
│       └── highlight-layer.jsx
│
├── data/
│   └── app.db
│
└── package.json
```

**Total custom files: ~25**
**Total lines: ~2,500**

---

# The Spec Format

```js
// specs/engagement.js

export default {
  name: 'engagement',
  label: 'Engagement',
  labelPlural: 'Engagements',
  icon: 'Briefcase',
  
  // Fields define EVERYTHING - table schema, form fields, list columns
  fields: {
    id:          { type: 'id' },
    name:        { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    client_id:   { type: 'ref', label: 'Client', ref: 'client', required: true, list: true, sortable: true, display: 'client.name' },
    year:        { type: 'int', label: 'Year', required: true, list: true, sortable: true, width: 80 },
    stage:       { type: 'enum', label: 'Stage', options: 'stages', list: true, default: 1 },
    status:      { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    team_id:     { type: 'ref', label: 'Team', ref: 'team', list: true, display: 'avatars' },
    deadline:    { type: 'date', label: 'Deadline', list: true },
    commencement_date: { type: 'date', label: 'Commencement Date' },
    engagement_type:   { type: 'enum', label: 'Type', options: 'engagement_types' },
    letter_status:     { type: 'enum', label: 'Letter Status', options: 'letter_statuses', default: 'pending' },
    letter_drive_id:   { type: 'text', label: 'Letter File', hidden: true },
    review_id:   { type: 'ref', label: 'Linked Review', ref: 'review' },
    created_by:  { type: 'ref', label: 'Created By', ref: 'user', auto: 'user', readOnly: true },
    created_at:  { type: 'timestamp', auto: 'now', readOnly: true },
    updated_at:  { type: 'timestamp', auto: 'update', readOnly: true },
  },

  // Options for enum fields
  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'blue' },
      { value: 'archived', label: 'Archived', color: 'gray' },
    ],
    stages: [
      { value: 1, label: 'Info Gathering' },
      { value: 2, label: 'Engagement Letter' },
      { value: 3, label: 'RFI' },
      { value: 4, label: 'Fieldwork' },
      { value: 5, label: 'Review' },
      { value: 6, label: 'Completion' },
    ],
    letter_statuses: [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'sent', label: 'Sent', color: 'amber' },
      { value: 'signed', label: 'Signed', color: 'green' },
    ],
    engagement_types: [
      { value: 'audit', label: 'Audit' },
      { value: 'review', label: 'Review' },
      { value: 'compilation', label: 'Compilation' },
      { value: 'agreed_upon', label: 'Agreed Upon Procedures' },
    ],
  },

  // Child relationships (auto-creates tabs in detail view)
  children: {
    rfis: { entity: 'rfi', fk: 'engagement_id', label: 'RFIs' },
    files: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Files' },
    chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Chat', component: 'chat' },
  },

  // Permissions
  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
  },

  // Custom actions (beyond CRUD)
  actions: [
    { key: 'send_letter', label: 'Send Letter', icon: 'Mail', permission: 'edit', handler: 'sendEngagementLetter' },
    { key: 'link_review', label: 'Link Review', icon: 'Link', permission: 'edit', dialog: 'linkReview' },
  ],

  // Form sections (optional - auto-groups if not specified)
  form: {
    sections: [
      { label: 'Basic Info', fields: ['name', 'client_id', 'engagement_type', 'year'] },
      { label: 'Dates', fields: ['commencement_date', 'deadline'] },
      { label: 'Team', fields: ['team_id'] },
    ],
  },

  // List config (optional - auto-derives from fields if not specified)
  list: {
    defaultSort: { field: 'created_at', dir: 'desc' },
    filters: ['status', 'year', 'team_id'],
  },
};
```

---

# All Entity Specs

## Client

```js
// specs/client.js
export default {
  name: 'client',
  label: 'Client',
  labelPlural: 'Clients',
  icon: 'Building',
  
  fields: {
    id:          { type: 'id' },
    name:        { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    email:       { type: 'email', label: 'Email', list: true, search: true },
    address:     { type: 'textarea', label: 'Address' },
    entity_type: { type: 'enum', label: 'Entity Type', options: 'entity_types' },
    status:      { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at:  { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
    entity_types: [
      { value: 'company', label: 'Company' },
      { value: 'trust', label: 'Trust' },
      { value: 'individual', label: 'Individual' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'npo', label: 'Non-Profit' },
    ],
  },

  children: {
    engagements: { entity: 'engagement', fk: 'client_id', label: 'Engagements' },
    contacts: { entity: 'client_user', fk: 'client_id', label: 'Contacts' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
  },
};
```

## Review

```js
// specs/review.js
export default {
  name: 'review',
  label: 'Review',
  labelPlural: 'Reviews',
  icon: 'FileSearch',
  
  fields: {
    id:           { type: 'id' },
    name:         { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    team_id:      { type: 'ref', label: 'Team', ref: 'team', required: true, list: true, display: 'team.name' },
    template_id:  { type: 'ref', label: 'Template', ref: 'template' },
    financial_year: { type: 'text', label: 'Financial Year', list: true },
    status:       { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'open' },
    is_private:   { type: 'bool', label: 'Private', default: false },
    wip_value:    { type: 'decimal', label: 'WIP Value' },
    deadline:     { type: 'date', label: 'Deadline', list: true },
    drive_file_id:   { type: 'text', hidden: true },
    drive_folder_id: { type: 'text', hidden: true },
    created_by:   { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
    created_at:   { type: 'timestamp', auto: 'now', readOnly: true },
    updated_at:   { type: 'timestamp', auto: 'update', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'open', label: 'Open', color: 'green' },
      { value: 'closed', label: 'Closed', color: 'gray' },
    ],
  },

  // Computed fields (derived from queries)
  computed: {
    highlight_count: { sql: '(SELECT COUNT(*) FROM highlights WHERE review_id = reviews.id)' },
    unresolved_count: { sql: '(SELECT COUNT(*) FROM highlights WHERE review_id = reviews.id AND resolved = 0)' },
  },

  children: {
    highlights: { entity: 'highlight', fk: 'review_id', label: 'Queries' },
    checklists: { entity: 'review_checklist', fk: 'review_id', label: 'Checklists' },
    attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Files' },
    chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Chat', component: 'chat' },
  },

  // Custom detail view (for PDF viewer)
  detail: {
    component: 'review-detail',  // Uses custom component
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
    resolve: ['partner', 'manager'],
  },
};
```

## RFI

```js
// specs/rfi.js
export default {
  name: 'rfi',
  label: 'RFI',
  labelPlural: 'RFIs',
  icon: 'FileQuestion',
  parent: 'engagement',  // Always accessed under engagement
  
  fields: {
    id:            { type: 'id' },
    engagement_id: { type: 'ref', ref: 'engagement', required: true, hidden: true },
    group_name:    { type: 'text', label: 'Group', list: true, groupBy: true },
    question:      { type: 'textarea', label: 'Question', required: true, list: true, search: true },
    response:      { type: 'textarea', label: 'Response' },
    client_status: { type: 'enum', label: 'Client Status', options: 'statuses', list: true, default: 'pending' },
    team_status:   { type: 'enum', label: 'Team Status', options: 'statuses', list: true, default: 'pending' },
    deadline:      { type: 'date', label: 'Deadline', list: true },
    sort_order:    { type: 'int', default: 0, hidden: true },
    created_by:    { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
    created_at:    { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'sent', label: 'Sent', color: 'amber' },
      { value: 'responded', label: 'Responded', color: 'blue' },
      { value: 'completed', label: 'Completed', color: 'green' },
    ],
  },

  children: {
    attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'rfi' }, label: 'Attachments' },
  },

  list: {
    groupBy: 'group_name',
    expandable: true,
  },

  access: {
    list: ['partner', 'manager', 'clerk', 'client'],
    view: ['partner', 'manager', 'clerk', 'client'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    respond: ['partner', 'manager', 'clerk', 'client'],
    delete: ['partner'],
  },
};
```

## Highlight

```js
// specs/highlight.js
export default {
  name: 'highlight',
  label: 'Query',
  labelPlural: 'Queries',
  icon: 'MessageSquare',
  parent: 'review',
  
  fields: {
    id:          { type: 'id' },
    review_id:   { type: 'ref', ref: 'review', required: true, hidden: true },
    page_number: { type: 'int', label: 'Page', required: true, list: true },
    position:    { type: 'json', label: 'Position', required: true, hidden: true },
    content:     { type: 'text', label: 'Selected Text' },
    comment:     { type: 'textarea', label: 'Comment', list: true, search: true },
    type:        { type: 'enum', label: 'Type', options: 'types', default: 'text' },
    resolved:    { type: 'bool', label: 'Resolved', list: true, default: false },
    resolved_by: { type: 'ref', ref: 'user' },
    resolved_at: { type: 'timestamp' },
    created_by:  { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
    created_at:  { type: 'timestamp', auto: 'now', list: true },
  },

  options: {
    types: [
      { value: 'text', label: 'Text Selection' },
      { value: 'area', label: 'Area Selection' },
    ],
  },

  children: {
    responses: { entity: 'highlight_response', fk: 'highlight_id', label: 'Responses' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager', 'clerk'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
    resolve: ['partner', 'manager'],
  },
};
```

## User

```js
// specs/user.js
export default {
  name: 'user',
  label: 'User',
  labelPlural: 'Users',
  icon: 'User',
  
  fields: {
    id:            { type: 'id' },
    email:         { type: 'email', label: 'Email', required: true, unique: true, list: true, sortable: true, search: true },
    name:          { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    avatar:        { type: 'image', label: 'Avatar', list: true },
    password_hash: { type: 'text', hidden: true },
    type:          { type: 'enum', label: 'Type', options: 'types', list: true, default: 'auditor' },
    role:          { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'clerk' },
    status:        { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at:    { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    types: [
      { value: 'auditor', label: 'Auditor' },
      { value: 'client', label: 'Client' },
    ],
    roles: [
      { value: 'partner', label: 'Partner' },
      { value: 'manager', label: 'Manager' },
      { value: 'clerk', label: 'Clerk' },
    ],
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  children: {
    teams: { entity: 'team_member', fk: 'user_id', label: 'Teams' },
  },

  access: {
    list: ['partner'],
    view: ['partner'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
```

## Team

```js
// specs/team.js
export default {
  name: 'team',
  label: 'Team',
  labelPlural: 'Teams',
  icon: 'Users',
  
  fields: {
    id:         { type: 'id' },
    name:       { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    status:     { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  computed: {
    member_count: { sql: '(SELECT COUNT(*) FROM team_members WHERE team_id = teams.id)' },
  },

  children: {
    members: { entity: 'team_member', fk: 'team_id', label: 'Members' },
    engagements: { entity: 'engagement', fk: 'team_id', label: 'Engagements' },
    reviews: { entity: 'review', fk: 'team_id', label: 'Reviews' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
```

## Supporting Entities

```js
// specs/team_member.js
export default {
  name: 'team_member',
  label: 'Team Member',
  embedded: true,  // No standalone routes
  
  fields: {
    team_id: { type: 'ref', ref: 'team', required: true },
    user_id: { type: 'ref', ref: 'user', required: true, display: 'user.name' },
    role:    { type: 'enum', label: 'Role', options: 'roles', default: 'member' },
  },

  options: {
    roles: [
      { value: 'partner', label: 'Partner' },
      { value: 'member', label: 'Member' },
    ],
  },

  primaryKey: ['team_id', 'user_id'],
};

// specs/file.js
export default {
  name: 'file',
  label: 'File',
  embedded: true,
  
  fields: {
    id:           { type: 'id' },
    entity_type:  { type: 'text', required: true },
    entity_id:    { type: 'text', required: true },
    drive_file_id: { type: 'text', required: true },
    file_name:    { type: 'text', label: 'Name', list: true },
    file_type:    { type: 'text', label: 'Type', list: true },
    uploaded_by:  { type: 'ref', ref: 'user', auto: 'user' },
    created_at:   { type: 'timestamp', auto: 'now', list: true },
  },
};

// specs/chat_message.js
export default {
  name: 'chat_message',
  label: 'Message',
  embedded: true,
  
  fields: {
    id:          { type: 'id' },
    entity_type: { type: 'text', required: true },
    entity_id:   { type: 'text', required: true },
    content:     { type: 'textarea', required: true },
    attachments: { type: 'json' },
    is_team_only: { type: 'bool', default: false },
    created_by:  { type: 'ref', ref: 'user', auto: 'user' },
    created_at:  { type: 'timestamp', auto: 'now' },
  },
};

// specs/template.js
export default {
  name: 'template',
  label: 'Template',
  labelPlural: 'Templates',
  icon: 'FileTemplate',
  
  fields: {
    id:         { type: 'id' },
    name:       { type: 'text', label: 'Name', required: true, list: true, search: true },
    type:       { type: 'enum', label: 'Type', options: 'types', list: true, default: 'standard' },
    sections:   { type: 'json', label: 'Sections' },
    status:     { type: 'enum', label: 'Status', options: 'statuses', default: 'active' },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    types: [
      { value: 'standard', label: 'Standard' },
      { value: 'tender', label: 'Tender' },
    ],
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  access: {
    list: ['partner'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};

// specs/checklist.js
export default {
  name: 'checklist',
  label: 'Checklist',
  labelPlural: 'Checklists',
  icon: 'ListChecks',
  
  fields: {
    id:         { type: 'id' },
    name:       { type: 'text', label: 'Name', required: true, list: true, search: true },
    items:      { type: 'json', label: 'Items' },
    status:     { type: 'enum', label: 'Status', options: 'statuses', default: 'active' },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  access: {
    list: ['partner', 'manager'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
```

---

# The Engine (~500 lines total)

## Spec Loader

```js
// engine/spec.js
import engagement from '@/specs/engagement';
import review from '@/specs/review';
import client from '@/specs/client';
import rfi from '@/specs/rfi';
import highlight from '@/specs/highlight';
import user from '@/specs/user';
import team from '@/specs/team';
import team_member from '@/specs/team_member';
import file from '@/specs/file';
import chat_message from '@/specs/chat_message';
import template from '@/specs/template';
import checklist from '@/specs/checklist';

export const specs = {
  engagement,
  review,
  client,
  rfi,
  highlight,
  user,
  team,
  team_member,
  file,
  chat_message,
  template,
  checklist,
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
```

## Database Engine

```js
// engine/db.js
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import { specs } from './spec';

const db = new Database(path.join(process.cwd(), 'data', 'app.db'));

// Type to SQLite mapping
const typeMap = {
  id: 'TEXT PRIMARY KEY',
  text: 'TEXT',
  textarea: 'TEXT',
  email: 'TEXT',
  int: 'INTEGER',
  decimal: 'REAL',
  bool: 'INTEGER',
  date: 'INTEGER',
  timestamp: 'INTEGER',
  json: 'TEXT',
  image: 'TEXT',
  ref: 'TEXT',
  enum: 'TEXT',
};

// Auto-migrate: create/update tables from specs
export function migrate() {
  for (const spec of Object.values(specs)) {
    const columns = [];
    const foreignKeys = [];
    
    for (const [key, field] of Object.entries(spec.fields)) {
      let col = `${key} ${typeMap[field.type] || 'TEXT'}`;
      
      if (field.required && field.type !== 'id') col += ' NOT NULL';
      if (field.unique) col += ' UNIQUE';
      if (field.default !== undefined) {
        const def = typeof field.default === 'string' ? `'${field.default}'` : field.default;
        col += ` DEFAULT ${def}`;
      }
      
      columns.push(col);
      
      if (field.type === 'ref' && field.ref) {
        foreignKeys.push(`FOREIGN KEY (${key}) REFERENCES ${field.ref}s(id)`);
      }
    }
    
    // Handle composite primary key
    if (spec.primaryKey) {
      const pkCols = columns.filter(c => !c.includes('PRIMARY KEY'));
      const sql = `CREATE TABLE IF NOT EXISTS ${spec.name}s (
        ${pkCols.join(',\n        ')},
        ${foreignKeys.join(',\n        ')}${foreignKeys.length ? ',' : ''}
        PRIMARY KEY (${spec.primaryKey.join(', ')})
      )`;
      db.exec(sql);
    } else {
      const sql = `CREATE TABLE IF NOT EXISTS ${spec.name}s (
        ${columns.join(',\n        ')}${foreignKeys.length ? ',' : ''}
        ${foreignKeys.join(',\n        ')}
      )`;
      db.exec(sql);
    }
  }
  
  // Create indexes
  for (const spec of Object.values(specs)) {
    for (const [key, field] of Object.entries(spec.fields)) {
      if (field.type === 'ref' || field.sortable || field.search) {
        const idxName = `idx_${spec.name}s_${key}`;
        db.exec(`CREATE INDEX IF NOT EXISTS ${idxName} ON ${spec.name}s(${key})`);
      }
    }
  }
}

// Run migration on startup
migrate();

export default db;

// Helper: generate ID
export function genId() {
  return nanoid();
}

// Helper: current timestamp
export function now() {
  return Math.floor(Date.now() / 1000);
}
```

## CRUD Engine

```js
// engine/crud.js
import db, { genId, now } from './db';
import { getSpec, getListFields } from './spec';

// Build SELECT query with joins for refs
function buildSelect(spec, where = {}, options = {}) {
  const table = `${spec.name}s`;
  const selects = [`${table}.*`];
  const joins = [];
  
  // Add computed fields
  if (spec.computed) {
    for (const [key, comp] of Object.entries(spec.computed)) {
      selects.push(`${comp.sql} as ${key}`);
    }
  }
  
  // Add ref display fields
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.display) {
      const refTable = `${field.ref}s`;
      const alias = field.ref;
      const displayField = field.display.split('.')[1] || 'name';
      joins.push(`LEFT JOIN ${refTable} ${alias} ON ${table}.${key} = ${alias}.id`);
      selects.push(`${alias}.${displayField} as ${key}_display`);
    }
  }
  
  // Build WHERE clause
  const whereClauses = [];
  const params = [];
  
  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${table}.${key} = ?`);
      params.push(value);
    }
  }
  
  // Exclude deleted by default
  if (spec.fields.status && !where.status) {
    whereClauses.push(`${table}.status != 'deleted'`);
  }
  
  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  if (joins.length) sql += ' ' + joins.join(' ');
  if (whereClauses.length) sql += ' WHERE ' + whereClauses.join(' AND ');
  
  // Sort
  const sort = options.sort || spec.list?.defaultSort;
  if (sort) {
    sql += ` ORDER BY ${table}.${sort.field} ${sort.dir?.toUpperCase() || 'ASC'}`;
  }
  
  // Limit
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
    if (options.offset) sql += ` OFFSET ${options.offset}`;
  }
  
  return { sql, params };
}

// List records
export function list(entityName, where = {}, options = {}) {
  const spec = getSpec(entityName);
  const { sql, params } = buildSelect(spec, where, options);
  return db.prepare(sql).all(...params);
}

// Get single record
export function get(entityName, id) {
  const spec = getSpec(entityName);
  const { sql, params } = buildSelect(spec, { id });
  return db.prepare(sql).get(...params);
}

// Create record
export function create(entityName, data, user) {
  const spec = getSpec(entityName);
  const id = genId();
  const fields = { id };
  
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'id') continue;
    
    if (field.auto === 'now') {
      fields[key] = now();
    } else if (field.auto === 'user' && user) {
      fields[key] = user.id;
    } else if (data[key] !== undefined) {
      fields[key] = field.type === 'json' ? JSON.stringify(data[key]) : data[key];
    } else if (field.default !== undefined) {
      fields[key] = field.default;
    }
  }
  
  const keys = Object.keys(fields);
  const sql = `INSERT INTO ${spec.name}s (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
  db.prepare(sql).run(...Object.values(fields));
  
  return { id, ...fields };
}

// Update record
export function update(entityName, id, data, user) {
  const spec = getSpec(entityName);
  const fields = {};
  
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.readOnly || field.type === 'id') continue;
    
    if (field.auto === 'update') {
      fields[key] = now();
    } else if (data[key] !== undefined) {
      fields[key] = field.type === 'json' ? JSON.stringify(data[key]) : data[key];
    }
  }
  
  if (Object.keys(fields).length === 0) return;
  
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const sql = `UPDATE ${spec.name}s SET ${sets} WHERE id = ?`;
  db.prepare(sql).run(...Object.values(fields), id);
}

// Soft delete
export function remove(entityName, id) {
  const spec = getSpec(entityName);
  
  if (spec.fields.status) {
    db.prepare(`UPDATE ${spec.name}s SET status = 'deleted', updated_at = ? WHERE id = ?`).run(now(), id);
  } else {
    db.prepare(`DELETE FROM ${spec.name}s WHERE id = ?`).run(id);
  }
}

// Search
export function search(entityName, query, where = {}) {
  const spec = getSpec(entityName);
  const searchFields = Object.entries(spec.fields)
    .filter(([_, f]) => f.search)
    .map(([k]) => k);
  
  if (!searchFields.length || !query) {
    return list(entityName, where);
  }
  
  const { sql: baseSql, params: baseParams } = buildSelect(spec, where);
  const searchClauses = searchFields.map(f => `${spec.name}s.${f} LIKE ?`).join(' OR ');
  const sql = baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `).replace(' FROM ', ' FROM ');
  
  const searchParams = searchFields.map(() => `%${query}%`);
  return db.prepare(baseSql.includes('WHERE') 
    ? baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `)
    : `${baseSql} WHERE (${searchClauses})`
  ).all(...searchParams, ...baseParams);
}

// Get children
export function getChildren(entityName, parentId, childDef) {
  const where = { [childDef.fk]: parentId };
  if (childDef.filter) Object.assign(where, childDef.filter);
  return list(childDef.entity, where);
}

// Count
export function count(entityName, where = {}) {
  const spec = getSpec(entityName);
  const whereClauses = [];
  const params = [];
  
  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }
  }
  
  if (spec.fields.status && !where.status) {
    whereClauses.push(`status != 'deleted'`);
  }
  
  const sql = `SELECT COUNT(*) as count FROM ${spec.name}s${whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''}`;
  return db.prepare(sql).get(...params).count;
}
```

## Auth Engine

```js
// engine/auth.js
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { Google } from 'arctic';
import { cookies } from 'next/headers';
import db from './db';

const adapter = new BetterSqlite3Adapter(db, {
  user: 'users',
  session: 'sessions',
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: { secure: process.env.NODE_ENV === 'production' },
  },
  getUserAttributes: (row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    type: row.type,
    role: row.role,
  }),
});

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function getUser() {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value;
  if (!sessionId) return null;
  
  const { user, session } = await lucia.validateSession(sessionId);
  
  if (session?.fresh) {
    const cookie = lucia.createSessionCookie(session.id);
    cookies().set(cookie.name, cookie.value, cookie.attributes);
  }
  if (!session) {
    const cookie = lucia.createBlankSessionCookie();
    cookies().set(cookie.name, cookie.value, cookie.attributes);
  }
  
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function can(user, spec, action) {
  if (!user || !spec.access?.[action]) return false;
  return spec.access[action].includes(user.role);
}

export function check(user, spec, action) {
  if (!can(user, spec, action)) {
    throw new Error(`Permission denied: ${spec.name}.${action}`);
  }
}
```

---

# Dynamic Route Handlers

## List Page (handles ALL entities)

```jsx
// app/[entity]/page.js
import { getSpec, getListFields, getNavItems } from '@/engine/spec';
import { list, search } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { redirect, notFound } from 'next/navigation';
import { EntityList } from '@/components/entity-list';
import { Shell } from '@/components/layout/shell';

export default async function ListPage({ params, searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');
  
  let spec;
  try {
    spec = getSpec(params.entity);
  } catch {
    notFound();
  }
  
  if (spec.embedded || spec.parent) notFound();
  if (!can(user, spec, 'list')) redirect('/');
  
  const q = searchParams.q || '';
  const data = q ? search(params.entity, q) : list(params.entity);
  
  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityList 
        spec={spec} 
        data={data} 
        searchQuery={q}
        canCreate={can(user, spec, 'create')}
      />
    </Shell>
  );
}
```

## Detail Page

```jsx
// app/[entity]/[id]/page.js
import { getSpec, getNavItems } from '@/engine/spec';
import { get, getChildren } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { redirect, notFound } from 'next/navigation';
import { EntityDetail } from '@/components/entity-detail';
import { ReviewDetail } from '@/domain/review-detail';
import { Shell } from '@/components/layout/shell';

export default async function DetailPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');
  
  let spec;
  try {
    spec = getSpec(params.entity);
  } catch {
    notFound();
  }
  
  if (spec.embedded) notFound();
  if (!can(user, spec, 'view')) redirect('/');
  
  const data = get(params.entity, params.id);
  if (!data) notFound();
  
  // Load children
  const children = {};
  if (spec.children) {
    for (const [key, childDef] of Object.entries(spec.children)) {
      children[key] = getChildren(params.entity, params.id, childDef);
    }
  }
  
  // Custom component for reviews (PDF viewer)
  if (spec.detail?.component === 'review-detail') {
    return (
      <Shell user={user} nav={getNavItems()}>
        <ReviewDetail spec={spec} data={data} children={children} user={user} />
      </Shell>
    );
  }
  
  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityDetail 
        spec={spec} 
        data={data} 
        children={children}
        user={user}
        canEdit={can(user, spec, 'edit')}
        canDelete={can(user, spec, 'delete')}
      />
    </Shell>
  );
}
```

## Create Page

```jsx
// app/[entity]/new/page.js
import { getSpec, getNavItems } from '@/engine/spec';
import { list } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { redirect, notFound } from 'next/navigation';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout/shell';
import { createAction } from './actions';

export default async function NewPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');
  
  let spec;
  try {
    spec = getSpec(params.entity);
  } catch {
    notFound();
  }
  
  if (spec.embedded) notFound();
  if (!can(user, spec, 'create')) redirect(`/${params.entity}`);
  
  // Load options for ref fields
  const options = await loadOptions(spec);
  
  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityForm 
        spec={spec} 
        options={options}
        action={createAction.bind(null, params.entity)}
      />
    </Shell>
  );
}

async function loadOptions(spec) {
  const options = {};
  
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.ref) {
      options[key] = list(field.ref).map(r => ({
        value: r.id,
        label: r.name || r.email || r.id,
      }));
    }
  }
  
  return options;
}
```

## Edit Page

```jsx
// app/[entity]/[id]/edit/page.js
import { getSpec, getNavItems } from '@/engine/spec';
import { get, list } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { redirect, notFound } from 'next/navigation';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout/shell';
import { updateAction } from './actions';

export default async function EditPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');
  
  let spec;
  try {
    spec = getSpec(params.entity);
  } catch {
    notFound();
  }
  
  if (spec.embedded) notFound();
  if (!can(user, spec, 'edit')) redirect(`/${params.entity}/${params.id}`);
  
  const data = get(params.entity, params.id);
  if (!data) notFound();
  
  const options = await loadOptions(spec);
  
  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityForm 
        spec={spec} 
        data={data}
        options={options}
        action={updateAction.bind(null, params.entity, params.id)}
      />
    </Shell>
  );
}
```

## Server Actions

```js
// app/[entity]/actions.js
'use server';

import { create, update, remove } from '@/engine/crud';
import { getSpec } from '@/engine/spec';
import { requireUser, check } from '@/engine/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAction(entityName, formData) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'create');
  
  const data = Object.fromEntries(formData);
  const result = create(entityName, data, user);
  
  revalidatePath(`/${entityName}`);
  redirect(`/${entityName}/${result.id}`);
}

export async function updateAction(entityName, id, formData) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'edit');
  
  const data = Object.fromEntries(formData);
  update(entityName, id, data, user);
  
  revalidatePath(`/${entityName}/${id}`);
  redirect(`/${entityName}/${id}`);
}

export async function deleteAction(entityName, id) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'delete');
  
  remove(entityName, id);
  
  revalidatePath(`/${entityName}`);
  redirect(`/${entityName}`);
}
```

---

# Core Components

## EntityList

```jsx
// components/entity-list.jsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldRender } from './field-render';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';

export function EntityList({ spec, data, searchQuery, canCreate }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(new Set());
  
  const listFields = useMemo(() => 
    Object.entries(spec.fields)
      .filter(([_, f]) => f.list)
      .map(([key, f]) => ({ key, ...f })),
    [spec]
  );
  
  const groupBy = spec.list?.groupBy;
  const grouped = useMemo(() => {
    if (!groupBy) return { '': data };
    return data.reduce((acc, row) => {
      const g = row[groupBy] || 'Other';
      (acc[g] = acc[g] || []).push(row);
      return acc;
    }, {});
  }, [data, groupBy]);
  
  const Icon = Icons[spec.icon] || Icons.File;
  
  const toggleGroup = (g) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Icon className="h-6 w-6" />
          {spec.labelPlural}
        </h1>
        {canCreate && (
          <Button onClick={() => router.push(`/${spec.name}/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New {spec.label}
          </Button>
        )}
      </div>
      
      <form className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          name="q" 
          defaultValue={searchQuery} 
          placeholder={`Search ${spec.labelPlural.toLowerCase()}...`}
          className="pl-9"
        />
      </form>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {groupBy && <TableHead className="w-8" />}
              {listFields.map(f => (
                <TableHead key={f.key} style={{ width: f.width }}>
                  {f.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([group, rows]) => (
              <>
                {groupBy && (
                  <TableRow 
                    key={`g-${group}`}
                    className="bg-muted/30 cursor-pointer"
                    onClick={() => toggleGroup(group)}
                  >
                    <TableCell>
                      {expanded.has(group) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell colSpan={listFields.length}>
                      <span className="font-medium">{group}</span>
                      <span className="ml-2 text-muted-foreground">({rows.length})</span>
                    </TableCell>
                  </TableRow>
                )}
                {(!groupBy || expanded.has(group)) && rows.map(row => (
                  <TableRow 
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/${spec.name}/${row.id}`)}
                  >
                    {groupBy && <TableCell />}
                    {listFields.map(f => (
                      <TableCell key={f.key}>
                        <FieldRender spec={spec} field={f} value={row[f.key]} row={row} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={listFields.length + (groupBy ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  No {spec.labelPlural.toLowerCase()} found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

## EntityForm

```jsx
// components/entity-form.jsx
'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {label}
    </Button>
  );
}

export function EntityForm({ spec, data = {}, options = {}, action }) {
  const router = useRouter();
  
  const formFields = Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));
  
  // Group fields into sections
  const sections = spec.form?.sections || [{ fields: formFields.map(f => f.key) }];
  
  const renderField = (field) => {
    const val = data[field.key] ?? '';
    
    switch (field.type) {
      case 'textarea':
        return <Textarea name={field.key} defaultValue={val} rows={3} />;
      
      case 'date':
        return (
          <Input 
            type="date" 
            name={field.key} 
            defaultValue={val ? new Date(val * 1000).toISOString().split('T')[0] : ''} 
          />
        );
      
      case 'int':
      case 'decimal':
        return <Input type="number" name={field.key} defaultValue={val} step={field.type === 'decimal' ? '0.01' : '1'} />;
      
      case 'bool':
        return (
          <input type="checkbox" name={field.key} defaultChecked={!!val} className="h-4 w-4" />
        );
      
      case 'enum':
        const enumOpts = spec.options?.[field.options] || [];
        return (
          <Select name={field.key} defaultValue={String(val)}>
            <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
            <SelectContent>
              {enumOpts.map(o => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'ref':
        const refOpts = options[field.key] || [];
        return (
          <Select name={field.key} defaultValue={val}>
            <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
            <SelectContent>
              {refOpts.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return <Input type={field.type === 'email' ? 'email' : 'text'} name={field.key} defaultValue={val} />;
    }
  };

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">
        {data.id ? `Edit ${spec.label}` : `New ${spec.label}`}
      </h1>
      
      {sections.map((section, i) => (
        <Card key={i}>
          {section.label && (
            <CardHeader><CardTitle>{section.label}</CardTitle></CardHeader>
          )}
          <CardContent className="space-y-4">
            {section.fields.map(fieldKey => {
              const field = formFields.find(f => f.key === fieldKey);
              if (!field) return null;
              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton label={data.id ? 'Update' : 'Create'} />
      </div>
    </form>
  );
}
```

## EntityDetail

```jsx
// components/entity-detail.jsx
'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldRender } from './field-render';
import { EntityList } from './entity-list';
import { ChatPanel } from '@/domain/chat-panel';
import { deleteAction } from '@/app/[entity]/actions';
import { Pencil, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';

export function EntityDetail({ spec, data, children, user, canEdit, canDelete }) {
  const router = useRouter();
  
  const displayFields = Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));
  
  const Icon = Icons[spec.icon] || Icons.File;
  
  const childTabs = spec.children ? Object.entries(spec.children).map(([key, child]) => ({
    key,
    ...child,
    data: children[key] || [],
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {data.name || data.email || data.id}
          </h1>
          {data.status && (
            <FieldRender spec={spec} field={{ type: 'enum', options: 'statuses' }} value={data.status} />
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/${spec.name}/${data.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <form action={deleteAction.bind(null, spec.name, data.id)}>
              <Button type="submit" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </form>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {childTabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
              {tab.data.length > 0 && (
                <span className="ml-1 px-1.5 bg-primary/10 rounded text-xs">{tab.data.length}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              {displayFields.map(field => (
                <div key={field.key}>
                  <p className="text-sm text-muted-foreground">{field.label}</p>
                  <p className="font-medium">
                    <FieldRender spec={spec} field={field} value={data[field.key]} row={data} />
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        {childTabs.map(tab => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.component === 'chat' ? (
              <ChatPanel entityType={spec.name} entityId={data.id} messages={tab.data} user={user} />
            ) : (
              <EntityList 
                spec={specs[tab.entity]} 
                data={tab.data} 
                canCreate={can(user, specs[tab.entity], 'create')}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

## FieldRender

```jsx
// components/field-render.jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function FieldRender({ spec, field, value, row }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  
  switch (field.type) {
    case 'enum':
      const opt = spec.options?.[field.options]?.find(o => o.value === value);
      if (!opt) return value;
      const colors = {
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        amber: 'bg-amber-100 text-amber-800',
        blue: 'bg-blue-100 text-blue-800',
        gray: 'bg-gray-100 text-gray-800',
        red: 'bg-red-100 text-red-800',
      };
      return <Badge className={colors[opt.color] || colors.gray}>{opt.label}</Badge>;
    
    case 'ref':
      if (field.display === 'avatars') {
        return <AvatarGroup users={value || []} />;
      }
      return row[`${field.key}_display`] || value;
    
    case 'date':
    case 'timestamp':
      if (!value) return '—';
      return new Date(value * 1000).toLocaleDateString();
    
    case 'bool':
      return value ? 'Yes' : 'No';
    
    case 'image':
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={value} />
          <AvatarFallback>{row.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      );
    
    case 'json':
      return <code className="text-xs">{JSON.stringify(value)}</code>;
    
    default:
      return String(value);
  }
}

function AvatarGroup({ users, max = 3 }) {
  const visible = users.slice(0, max);
  const rest = users.length - max;
  
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} className="h-8 w-8 border-2 border-background">
          <AvatarImage src={u.avatar} />
          <AvatarFallback>{u.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
          +{rest}
        </div>
      )}
    </div>
  );
}
```

---

# File & Line Count

| Category | Files | Lines |
|----------|-------|-------|
| Specs | 12 | ~500 |
| Engine | 4 | ~400 |
| Routes (dynamic) | 6 | ~200 |
| Components | 6 | ~600 |
| UI (shadcn) | 15 | ~600 |
| Domain (PDF, chat) | 3 | ~400 |
| Layout | 2 | ~150 |
| **Total** | **~48** | **~2,850** |

**vs Current: ~300 files, ~64,000 lines**

**Reduction: 84% fewer files, 96% fewer lines**

---

# What Happens When You Need Something New

## Add a new entity

1. Create `specs/invoice.js` (~30 lines)
2. Done. Routes, forms, lists, permissions all work automatically.

## Add a field to existing entity

1. Add one line to the `fields` object
2. Done. DB migrates, forms update, lists update.

## Add a custom action

1. Add to `actions` array in spec
2. Create handler function
3. Done.

## Override a component

1. Add `detail: { component: 'my-custom' }` to spec
2. Create component in `/domain`
3. Done.

---

# Your Existing Code Integration

```js
// domain/drive.js - Your Google Drive adapter (unchanged)
// domain/email.js - Your Gmail API code (unchanged)
// domain/pdf-viewer.jsx - Custom PDF component
// domain/review-detail.jsx - Custom review page with PDF viewer
// domain/chat-panel.jsx - Chat component
```

These are the ONLY custom domain components needed.

---

# Summary

| What | How |
|------|-----|
| Add entity | Write spec file |
| Add field | Add line to spec |
| Change permissions | Edit spec `access` |
| Change form layout | Edit spec `form.sections` |
| Change list columns | Edit field `list: true` |
| Change status options | Edit spec `options` |
| Everything else | Automatic |

**One spec file = complete CRUD for that entity.**

**~2,850 lines total. ~48 files. $0 hosting.**
