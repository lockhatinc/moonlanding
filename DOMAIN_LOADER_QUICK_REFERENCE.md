# Domain Loader - Quick Reference

## Import
```javascript
import { getDomainLoader } from '@/lib/domain-loader';
const domainLoader = getDomainLoader();
```

## 10 Core Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `getEntitiesForDomain(domain)` | Get entity list | `domainLoader.getEntitiesForDomain('friday')` → `['engagement', 'rfi', ...]` |
| `getSpecsForDomain(domain)` | Get entity specs | `domainLoader.getSpecsForDomain('friday')` → `[{name: 'engagement', ...}, ...]` |
| `getFeaturesForDomain(domain)` | Get feature flags | `domainLoader.getFeaturesForDomain('friday')` → `['engagement_letter', ...]` |
| `isEntityInDomain(entity, domain)` | Check entity | `domainLoader.isEntityInDomain('engagement', 'friday')` → `true` |
| `isFeatureInDomain(feature, domain)` | Check feature | `domainLoader.isFeatureInDomain('pdf_viewer', 'mwr')` → `true` |
| `filterDataByDomain(data, domain, entity)` | Filter results | `domainLoader.filterDataByDomain(items, 'friday', 'engagement')` |
| `getDomainInfo(domain)` | Get domain config | `domainLoader.getDomainInfo('friday')` → `{name, label, features, entities}` |
| `getCurrentDomain(request)` | Extract from URL | `domainLoader.getCurrentDomain(request)` → `'friday'` or `'mwr'` |
| `getApiBasePathForDomain(domain)` | Get API path | `domainLoader.getApiBasePathForDomain('friday')` → `'/api/friday'` |
| `getValidDomains()` | List domains | `domainLoader.getValidDomains()` → `['friday', 'mwr']` |

## Domain Entities

### Friday
```javascript
['engagement', 'rfi', 'client', 'client_user', 'letter', 'rfi_section',
 'message', 'file', 'response', 'email', 'user', 'team']
```

### MWR
```javascript
['review', 'highlight', 'collaborator', 'checklist', 'tender', 'flag',
 'user', 'team']
```

### Shared
```javascript
['user', 'team']
```

## API Routes Created

### Domain Management
- `GET /api/domains` - List all domains
- `GET /api/domains/friday` - Friday domain info
- `GET /api/domains/mwr` - MWR domain info

### Friday Routes
- `GET|POST|PUT|PATCH|DELETE /api/friday/[entity]` - Generic entity CRUD
- `GET /api/friday/features` - Friday features list
- `GET /api/friday/engagement` - Engagement list (example)

### MWR Routes
- `GET|POST|PUT|PATCH|DELETE /api/mwr/[entity]` - Generic entity CRUD
- `GET /api/mwr/features` - MWR features list
- `GET /api/mwr/review` - Review list (example)

## Route Handler Pattern

```javascript
import { getDomainLoader } from '@/lib/domain-loader';
import { createCrudHandlers } from '@/lib/crud-factory';

async function handleRequest(request, context, method) {
  const domainLoader = getDomainLoader();
  const domain = 'friday'; // or 'mwr'
  const params = await context.params;
  const { entity } = params;

  // Validate entity is in domain
  if (!domainLoader.isEntityInDomain(entity, domain)) {
    throw new AppError(
      `Entity ${entity} not available in ${domain} domain`,
      'FORBIDDEN',
      HTTP.FORBIDDEN
    );
  }

  const handler = createCrudHandlers(entity);
  const modifiedRequest = new Request(request.url + `?domain=${domain}`, {
    method: request.method,
    headers: request.headers,
    body: method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined
  });

  return handler(modifiedRequest, { params });
}

export async function GET(request, context) {
  return handleRequest(request, context, 'GET');
}
```

## CRUD Factory Integration

The CRUD factory automatically validates domains:

