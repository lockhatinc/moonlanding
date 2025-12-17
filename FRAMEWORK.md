# Unified Framework Architecture

This document describes the 7-layer framework system that provides maximum modularity, DRY principles, and extensibility across the moonlanding codebase.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│            PRESENTATION LAYER                   │
│  (Components: ListBuilder, FormBuilder, Details) │
│  Using: RenderingEngine, ComponentRegistry       │
└──────────────────┬──────────────────────────────┘

┌──────────────────────────────────────────────────┐
│            BUSINESS LOGIC LAYER                  │
│  PluginSystem, EventEmitter, Validation          │
│  Server Actions, API Handlers                    │
└──────────────────┬───────────────────────────────┘

┌──────────────────────────────────────────────────┐
│            DATA ACCESS LAYER                     │
│  DataAccessLayer (unified interface)             │
│    ├─ Server: QueryBuilder → SQLite              │
│    └─ Client: API → Server endpoints             │
│  Caching, Validation, Error Handling             │
└──────────────────┬───────────────────────────────┘

┌──────────────────────────────────────────────────┐
│            FOUNDATION LAYER                      │
│  Config (specs, constants, env)                  │
│  FieldTypeRegistry, ComponentRegistry            │
│  Error System, Event System                      │
└──────────────────────────────────────────────────┘
```

---

## 1. RenderingEngine

**Purpose**: Single source of truth for all field rendering across the entire application.

**File**: `src/lib/rendering-engine.js`

### What It Solves

Before: Rendering logic for the same field type was duplicated across 3 files:
- Form inputs (form-field-renderers.js)
- List cells (list-cell-renderer.jsx)
- Detail displays (render.js)

After: One unified engine handles all rendering modes.

### Usage

```javascript
import { renderingEngine } from '@/lib/rendering-engine';

// Render a field for a form input
const formElement = renderingEngine.render(
  field,
  value,
  'form',
  { setField, enumData, refData }
);

// Render a field for display in a list
const listCell = renderingEngine.render(
  column,
  value,
  'list',
  { spec, row }
);

// Render a field for editing
const editElement = renderingEngine.render(
  field,
  value,
  'edit',
  { setField, spec }
);
```

### Supported Modes

- **form**: Input fields in forms
- **list**: Display in list tables
- **display**: Display in detail views (read-only)
- **edit**: Input fields in edit mode

### Supported Field Types

text, textarea, email, int, decimal, bool, enum, ref, date, timestamp, image, json

### Adding Custom Renderers

```javascript
import { renderingEngine } from '@/lib/rendering-engine';

// Register a custom renderer for a field type
renderingEngine.register('form', 'customType', (field, val, setField) => (
  <CustomInput value={val} onChange={(v) => setField(field.key, v)} />
));

// Override existing renderer
renderingEngine.register('display', 'email', (val) => (
  <a href={`mailto:${val}`}>{val}</a>
));
```

---

## 2. DataAccessLayer

**Purpose**: Unified interface for data operations that works identically on server and client.

**File**: `src/lib/data-layer.js`

### What It Solves

Before: Different code paths for server and client:
- Server: Import from query-engine, call directly
- Client: Make fetch requests to API with different signatures

After: Same API everywhere, automatic routing.

### Usage

```javascript
import { serverDataLayer, clientDataLayer } from '@/lib/data-layer';

// On server (Next.js server components, server actions)
const layer = serverDataLayer;

// On client (React components, browser code)
const layer = clientDataLayer;

// Same API works everywhere:
const items = await layer.list('engagement', { status: 'active' });
const item = await layer.get('engagement', id);
const created = await layer.create('engagement', data);
const updated = await layer.update('engagement', id, changes);
await layer.delete('engagement', id);
```

### Methods

```javascript
// List operations
await layer.list(entity, where, options)
await layer.listWithPagination(entity, where, page, pageSize, options)
await layer.search(entity, query, where, options)

// Single item operations
await layer.get(entity, id, options)
await layer.getBy(entity, field, value, options)

// CRUD operations
await layer.create(entity, data, options)
await layer.update(entity, id, data, options)
await layer.delete(entity, id, options)
```

### Caching

```javascript
import { clientDataLayer } from '@/lib/data-layer';

