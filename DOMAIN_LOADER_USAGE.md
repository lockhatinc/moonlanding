# Domain Loader - Usage Guide

## Overview

The `DomainLoader` class provides domain-specific entity and feature filtering for Friday (engagement management) and MWR (PDF review collaboration) domains.

## Implementation Details

### Core File
- **Location**: `/home/user/lexco/moonlanding/src/lib/domain-loader.js`
- **Class**: `DomainLoader`
- **Dependencies**: `ConfigGeneratorEngine` from `/home/user/lexco/moonlanding/src/lib/config-generator-engine.js`

### Configuration Source
Domain configuration is defined in `/home/user/lexco/moonlanding/src/config/master-config.yml`:

```yaml
domains:
  friday:
    entities: [engagement, rfi, client, client_user, letter, rfi_section, message, file, response, email, user, team]
    features: [engagement_management, rfi_workflow, engagement_letter, client_feedback, recreation, team_management, client_management]

  mwr:
    entities: [review, highlight, collaborator, checklist, tender, flag, user, team]
    features: [review_management, pdf_viewer, highlight_collaboration, checklist_management, tender_tracking, pdf_comparison, priority_reviews, chat_merge, collaborator_management]
```

## API Methods

### 1. getEntitiesForDomain(domainName)
Returns array of entity names for the specified domain.

```javascript
import { getDomainLoader } from '@/lib/domain-loader';

const domainLoader = getDomainLoader();
const fridayEntities = domainLoader.getEntitiesForDomain('friday');
// Returns: ['engagement', 'rfi', 'client', 'client_user', 'letter', 'rfi_section', 'message', 'file', 'response', 'email', 'user', 'team']

const mwrEntities = domainLoader.getEntitiesForDomain('mwr');
// Returns: ['review', 'highlight', 'collaborator', 'checklist', 'tender', 'flag', 'user', 'team']
```

### 2. getSpecsForDomain(domainName)
Returns array of generated entity specs for all entities in the domain.

```javascript
const fridaySpecs = domainLoader.getSpecsForDomain('friday');
// Returns: [{ name: 'engagement', label: 'Engagement', ... }, { name: 'rfi', ... }, ...]
```

### 3. getFeaturesForDomain(domainName)
Returns array of feature flag names enabled for the domain.

```javascript
const fridayFeatures = domainLoader.getFeaturesForDomain('friday');
// Returns: ['engagement_management', 'rfi_workflow', 'engagement_letter', 'client_feedback', 'recreation', 'team_management', 'client_management']

const mwrFeatures = domainLoader.getFeaturesForDomain('mwr');
// Returns: ['review_management', 'pdf_viewer', 'highlight_collaboration', 'checklist_management', 'tender_tracking', 'pdf_comparison', 'priority_reviews', 'chat_merge', 'collaborator_management']
```

### 4. isEntityInDomain(entityName, domainName)
Checks if an entity belongs to a specific domain.

```javascript
domainLoader.isEntityInDomain('engagement', 'friday');  // true
domainLoader.isEntityInDomain('engagement', 'mwr');     // false
domainLoader.isEntityInDomain('review', 'mwr');         // true
domainLoader.isEntityInDomain('review', 'friday');      // false
domainLoader.isEntityInDomain('user', 'friday');        // true (shared entity)
domainLoader.isEntityInDomain('user', 'mwr');           // true (shared entity)
```

### 5. isFeatureInDomain(featureName, domainName)
Checks if a feature belongs to a specific domain.

```javascript
domainLoader.isFeatureInDomain('engagement_letter', 'friday');    // true
domainLoader.isFeatureInDomain('engagement_letter', 'mwr');       // false
domainLoader.isFeatureInDomain('pdf_viewer', 'mwr');              // true
domainLoader.isFeatureInDomain('pdf_viewer', 'friday');           // false
```

### 6. filterDataByDomain(data, domainName, entityName)
Filters result set to only include domain-relevant fields.

```javascript
const engagements = list('engagement');
const filtered = domainLoader.filterDataByDomain(engagements, 'friday', 'engagement');
// Returns filtered array with only Friday-relevant fields
```

### 7. getDomainInfo(domainName)
Returns complete domain configuration object.

```javascript
const fridayInfo = domainLoader.getDomainInfo('friday');
// Returns: {
//   name: 'friday',
//   label: 'Engagement Management',
//   description: 'Engagement lifecycle, RFI workflow, client communication',
//   enabled: true,
//   primary_color: '#3B82F6',
//   icon: 'Briefcase',
//   features: [...],
//   entities: [...]
// }
```

