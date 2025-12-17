# Framework Usage Examples

Real-world examples showing how to use the unified framework system.

---

## Example 1: Server Action with Data Layer

**Goal**: Create a server action that updates engagement data with proper error handling.

```javascript
// src/app/actions/engagement.js
'use server';

import { serverDataLayer } from '@/lib/data-layer';
import { ValidationError, NotFoundError } from '@/lib/error-handler';
import { revalidatePath } from 'next/cache';
import { eventEmitter } from '@/lib/event-emitter';

export async function updateEngagement(id, updates) {
  try {
    // Validate ID
    if (!id) throw new ValidationError('ID required', { id: 'Required' });

    // Get existing engagement
    const existing = await serverDataLayer.get('engagement', id);
    if (!existing) throw new NotFoundError('engagement', id);

    // Update via data layer
    const updated = await serverDataLayer.update('engagement', id, updates);

    // Emit event for plugins
    await eventEmitter.emit('entity:updated', {
      entity: 'engagement',
      id,
      oldData: existing,
      newData: updated,
    });

    // Revalidate the page
    revalidatePath(`/engagement/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error('[Action] updateEngagement error:', error);
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
    };
  }
}
```

**Usage in Component**:

```javascript
'use client';

import { updateEngagement } from '@/app/actions/engagement';
import { useState } from 'react';

export function EngagementEditor({ id, initialData }) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (updates) => {
    setSaving(true);
    const result = await updateEngagement(id, updates);

    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
    }
    setSaving(false);
  };

  return <div>{/* editor UI */}</div>;
}
```

---

## Example 2: Custom Rendering for Engagement Status

**Goal**: Add a custom renderer that colors engagement statuses based on custom logic.

```javascript
// src/lib/custom-renderers.js
import { renderingEngine } from '@/lib/rendering-engine';
import { Badge } from '@mantine/core';

// Override the enum renderer for engagement status fields
renderingEngine.register('display', 'enum', (value, field, spec) => {
  // Special handling for engagement status
  if (field.options === 'engagement_status') {
    const statusColors = {
      'pending': 'gray',
      'active': 'blue',
      'completed': 'green',
      'archived': 'red',
    };

    return <Badge color={statusColors[value]}>{value}</Badge>;
  }

  // Fall back to default enum rendering
  return renderingEngine.getRenderer('display', 'enum')(value, field, spec);
});
```

**Initialize in app layout or root component**:

```javascript
// src/app/layout.jsx
import '@/lib/custom-renderers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## Example 3: Plugin for Email Notifications

**Goal**: Create a plugin that automatically sends emails when engagements are created.

```javascript
// src/plugins/email-notifier.js
import { pluginSystem } from '@/lib/plugin-system';
import { eventEmitter } from '@/lib/event-emitter';

export function setupEmailNotifier() {
  // Listen to entity creation events
  eventEmitter.on('entity:created', async (data) => {
    if (data.entity === 'engagement') {
      // Send email to manager
      await sendEngagementNotification(data.data);
    }
  });

  // Listen to entity update events
  eventEmitter.on('entity:updated', async (data) => {
    if (data.entity === 'engagement' && data.newData.stage !== data.oldData.stage) {
      // Stage changed, send notification
      await sendStageTransitionEmail(data);
    }
  });
}

async function sendEngagementNotification(engagement) {
  // Use your email service
  await emailService.send({
    to: engagement.manager_email,
    template: 'engagement-created',
    data: {
      engagementTitle: engagement.title,
      clientName: engagement.client_name,
      year: engagement.year,
    },
  });
}

async function sendStageTransitionEmail(data) {
  await emailService.send({
    to: data.newData.manager_email,
    template: 'engagement-stage-changed',
    data: {
      engagementTitle: data.newData.title,
      fromStage: data.oldData.stage,
      toStage: data.newData.stage,
    },
  });
}

// Initialize in app
setupEmailNotifier();
```

---

## Example 4: Complex Query with QueryBuilder

**Goal**: Build a complex query for engagement reporting with joins and filtering.