```javascript
// In /home/user/lexco/moonlanding/src/lib/crud-factory.js
export const createCrudHandlers = (entityName) => {
  return withErrorHandler(async (request, context) => {
    const domainLoader = getDomainLoader();
    const domain = domainLoader.getCurrentDomain(request);

    // Auto-validation
    if (!domainLoader.isEntityInDomain(entityName, domain)) {
      throw new AppError(
        `Entity ${entityName} not available in domain ${domain}`,
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }
    // ... rest of handler
  }, `CRUD:${entityName}`);
};
```

## Common Patterns

### Check if feature enabled
```javascript
if (domainLoader.isFeatureInDomain('engagement_letter', 'friday')) {
  // Show engagement letter UI
}
```

### Get entities for navigation
```javascript
const domain = domainLoader.getCurrentDomain(request);
const entities = domainLoader.getEntitiesForDomain(domain);
const navItems = entities.map(e => ({ label: e, href: `/api/${domain}/${e}` }));
```

### Filter API response
```javascript
const data = list('engagement');
const filtered = domainLoader.filterDataByDomain(data, 'friday', 'engagement');
return ok(filtered);
```

## Files Modified/Created

### Created
1. `/home/user/lexco/moonlanding/src/lib/domain-loader.js` - Core DomainLoader class
2. `/home/user/lexco/moonlanding/src/app/api/friday/[entity]/route.js` - Friday CRUD routes
3. `/home/user/lexco/moonlanding/src/app/api/mwr/[entity]/route.js` - MWR CRUD routes
4. `/home/user/lexco/moonlanding/src/app/api/domains/route.js` - Domains list API
5. `/home/user/lexco/moonlanding/src/app/api/domains/[domain]/route.js` - Domain detail API
6. `/home/user/lexco/moonlanding/src/app/api/friday/features/route.js` - Friday features API
7. `/home/user/lexco/moonlanding/src/app/api/mwr/features/route.js` - MWR features API
8. `/home/user/lexco/moonlanding/src/app/api/friday/engagement/route.js` - Example Friday entity
9. `/home/user/lexco/moonlanding/src/app/api/mwr/review/route.js` - Example MWR entity

### Modified
1. `/home/user/lexco/moonlanding/src/lib/crud-factory.js` - Added domain validation

## Testing Commands

```bash
# List domains
curl http://localhost:3000/api/domains

# Get Friday info
curl http://localhost:3000/api/domains/friday

# Get MWR info
curl http://localhost:3000/api/domains/mwr

# List Friday features
curl http://localhost:3000/api/friday/features

# List MWR features
curl http://localhost:3000/api/mwr/features

# Access Friday entity
curl http://localhost:3000/api/friday/engagement

# Access MWR entity
curl http://localhost:3000/api/mwr/review

# Invalid access (should fail with 403)
curl http://localhost:3000/api/mwr/engagement  # engagement not in MWR
curl http://localhost:3000/api/friday/highlight  # highlight not in Friday
```

## Error Responses

### Entity not in domain
```json
{
  "error": "Entity engagement not available in domain mwr",
  "code": "FORBIDDEN",
  "status": 403
}
```

### Invalid domain
```json
{
  "error": "Invalid domain: invalid. Valid domains: friday, mwr",
  "status": 400
}
```

## Configuration Source

Domain definitions in `/home/user/lexco/moonlanding/src/config/master-config.yml`:

```yaml
domains:
  friday:
    entities: [engagement, rfi, client, ...]
    features: {engagement_management: true, rfi_workflow: true, ...}

  mwr:
    entities: [review, highlight, collaborator, ...]
    features: {review_management: true, pdf_viewer: true, ...}
```

## Key Design Decisions

1. **Default Domain**: Friday (if not specified)
2. **Case Insensitive**: Domain names normalized to lowercase
3. **Shared Entities**: User and team available in both domains
4. **No Placeholders**: All code production-ready
5. **Error Handling**: Comprehensive validation and error messages
6. **Singleton Pattern**: `getDomainLoader()` returns global instance