### 8. getCurrentDomain(request)
Extracts domain from query parameter or returns default.

```javascript
// URL: /api/engagement?domain=friday
const domain = domainLoader.getCurrentDomain(request);
// Returns: 'friday'

// URL: /api/engagement (no domain param)
const domain = domainLoader.getCurrentDomain(request);
// Returns: 'friday' (default)
```

### 9. getApiBasePathForDomain(domainName)
Returns API base path for domain.

```javascript
domainLoader.getApiBasePathForDomain('friday');  // Returns: '/api/friday'
domainLoader.getApiBasePathForDomain('mwr');     // Returns: '/api/mwr'
```

### 10. Helper Methods

```javascript
domainLoader.getValidDomains();    // Returns: ['friday', 'mwr']
domainLoader.getDefaultDomain();   // Returns: 'friday'
```

## API Route Examples

### Updated CRUD Factory
Location: `/home/user/lexco/moonlanding/src/lib/crud-factory.js`

The CRUD factory now automatically checks domain validity:

```javascript
import { getDomainLoader } from '@/lib/domain-loader';

export const createCrudHandlers = (entityName) => {
  return withErrorHandler(async (request, context) => {
    const user = await requireAuth();
    const domainLoader = getDomainLoader();
    const domain = domainLoader.getCurrentDomain(request);

    // Validate entity is in domain
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

### Domain-Specific Entity Routes

#### Friday Domain Route
Location: `/home/user/lexco/moonlanding/src/app/api/friday/[entity]/route.js`

```javascript
import { getDomainLoader } from '@/lib/domain-loader';
import { createCrudHandlers } from '@/lib/crud-factory';