```javascript
// src/app/api/reports/engagement-summary/route.js
import { serverDataLayer } from '@/lib/data-layer';
import { createQueryBuilder } from '@/lib/query-builder';
import { getDatabase } from '@/lib/database-core';
import { apiErrorHandler } from '@/lib/error-handler';

export const GET = apiErrorHandler(async (request, { searchParams }) => {
  const year = searchParams.get('year');
  const stage = searchParams.get('stage');
  const db = getDatabase();

  // Build complex query
  const query = createQueryBuilder('engagement')
    .select([
      'e.id',
      'e.title',
      'e.year',
      'e.stage',
      'COUNT(r.id) as review_count',
      'COUNT(h.id) as highlight_count',
    ])
    .leftJoin('review r', 'e.id = r.engagement_id')
    .leftJoin('highlight h', 'r.id = h.review_id')
    .where('e.year = ?', year);

  if (stage) {
    query.andWhere('e.stage = ?', stage);
  }

  query
    .groupBy('e.id', 'e.title', 'e.year', 'e.stage')
    .orderByDesc('e.created_at');

  const { sql, params } = query.build();
  const summary = db.prepare(sql).all(...params);

  return Response.json({ status: 'success', data: summary });
});
```

---

## Example 5: Component with Error Handling

**Goal**: Create a component that fetches and displays data with proper error handling.

```javascript
// src/components/EngagementList.jsx
'use client';

import { useEffect, useState } from 'react';
import { clientDataLayer } from '@/lib/data-layer';
import { ListBuilder } from '@/components/builders/list-builder';
import { ValidationError, AppError } from '@/lib/error-handler';

export function EngagementList({ year }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Use data layer
        const items = await clientDataLayer.list('engagement', { year });
        setData(items);
      } catch (err) {
        if (err instanceof AppError) {
          setError({
            message: err.message,
            code: err.code,
          });
        } else {
          setError({ message: 'Failed to load engagements' });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [year]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error.message}</div>;

  return <ListBuilder spec={engagementSpec} data={data} />;
}
```

---

## Example 6: Custom Hook for Engagement Operations

**Goal**: Create a custom hook that provides engagement operations with error handling.

```javascript
// src/hooks/useEngagement.js
import { useState, useCallback } from 'react';
import { clientDataLayer } from '@/lib/data-layer';
import { AppError } from '@/lib/error-handler';

export function useEngagement(id) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const engagement = await clientDataLayer.get('engagement', id);
      setData(engagement);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const update = useCallback(async (updates) => {
    try {
      setError(null);
      const updated = await clientDataLayer.update('engagement', id, updates);
      setData(updated);
      return { success: true };
    } catch (err) {
      const msg = err instanceof AppError ? err.message : 'Update failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [id]);

  const delete_ = useCallback(async () => {
    try {
      setError(null);
      await clientDataLayer.delete('engagement', id);
      setData(null);
      return { success: true };
    } catch (err) {
      const msg = err instanceof AppError ? err.message : 'Delete failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [id]);

  return {
    data,
    error,
    loading,
    load,
    update,
    delete: delete_,
    refresh: load,
  };
}

// Usage in component
export function EngagementDetail({ id }) {
  const { data, loading, error, update } = useEngagement(id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <button onClick={() => update({ status: 'completed' })}>Complete</button>
    </div>
  );
}
```

---

## Example 7: Validation with Error Framework

**Goal**: Validate form data and report errors properly.

```javascript
// src/lib/validation-helpers.js
import { ValidationError } from '@/lib/error-handler';

export async function validateEngagement(data) {
  const errors = {};

  // Title validation
  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }
  if (data.title?.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }

  // Year validation
  if (!data.year) {
    errors.year = 'Year is required';
  }
  if (data.year < 2000 || data.year > 2100) {
    errors.year = 'Year must be between 2000 and 2100';
  }

  // Client ID validation
  if (!data.client_id) {
    errors.client_id = 'Client is required';
  }

  // If there are errors, throw ValidationError
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Engagement validation failed', errors);
  }

  return true;
}

// Usage in server action
export async function createEngagement(formData) {
  try {
    await validateEngagement(formData);
    const result = await serverDataLayer.create('engagement', formData);
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { success: false, errors: err.errors };
    }
    return { success: false, error: err.message };
  }
}
```

---

## Example 8: Conditional Field Rendering

**Goal**: Render different field types based on conditions in a form.

