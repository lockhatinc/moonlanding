# Modular Dynamic Framework Guide

This framework provides a comprehensive system for building modular, DRY applications with minimal code. All major patterns have been abstracted and are driven by configuration.

## Core Architecture

### 1. Entity Specifications (`/src/config/spec-builder.js`)

Define entities using a fluent builder API:

```javascript
import { spec } from '@/config/spec-builder';

const userSpec = spec('user')
  .label('User', 'Users')
  .icon('User')
  .fields({
    email: { type: 'email', required: true, unique: true },
    name: { type: 'text', required: true },
    role: { type: 'enum', options: 'roles' }
  })
  .options('roles', {
    admin: { label: 'Administrator', color: 'red' },
    user: { label: 'User', color: 'gray' }
  })
  .access({
    list: ['admin'],
    view: ['admin'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin']
  })
  .list({ defaultSort: { field: 'name', dir: 'asc' } })
  .form({
    sections: [
      { label: 'Account', fields: ['email', 'name'] },
      { label: 'Settings', fields: ['role'] }
    ]
  })
  .build();
```

**Features:**
- Fluent API for readability
- Auto-generates id, created_at, updated_at fields
- Supports custom field types (text, email, int, decimal, date, bool, enum, ref, json, etc.)
- Defines permissions per entity and action
- Groups fields into form sections
- Configures list view (sorting, grouping, filters)
- Supports soft deletes with status field

### 2. Hook & Middleware System (`/src/lib/hook-registry.js`)

Register hooks for custom logic at any point:

```javascript
import { registerHook, executeHook } from '@/lib/hook-registry';

registerHook('create:user:before', async (context) => {
  console.log('Creating user:', context.data);
  return context;
});

registerHook('create:user:after', async (context) => {
  console.log('User created:', context.data);
  await sendWelcomeEmail(context.data.email);
  return context;
});

registerHook('validate:user:email', async (context) => {
  const existing = await db.query('SELECT * FROM users WHERE email = ?', [context.value]);
  if (existing) context.error = 'Email already exists';
  return context;
});
```

**Hook Points:**
- `{action}:{entity}:before` - Before operation
- `{action}:{entity}:after` - After operation
- `validate:{entity}:{field}` - Custom field validation
- `validate:{entity}` - Custom entity validation

**Priority System:**
```javascript
registerHook('create:user:before', handler, 20);  // Higher priority runs first
registerHook('create:user:before', handler, 10);  // Runs after
```

### 3. Validation Engine (`/src/lib/validation-engine.js`)

Automatic field validation with custom validators:

```javascript
import { validateField, validateEntity, registerValidator } from '@/lib/validation-engine';

registerValidator('custom', (value, field, spec) => {
  if (value === 'forbidden') return 'This value is not allowed';
  return null;
});

// Validate single field
const error = await validateField(userSpec, 'email', 'invalid@email');

// Validate entire entity
const errors = await validateEntity(userSpec, {
  email: 'test@example.com',
  name: '',  // Error: required
  role: 'admin'
});
```

**Built-in Validators:**
- email, text, textarea, int, decimal, date, bool, enum, ref, json
- Extensible: `minLength`, `maxLength`, `min`, `max`, `required`, `unique`

### 4. Component Factory (`/src/lib/component-factory.js`)

Auto-generate UI components from specs:

```javascript
import { createListComponent, createFormComponent, createDetailComponent } from '@/lib/component-factory';

// In page or layout
const UserList = createListComponent('user');
const CreateUserForm = createFormComponent('user', 'create');
const UserDetail = createDetailComponent('user');
const EditUserForm = createFormComponent('user', 'edit');
const UserSearch = createSearchComponent('user');
const UserFilter = createFilterComponent('user');

// Use in JSX
<UserList />
<CreateUserForm onSubmit={handleCreate} />
<UserDetail id="user123" />
```

**Generated Components:**
- `List{Entity}` - Full table with search, sort, group
- `{Entity}Detail` - Entity detail view (custom or auto-generated)
- `Create{Entity}` - Create form
- `Edit{Entity}` - Edit form
- `Search{Entity}` - Search input
- `Filter{Entity}` - Filter panel
- `{Entity}CreateDialog` - Modal create form
- `{Entity}EditDialog` - Modal edit form

### 5. Auto-Generated Routes (`/src/lib/route-factory.js`)

API routes are fully auto-generated from specs with hooks:

```javascript
// All routes auto-created from specs
GET    /api/{entity}              → List with validation
GET    /api/{entity}?q={query}    → Search
GET    /api/{entity}/{id}         → Get single
GET    /api/{entity}/{id}/{child} → Get children
POST   /api/{entity}              → Create (with validation)
PUT    /api/{entity}/{id}         → Update (with validation)
PATCH  /api/{entity}/{id}         → Partial update
DELETE /api/{entity}/{id}         → Delete (soft or hard)
```

**Automatic Features:**
- Permission checking on all routes
- Validation on create/update
- Hook execution (before/after)
- Soft delete support
- Realtime broadcast updates
- Error handling with logging

### 6. Migration System (`/src/lib/migration-engine.js`)

Manage schema changes with migrations:

```javascript
import { migrationEngine } from '@/lib/migration-engine';

// Automatically creates initial migration from specs
migrationEngine.migrate();

// Manual migration creation
migrationEngine.createMigration('add_user_phone',
  `ALTER TABLE users ADD COLUMN phone TEXT`,
  `ALTER TABLE users DROP COLUMN phone`
);

// Create indexes
migrationEngine.createIndex('idx_users_email', 'users', ['email']);

// Get migration history
const migrations = migrationEngine.getExecutedMigrations();
```