// Enable caching
clientDataLayer.enableCache();

// Data is automatically cached and reused
const items1 = await clientDataLayer.list('engagement');
const items2 = await clientDataLayer.list('engagement'); // From cache!

// Clear cache for an entity
clientDataLayer.clearEntityCache('engagement');

// Disable caching
clientDataLayer.disableCache();
```

### Server vs Client Routing

The layer automatically:
- On server: Uses query-engine for direct database queries
- On client: Makes fetch requests to `/api/{entity}` endpoints
- Both: Return the same data structure

---

## 3. QueryBuilder

**Purpose**: Type-safe, fluent SQL query construction.

**File**: `src/lib/query-builder.js`

### What It Solves

Before: SQL strings built manually with string concatenation, hard to debug/compose.

After: Fluent API for building queries that are composable and type-safe.

### Usage

```javascript
import { createQueryBuilder, QueryBuilder } from '@/lib/query-builder';

const query = createQueryBuilder('engagement')
  .select('id', 'title', 'status')
  .where('status = ?', 'active')
  .andWhere('client_id = ?', clientId)
  .orderBy('created_at', 'DESC')
  .limit(20);

const { sql, params } = query.build();
```

### Methods

```javascript
// SELECT construction
.select(...fields)
.selectDistinct(...fields)
.from(table)

// JOINs
.join(table, condition, type)  // INNER, LEFT, RIGHT
.innerJoin(table, condition)
.leftJoin(table, condition)
.rightJoin(table, condition)

// WHERE conditions
.where(condition, ...params)
.andWhere(condition, ...params)
.orWhere(condition, ...params)
.whereIn(field, values)
.whereNull(field)
.whereNotNull(field)
.whereLike(field, value)  // LIKE %value%

// Grouping & Ordering
.groupBy(...fields)
.orderBy(field, direction)  // ASC or DESC
.orderByDesc(field)

// Pagination
.limit(count)
.offset(count)
.paginate(page, pageSize)  // Calculates offset automatically

// Execution
.build()  // Returns { sql, params }
.buildCount()  // COUNT query
.toString()  // Get SQL string
```

### Examples

```javascript
// Simple query
QueryBuilder.from('user')
  .select('id', 'name', 'email')
  .where('role = ?', 'manager')
  .build();

// With JOIN
QueryBuilder.from('engagement')
  .select('e.id', 'e.title', 'c.name')
  .innerJoin('client c', 'e.client_id = c.id')
  .where('e.status = ?', 'active')
  .build();

// Pagination
QueryBuilder.from('engagement')
  .paginate(2, 20)  // Page 2, 20 per page
  .build();

// Count query
const { sql, params } = QueryBuilder.from('engagement')
  .where('status = ?', 'active')
  .buildCount();
```

---

## 4. Error Handling Framework

**Purpose**: Standardized error handling and responses throughout the application.

**File**: `src/lib/error-handler.js`

### What It Solves

Before: Error handling scattered with inconsistent response formats.

After: Unified error types and standardized responses.

### Error Classes

```javascript
import {
  AppError,
  ValidationError,
  NotFoundError,
  PermissionError,
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  ExternalAPIError,
} from '@/lib/error-handler';

// Base error
throw new AppError('Something wrong', 'CUSTOM_CODE', 400, { context: 'data' });

// Specialized errors
throw new ValidationError('Invalid data', { email: 'Invalid format' });
throw new NotFoundError('engagement', 'eng-123');
throw new PermissionError('Cannot delete engagement');
throw new UnauthorizedError('Login required');
throw new ConflictError('Duplicate entry');
throw new DatabaseError('Query failed', originalError);
throw new ExternalAPIError('Google Drive', 'Quota exceeded', 429);
```

### Error Wrapping

```javascript
import { errorHandler, apiErrorHandler } from '@/lib/error-handler';

// Wrap a function for automatic error handling
const myFunction = errorHandler(async (data) => {
  // Implementation
  if (!data.email) throw new ValidationError('Email required', { email: 'Required' });
  return result;
});