async function handleRequest(request, context, method) {
  const domainLoader = getDomainLoader();
  const domain = 'friday';
  const params = await context.params;
  const { entity } = params;

  if (!domainLoader.isEntityInDomain(entity, domain)) {
    throw new AppError(
      `Entity ${entity} not available in Friday domain`,
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
// ... POST, PUT, PATCH, DELETE
```

#### MWR Domain Route
Location: `/home/user/lexco/moonlanding/src/app/api/mwr/[entity]/route.js`

Same structure as Friday route, but with `domain = 'mwr'`.

### Domain Information Routes

#### List All Domains
Location: `/home/user/lexco/moonlanding/src/app/api/domains/route.js`

```bash
GET /api/domains
```

Response:
```json
{
  "domains": [
    {
      "name": "friday",
      "label": "Engagement Management",
      "entities": ["engagement", "rfi", ...],
      "features": ["engagement_management", "rfi_workflow", ...]
    },
    {
      "name": "mwr",
      "label": "My Work Review",
      "entities": ["review", "highlight", ...],
      "features": ["review_management", "pdf_viewer", ...]
    }
  ]
}
```

#### Get Single Domain Info
Location: `/home/user/lexco/moonlanding/src/app/api/domains/[domain]/route.js`

```bash
GET /api/domains/friday
GET /api/domains/mwr
```

### Feature Routes

#### Friday Features
Location: `/home/user/lexco/moonlanding/src/app/api/friday/features/route.js`

```bash
GET /api/friday/features
```

Response:
```json
{
  "domain": "friday",
  "features": ["engagement_management", "rfi_workflow", "engagement_letter", ...],
  "entities": ["engagement", "rfi", "client", ...],
  "feature_count": 7,
  "entity_count": 12
}
```

#### MWR Features
Location: `/home/user/lexco/moonlanding/src/app/api/mwr/features/route.js`

```bash
GET /api/mwr/features
```

### Entity-Specific Routes

#### Friday Engagement Route
Location: `/home/user/lexco/moonlanding/src/app/api/friday/engagement/route.js`

```bash
GET /api/friday/engagement
```

#### MWR Review Route
Location: `/home/user/lexco/moonlanding/src/app/api/mwr/review/route.js`

```bash
GET /api/mwr/review
```

## Usage Patterns

### Pattern 1: Domain-Aware CRUD Operations

```javascript
// Automatically uses domain from query param or defaults to 'friday'
GET /api/engagement?domain=friday
GET /api/review?domain=mwr
```

### Pattern 2: Domain-Specific Routes

```javascript
// Explicitly scoped to domain
GET /api/friday/engagement
GET /api/mwr/review
POST /api/friday/rfi
PUT /api/mwr/highlight/123
DELETE /api/friday/engagement/456
```

### Pattern 3: Feature Checking

```javascript
import { getDomainLoader } from '@/lib/domain-loader';

const domainLoader = getDomainLoader();

if (domainLoader.isFeatureInDomain('engagement_letter', 'friday')) {
  // Enable engagement letter generation UI
}

if (domainLoader.isFeatureInDomain('pdf_viewer', 'mwr')) {
  // Enable PDF viewer UI
}
```

### Pattern 4: Dynamic Entity Loading

```javascript
const domainLoader = getDomainLoader();
const currentDomain = domainLoader.getCurrentDomain(request);
const availableEntities = domainLoader.getEntitiesForDomain(currentDomain);

// Render navigation menu with only domain-relevant entities
const navItems = availableEntities.map(entityName => ({
  label: entityName,
  href: `/api/${currentDomain}/${entityName}`
}));
```

## Error Handling

All methods throw appropriate errors:

```javascript
// Invalid domain
domainLoader.getEntitiesForDomain('invalid');
// Throws: Error: Invalid domain: invalid. Valid domains: friday, mwr

// Entity not in domain
domainLoader.isEntityInDomain('engagement', 'mwr');
// Returns: false (does not throw)

// Missing parameters
domainLoader.getEntitiesForDomain(null);
// Throws: Error: getEntitiesForDomain: domainName must be a non-empty string
```

## Domain Configuration Reference

### Friday Domain
- **Purpose**: Engagement lifecycle management, client communication, RFI workflow
- **Primary Color**: #3B82F6 (blue)
- **Icon**: Briefcase
- **Entities**: engagement, rfi, client, client_user, letter, rfi_section, message, file, response, email, user, team
- **Features**: engagement_management, rfi_workflow, engagement_letter, client_feedback, recreation, team_management, client_management

### MWR Domain
- **Purpose**: PDF review collaboration, highlights, checklists, tenders
- **Primary Color**: #10B981 (green)
- **Icon**: FileText
- **Entities**: review, highlight, collaborator, checklist, tender, flag, user, team
- **Features**: review_management, pdf_viewer, highlight_collaboration, checklist_management, tender_tracking, pdf_comparison, priority_reviews, chat_merge, collaborator_management

### Shared Entities
- **user**: Available in both domains
- **team**: Available in both domains

## Integration Checklist

- [x] DomainLoader class created at `/home/user/lexco/moonlanding/src/lib/domain-loader.js`
- [x] CRUD factory updated with domain validation at `/home/user/lexco/moonlanding/src/lib/crud-factory.js`
- [x] Friday entity route created at `/home/user/lexco/moonlanding/src/app/api/friday/[entity]/route.js`
- [x] MWR entity route created at `/home/user/lexco/moonlanding/src/app/api/mwr/[entity]/route.js`
- [x] Domains list route created at `/home/user/lexco/moonlanding/src/app/api/domains/route.js`
- [x] Domain detail route created at `/home/user/lexco/moonlanding/src/app/api/domains/[domain]/route.js`
- [x] Friday features route created at `/home/user/lexco/moonlanding/src/app/api/friday/features/route.js`
- [x] MWR features route created at `/home/user/lexco/moonlanding/src/app/api/mwr/features/route.js`
- [x] Example engagement route created at `/home/user/lexco/moonlanding/src/app/api/friday/engagement/route.js`
- [x] Example review route created at `/home/user/lexco/moonlanding/src/app/api/mwr/review/route.js`

## Testing

### Manual Testing Examples

```bash
# Test domain list
curl http://localhost:3000/api/domains

# Test Friday domain info
curl http://localhost:3000/api/domains/friday

# Test MWR domain info
curl http://localhost:3000/api/domains/mwr

# Test Friday features
curl http://localhost:3000/api/friday/features

# Test MWR features
curl http://localhost:3000/api/mwr/features

# Test Friday entity access
curl http://localhost:3000/api/friday/engagement

# Test MWR entity access
curl http://localhost:3000/api/mwr/review

# Test invalid domain (should return 403)
curl http://localhost:3000/api/mwr/engagement

# Test invalid entity in Friday (should return 403)
curl http://localhost:3000/api/friday/highlight
```

## Notes

1. **Default Domain**: If no domain parameter is specified, the system defaults to 'friday'
2. **Case Insensitive**: Domain names are normalized to lowercase
3. **Validation**: All API routes validate entity presence in domain before processing
4. **Shared Entities**: 'user' and 'team' are available in both domains
5. **Feature Flags**: Features are domain-scoped and automatically filtered
6. **No Placeholders**: All code is production-ready with complete error handling