### 7. Plugin System

Extend framework behavior with plugins:

```javascript
import { registerPlugin, executePluginAction } from '@/lib/hook-registry';

class EmailPlugin {
  async sendWelcome(context) {
    await sendEmail(context.email, 'Welcome!');
    return context;
  }
}

registerPlugin('email', new EmailPlugin());

// In spec definition
spec('user')
  .plugin('email', { onCreateSendWelcome: true })
  .build();
```

## Usage Patterns

### Pattern 1: Define Entity

```javascript
// In src/config/entities.js
export const postSpec = spec('post')
  .label('Blog Post', 'Blog Posts')
  .icon('FileText')
  .fields({
    title: { type: 'text', required: true, search: true, list: true },
    content: { type: 'textarea', required: true },
    author_id: { type: 'ref', ref: 'user', display: 'user.name' },
    published: { type: 'bool', default: false, list: true },
    tags: { type: 'json', default: [] }
  })
  .status()  // Adds status field with pending/active/archived/completed
  .list({ defaultSort: { field: 'created_at', dir: 'desc' } })
  .children({
    comments: {
      entity: 'comment',
      label: 'Comments',
      fk: 'post_id'
    }
  })
  .build();
```

### Pattern 2: Add Custom Logic

```javascript
// In application initialization
import { registerHook } from '@/lib/hook-registry';

registerHook('create:post:before', async (context) => {
  // Validate title doesn't exist
  const existing = await list('post', { title: context.data.title });
  if (existing.length) throw new Error('Title already exists');
  return context;
});

registerHook('update:post:after', async (context) => {
  // Trigger search index update
  await updateSearchIndex('post', context.data.id);
  return context;
});
```

### Pattern 3: Extend Validation

```javascript
import { registerHook } from '@/lib/hook-registry';

registerHook('validate:post', async (context) => {
  if (context.data.content.length < 100) {
    context.errors.content = 'Must be at least 100 characters';
  }
  return context;
});
```

### Pattern 4: Create Pages

```javascript
// In src/app/[entity]/page.jsx
import { createListComponent, createSearchComponent } from '@/lib/component-factory';

export default async function EntityListPage({ params }) {
  const { entity } = params;
  const List = createListComponent(entity);
  const Search = createSearchComponent(entity);

  return (
    <div>
      <Search onSearch={console.log} />
      <List />
    </div>
  );
}
```

### Pattern 5: Custom Detail Component

```javascript
// Define custom detail in spec
const postSpec = spec('post')
  .detail({ component: 'post-detail' })
  .build();

// In src/components/post-detail.jsx
export default function PostDetail({ id }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetch(`/api/post/${id}`).then(r => r.json()).then(setPost);
  }, [id]);

  return <div>{post?.title}</div>;
}
```

## Performance Optimization

### 1. Lazy Load Components

```javascript
import dynamic from 'next/dynamic';

const UserList = dynamic(() => import('@/lib/component-factory').then(m => m.createListComponent('user')), {
  loading: () => <div>Loading...</div>
});
```

### 2. Memoize Results

```javascript
import { useMemo } from 'react';

function MyList() {
  const UserList = useMemo(() => createListComponent('user'), []);
  return <UserList />;
}
```

### 3. Pagination

```javascript
const results = await list('post', {}, {
  limit: 20,
  offset: 40,
  sort: { field: 'created_at', dir: 'desc' }
});
```

## Testing

### Test Entity Specs

```javascript
import { getSpec } from '@/config';

test('user spec is valid', () => {
  const spec = getSpec('user');
  expect(spec.fields.email.type).toBe('email');
  expect(spec.access.create).toContain('admin');
});
```

### Test Validation

```javascript
import { validateEntity } from '@/lib/validation-engine';

test('validates required fields', async () => {
  const spec = getSpec('user');
  const errors = await validateEntity(spec, { email: '' });
  expect(errors.email).toBeDefined();
});
```

### Test Routes

```javascript
test('POST /api/user creates user', async () => {
  const res = await fetch('/api/user', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', name: 'Test' })
  });
  expect(res.status).toBe(201);
});
```

## Migration Guide

### Migrating from Old System

1. **Move entity specs to entities.js using builder**
2. **Replace hardcoded validations with registerHook**
3. **Replace component-specific handlers with hooks**
4. **Delete unused utility files**
5. **Update routes to use new factory**

### Adding New Entity

```javascript
// 1. Define spec in entities.js
export const commentSpec = spec('comment')
  .label('Comment', 'Comments')
  .parent('post')
  .fields({
    text: { type: 'textarea', required: true },
    author_id: { type: 'ref', ref: 'user' }
  })
  .build();

// 2. Add to allSpecs export
export const allSpecs = {
  // ... existing
  comment: commentSpec
};

// 3. Add custom logic with hooks (optional)
registerHook('create:comment:before', validateCommentOwner);

// 4. Pages auto-generated - routes auto-created
```

## Troubleshooting

**"Unknown entity" error**
- Check entity is in `allSpecs` in entities.js
- Verify specs object is populated in spec-helpers.js

**Validation not working**
- Check field config in spec has correct type
- Register custom validators with registerValidator
- Use registerHook for entity-level validation

**Routes returning 500**
- Check logs for hook errors
- Validate spec.access permissions
- Ensure database migrations ran

**Components not rendering**
- Check spec exists and is exported
- Verify required fields are defined
- Check component accepts entity prop