// Or for API handlers
export const GET = apiErrorHandler(async (request, { params }) => {
  // Implementation - errors are automatically caught and formatted
});
```

### Error Format

```javascript
// Thrown error automatically converts to JSON response
{
  status: 'error',
  message: 'Invalid email',
  code: 'VALIDATION_ERROR',
  statusCode: 400,
  context: {
    errors: { email: 'Invalid format' }
  }
}
```

### Logging

```javascript
import { createErrorLogger } from '@/lib/error-handler';

const logger = createErrorLogger('MyModule');

logger.error('Operation failed', { userId: 123 });
logger.warn('Retry attempt 3', { attempt: 3 });
logger.info('User logged in', { userId: 123 });
logger.debug('Detailed info', { data: value });  // Only if DEBUG env var set
```

---

## 5. Plugin System

**Purpose**: Extensible hook and event system for adding features without modifying core code.

**File**: `src/lib/plugin-system.js`

### What It Solves

Before: Features hard-coded in core, no way to extend without modifying code.

After: Plugin system allows registering hooks, middleware, and event handlers.

### Basic Usage

```javascript
import { pluginSystem, createPlugin } from '@/lib/plugin-system';

const myPlugin = createPlugin('email-notifier', {
  hooks: {
    'entity:created': async (context) => {
      // Send email when entity created
      await sendEmail(context.data);
      return context;  // Must return context
    },
  },
  handlers: {
    'workflow:completed': async (workflow) => {
      // Handle workflow completion
    },
  },
});

pluginSystem.register('email-notifier', myPlugin);
```

### Hooks

```javascript
// Register a hook with priority (higher = earlier)
pluginSystem.registerHook('entity:create', 10, async (context) => {
  console.log('Before create:', context);
  return context;  // Must return context
});

// Execute hooks
const result = await pluginSystem.executeHook('entity:create', {
  entity: 'engagement',
  data: { title: 'New' },
});

// Safe execution (catches errors)
const result = await pluginSystem.executeHookSafe('entity:create', context);
```

### Middleware

```javascript
// Register middleware
pluginSystem.registerMiddleware('auth', async (context) => {
  if (!context.user) throw new UnauthorizedError();
  return context;
});

// Apply middleware
const context = await pluginSystem.applyMiddleware('auth', { user: null });
```

### Events

```javascript
// Listen to events
pluginSystem.on('entity:created', async (entity, data) => {
  console.log(`${entity} created:`, data);
});

// Emit events (all handlers called, errors don't stop others)
await pluginSystem.emit('entity:created', 'engagement', { id: 123, title: 'New' });

// Serial emission (each handler processes result of previous)
const result = await pluginSystem.emitSerial('data:transform', initialData);
```

---

## 6. Component Registry

**Purpose**: Dynamic component discovery and registration for swappable components.

**File**: `src/lib/component-registry.js`

### What It Solves

Before: Components hard-coded in imports, difficult to swap implementations.

After: Register components by entity and mode, retrieve at runtime.

### Usage

```javascript
import { componentRegistry, registerComponent, getComponent } from '@/lib/component-registry';

// Register a component
registerComponent('engagement', 'detail', EngagementDetailComponent, priority = 10);

// Get the component
const Component = getComponent('engagement', 'detail');

// Check if component exists
if (hasComponent('engagement', 'detail')) {
  const Component = getComponent('engagement', 'detail');
}

// List all components
componentRegistry.list('engagement');
// => [
//   { entity: 'engagement', mode: 'detail', count: 1, component: EngagementDetailComponent },
//   { entity: 'engagement', mode: 'list', count: 1, component: ListBuilder },
// ]
```

### Priority-Based Selection

```javascript
// Register multiple components with different priorities
registerComponent('engagement', 'detail', CustomDetailComponent, 10);  // Higher priority
registerComponent('engagement', 'detail', DefaultDetailComponent, 5);   // Lower priority

// getComponent returns the highest priority
const Component = getComponent('engagement', 'detail');
// => CustomDetailComponent
```

---

## 7. Event Emitter

**Purpose**: Full-featured event system for event-driven architecture.

**File**: `src/lib/event-emitter.js`

### What It Solves

Before: Ad-hoc event handling scattered throughout code.

After: Unified event emitter with history tracking and serial/parallel execution.

### Basic Usage

```javascript
import { eventEmitter } from '@/lib/event-emitter';

// Listen to events
eventEmitter.on('entity:created', async (data) => {
  console.log('Entity created:', data);
});