```javascript
// src/components/DynamicFormBuilder.jsx
'use client';

import { renderingEngine } from '@/lib/rendering-engine';
import { Stack, Button } from '@mantine/core';
import { useState } from 'react';

export function DynamicFormBuilder({ spec, fields, onSubmit }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const visibleFields = fields.filter(field => {
    // Show field if no condition, or condition is true
    if (!field.condition) return true;
    return field.condition(values);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {visibleFields.map(field => (
          <div key={field.key}>
            {renderingEngine.render(
              field,
              values[field.key],
              'form',
              { setField, spec }
            )}
            {errors[field.key] && (
              <div style={{ color: 'red', fontSize: 12 }}>
                {errors[field.key]}
              </div>
            )}
          </div>
        ))}
        <Button type="submit">Save</Button>
      </Stack>
    </form>
  );
}

// Usage
<DynamicFormBuilder
  spec={engagementSpec}
  fields={[
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    {
      key: 'client_id',
      label: 'Client',
      type: 'ref',
      condition: (values) => !!values.title, // Only show if title is filled
    },
  ]}
  onSubmit={handleSubmit}
/>
```

---

## Example 9: API Handler with Plugin Hooks

**Goal**: Add hooks to API handler that plugins can use for custom logic.

```javascript
// src/lib/api-with-hooks.js
import { createApiHandler } from '@/lib/api';
import { pluginSystem } from '@/lib/plugin-system';

export const createHookedApiHandler = (entity, action) => {
  const baseHandler = createApiHandler(entity, action);

  return async (request, context) => {
    // Run before hooks
    const beforeContext = await pluginSystem.executeHookSafe(
      `api:${action}:before`,
      { entity, action, request }
    );

    // Call base handler
    const response = await baseHandler(request, context);

    // Run after hooks
    await pluginSystem.executeHookSafe(
      `api:${action}:after`,
      { entity, action, response }
    );

    return response;
  };
};

// Register hooks in a plugin
pluginSystem.register('logging-plugin', {
  hooks: {
    'api:create:before': async (context) => {
      console.log(`[API] Creating ${context.entity}`);
      return context;
    },
    'api:create:after': async (context) => {
      console.log(`[API] Created ${context.entity}, status: ${context.response.status}`);
      return context;
    },
  },
});
```

---

## Example 10: Event-Driven Workflow Automation

**Goal**: Automatically transition engagement stages based on events.

```javascript
// src/plugins/workflow-automation.js
import { eventEmitter } from '@/lib/event-emitter';
import { serverDataLayer } from '@/lib/data-layer';

export function setupWorkflowAutomation() {
  // When all reviews are closed, auto-transition to next stage
  eventEmitter.on('entity:updated', async (data) => {
    if (data.entity === 'review' && data.newData.status === 'closed') {
      // Check if all reviews for engagement are closed
      const reviews = await serverDataLayer.list('review', {
        engagement_id: data.newData.engagement_id,
      });

      const allClosed = reviews.every(r => r.status === 'closed');

      if (allClosed) {
        // Auto-transition engagement
        const engagement = await serverDataLayer.get('engagement', data.newData.engagement_id);
        const nextStage = getNextStage(engagement.stage);

        if (nextStage) {
          await serverDataLayer.update('engagement', engagement.id, {
            stage: nextStage,
          });

          // Emit workflow event
          await eventEmitter.emit('workflow:auto-transitioned', {
            engagement: engagement.id,
            fromStage: engagement.stage,
            toStage: nextStage,
          });
        }
      }
    }
  });
}

function getNextStage(current) {
  const transitions = {
    'info_gathering': 'commencement',
    'commencement': 'team_execution',
    'team_execution': 'partner_review',
    'partner_review': 'finalization',
    'finalization': 'close_out',
  };
  return transitions[current];
}

// Initialize
setupWorkflowAutomation();
```

---

## Summary of Patterns

| Pattern | Use When | Key Framework |
|---------|----------|--------------|
| Server Action | Mutating data on server | serverDataLayer, error handling |
| Custom Renderer | Need special UI for field | renderingEngine |
| Plugin Hook | Want to extend without modifying | pluginSystem |
| Complex Query | Need filtered/joined data | QueryBuilder |
| Component Logic | Fetching data in component | clientDataLayer, error handling |
| Custom Hook | Reusable async logic | useEffects + dataLayer |
| Validation | Form validation logic | ValidationError |
| Conditional Rendering | Show/hide based on state | renderingEngine |
| API Hooks | Intercept API calls | pluginSystem |
| Event Automation | React to changes | eventEmitter |

Each pattern leverages one or more of the 7 framework layers to solve common problems with consistent, minimal code.