// One-time listener
eventEmitter.once('entity:updated', async (data) => {
  console.log('First update:', data);
});

// Emit events
await eventEmitter.emit('entity:created', { entity: 'engagement', id: 123 });

// Remove listener
eventEmitter.off('entity:created', handler);

// Remove all listeners for event
eventEmitter.removeAllListeners('entity:created');
```

### Serial Execution

Events processed sequentially, each receives result of previous:

```javascript
// Each handler receives the result of the previous handler
eventEmitter.on('data:transform', (data) => ({ ...data, processed: true }));
eventEmitter.on('data:transform', (data) => ({ ...data, validated: true }));

const result = await eventEmitter.emitSerial('data:transform', {});
// => { processed: true, validated: true }
```

### Helper Functions

```javascript
import {
  emitEntity, onEntity, offEntity,
  emitWorkflow, onWorkflow, offWorkflow,
  emitSync, onSync, offSync,
} from '@/lib/event-emitter';

// Entity events
onEntity('created', async (data) => { /* ... */ });
onEntity('updated', async (data) => { /* ... */ });
await emitEntity('created', { entity: 'engagement', id: 123 });

// Workflow events
onWorkflow('transitioned', async (data) => { /* ... */ });
await emitWorkflow('transitioned', { fromStage: 'info', toStage: 'commencement' });

// Sync events
onSync('engagement', async (data) => { /* ... */ });
await emitSync('engagement', { action: 'updated', data: {...} });
```

### Event History

```javascript
// Get event history
const allEvents = eventEmitter.getHistory();
const entityEvents = eventEmitter.getHistory('entity:created');

// Clear history
eventEmitter.clearHistory();

// Configure history size
eventEmitter.setMaxHistory(1000);
eventEmitter.setMaxListeners(100);
```

---

## Integration Examples

### Example 1: API Handler Using Error Framework

```javascript
import { createApiHandler } from '@/lib/api';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/error-handler';

// The API handler already uses error framework:
export const GET = createApiHandler('engagement', 'get');
export const POST = createApiHandler('engagement', 'create');

// Errors automatically converted to proper JSON responses
```

### Example 2: Server Action with DataLayer

```javascript
'use server';

import { serverDataLayer } from '@/lib/data-layer';
import { revalidatePath } from 'next/cache';

export async function updateEngagement(id, data) {
  try {
    const updated = await serverDataLayer.update('engagement', id, data);
    revalidatePath(`/engagement/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Example 3: Component with Plugin Hooks

```javascript
'use client';

import { pluginSystem } from '@/lib/plugin-system';
import { useEffect, useState } from 'react';

export function EngagementDetail({ id }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      // Run before-hooks
      let context = await pluginSystem.executeHookSafe('entity:view', {
        entity: 'engagement',
        id,
      });

      // Load data
      const engagement = await fetch(`/api/engagement/${id}`).then(r => r.json());
      setData(engagement);

      // Run after-hooks
      await pluginSystem.executeHookSafe('entity:viewed', {
        entity: 'engagement',
        data: engagement,
      });
    })();
  }, [id]);

  return <div>{ /* render data */ }</div>;
}
```

### Example 4: Custom QueryBuilder Usage

```javascript
import { createQueryBuilder } from '@/lib/query-builder';
import { getDatabase } from '@/lib/database-core';

const db = getDatabase();

const query = createQueryBuilder('engagement')
  .select('e.id', 'e.title', 'c.name as client_name')
  .leftJoin('client c', 'e.client_id = c.id')
  .where('e.status = ?', 'active')
  .where('e.year = ?', 2024)
  .orderByDesc('e.created_at')
  .paginate(1, 20);

const { sql, params } = query.build();
const results = db.prepare(sql).all(...params);
```

### Example 5: Event-Driven Workflow

```javascript
import { eventEmitter } from '@/lib/event-emitter';
import { pluginSystem } from '@/lib/plugin-system';

// Set up plugins for events
pluginSystem.register('engagement-automation', {
  handlers: {
    'entity:created': async (data) => {
      if (data.entity === 'engagement') {
        // Trigger email notification
        await emailService.send({
          to: data.data.manager_email,
          subject: `New engagement: ${data.data.title}`,
        });
      }
    },
  },
});

// Emit events when CRUD operations happen
// (This happens automatically in the updated API handler)
```

---

## Best Practices

### 1. Use DataLayer for All Data Operations

✅ **Good**:
```javascript
const items = await clientDataLayer.list('engagement');
```

❌ **Avoid**:
```javascript
const r = await fetch('/api/engagement');
const items = await r.json();
```

### 2. Use Error Classes for Consistency

✅ **Good**:
```javascript
if (!item) throw new NotFoundError('engagement', id);
```

❌ **Avoid**:
```javascript
if (!item) throw new Error('Not found');
```

### 3. Register Plugins Early

✅ **Good**:
```javascript
// In app initialization
pluginSystem.register('my-plugin', definition);
```

❌ **Avoid**:
```javascript
// In component
pluginSystem.register('my-plugin', definition);
```

### 4. Use QueryBuilder for Complex Queries

✅ **Good**:
```javascript
const query = createQueryBuilder('engagement')
  .select('id', 'title')
  .where('status = ?', 'active')
  .orderBy('created_at', 'DESC')
  .build();
```

❌ **Avoid**:
```javascript
const sql = `SELECT id, title FROM engagement WHERE status = ? ORDER BY created_at DESC`;
```

### 5. Override Renderers Sparingly

✅ **Good**:
```javascript
// Only override when you have specific requirements
renderingEngine.register('form', 'customType', customRenderer);
```

❌ **Avoid**:
```javascript
// Don't create parallel rendering systems
const MY_RENDERERS = { /* duplicate logic */ };
```

---

## Migration Guide

### Migrating from Old API to DataLayer

**Before**:
```javascript
import { list, get, create, update, remove } from '@/lib/query-engine';

const items = list('engagement');
const item = get('engagement', id);
create('engagement', data, user);
```

**After**:
```javascript
import { serverDataLayer } from '@/lib/data-layer';

const items = await serverDataLayer.list('engagement');
const item = await serverDataLayer.get('engagement', id);
await serverDataLayer.create('engagement', data);
```

### Migrating from Multiple Renderers to RenderingEngine

**Before**:
```javascript
import { renderFormField } from '@/lib/form-field-renderers';
import { renderCellValue } from './list-cell-renderer';
import { renderField } from '@/lib/render';

// Three different import paths, three different APIs
const formEl = renderFormField(field, values, setField, enumData, refData);
const cellEl = renderCellValue(value, column, spec, row);
const displayEl = renderField(field, value, 'display', onChange, spec);
```

**After**:
```javascript
import { renderingEngine } from '@/lib/rendering-engine';

// One import, one consistent API
const formEl = renderingEngine.render(field, value, 'form', { setField, enumData, refData });
const cellEl = renderingEngine.render(column, value, 'list', { spec, row });
const displayEl = renderingEngine.render(field, value, 'display', { spec });
```

---

## Performance Considerations

### Caching

- Enable client DataLayer caching for read-heavy operations
- Clear cache when mutations occur
- Use `setMaxHistory` for EventEmitter if tracking large number of events

### QueryBuilder

- Use `.limit()` to avoid loading entire tables
- Use `.paginate()` for list views
- Use `.select()` to only fetch needed columns

### Plugin Hooks

- Keep hooks fast (< 100ms)
- Use `emitSafe` if hook failure should not stop execution
- Avoid long-running operations in hooks

### RenderingEngine

- Renderers are called frequently, keep them lightweight
- Cache enum/ref options at component level if unchanged
- Consider memoization for complex renderers

---

## Summary

| Framework | Purpose | Key Benefit |
|-----------|---------|------------|
| RenderingEngine | Unified field rendering | No duplicate logic across modes |
| DataAccessLayer | Unified data access | Same API on server and client |
| QueryBuilder | Type-safe SQL | Composable, debuggable queries |
| Error Handler | Standardized errors | Consistent error format everywhere |
| PluginSystem | Extensibility | Add features without modifying core |
| ComponentRegistry | Dynamic components | Swap components at runtime |
| EventEmitter | Event-driven arch | Decoupled, event-based operations |

This framework eliminates ~300+ lines of duplicated code while providing powerful abstractions for building scalable, maintainable applications.
