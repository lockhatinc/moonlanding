# Configuration-Driven Architecture - Generalization Status

## 🎯 Goal
Make the entire codebase configuration-based with zero repeated code patterns. Code interprets config, not the other way around.

## ✅ COMPLETED Generalizations

### 1. **Unified Configuration** (Single Source of Truth)
- ✅ `/src/config/index.js` - 674 lines
- All roles, statuses, HTTP codes, errors, UI limits, colors, workflows, field types consolidated
- Added `getSpec()`, `getNavItems()`, `getSpec()`, validator routing
- All permission matrix defined in config

### 2. **Builder Utilities** (40+ Generic Helpers)
```javascript
// Form builders
- buildFormFields(spec)
- buildValidators(spec)

// List view builders
- buildListColumns(spec)
- buildListQuery(spec, page, sort, filter)

// Navigation builders
- buildNavigation()
- buildActions(spec)

// State initialization
- getInitialState(spec)

// Display & Formatting
- formatDisplayText(value, field)
- getOptionLabel(spec, key, value)
- getOptionColor(spec, key, value)
- formatDisplayValue()

// Query building
- getDefaultSort(spec)
- getPageSize(spec)
- getAvailableFilters(spec)

// Relationship handling
- getChildEntities(spec)
- getParentEntity(spec)

// Field introspection
- getRequiredFields(spec)
- getEditableFields(spec)
- getField(spec, key)
- getFieldType(spec, key)

// Permission checking
- checkPermission(user, entity, action)

// Search & filtering
- getSearchableFields(spec)
- getFilterableFields(spec)

// Batch operations
- canBatchDelete(spec)
- canBatchUpdate(spec)

// Export & audit
- getExportableFields(spec)
- getAuditFields(spec)

// Type checking
- isEmbeddedEntity(spec)
- isParentEntity(spec)
- hasChildRelationships(spec)
- isSoftDeleted(spec)
```

## 📋 TODO - Identified Patterns to Generalize

### Route Handlers (10 files)
**Current**: Repeated try/catch, error handling, permission checks
**Pattern**: 28 `NextResponse.json()` calls
**Solution**: Create generic route factory

```javascript
// Generic factory needed:
createCrudRoute(entity) -> returns { GET, POST, PUT, DELETE }
createAuthRoute(handler) -> wraps with auth + error handling
createApiRoute(handler) -> wraps with try/catch + logging
```

### Component State Management (24+ useState calls)
**Current**: Repeated loading, error, data state patterns
**Components**: chat-panel, pdf-viewer, entity-list, add-checklist, etc.
**Solution**: Custom hook: `useEntityState(entity)` -> { loading, error, data, setData, ... }

```javascript
// Needed: Create reusable hooks
- useEntityState(entity) - handles list/detail state
- useFormState(spec) - handles form state & validation
- useDialogState() - dialog open/close state
- usePaginationState(spec) - pagination state
- useSortState(spec) - sort state
- useFilterState(spec) - filter state
- useSearchState() - search state
```

### Error Handling (10 try/catch blocks)
**Current**: Repeated error logging, console.error
**Pattern**: Manual console.error in every route
**Solution**: Centralize in config error handler factory

### Form Logic (5+ form components)
**Current**: Repeated field rendering, validation
**Solution**: Create `<FormBuilder spec={spec} />` component from config

### List Logic (3+ list views)
**Current**: Repeated sorting, filtering, pagination
**Solution**: Create `<ListBuilder spec={spec} />` component from config

### API Call Patterns (fetch in 15+ places)
**Current**: Repeated fetch wrapping, error handling
**Solution**: Centralize in `useApiCall(endpoint, method)` hook

### Email/Notification Logic
**Current**: Repeated template + recipient resolution
**Solution**: Already started with `EMAIL_RESOLVERS` - generalize fully

### Dialog Components (add-checklist, etc.)
**Current**: Repeated dialog open/close state
**Solution**: Create `<DialogBuilder config={config} />`

## 📊 Duplication Analysis

| Pattern | Count | Estimated Lines | Solution |
|---------|-------|-----------------|----------|
| try/catch blocks | 10 | 100 | Generic error wrapper |
| useState calls | 24 | 120 | Custom hooks |
| NextResponse.json | 28 | 50 | Response builders |
| Permission checks | 6 | 50 | Generic middleware |
| Form field rendering | 5 | 150 | FormBuilder component |
| List view logic | 3 | 120 | ListBuilder component |
| Dialog state mgmt | 4 | 80 | DialogBuilder component |
| Fetch calls | 15 | 100 | useApiCall hook |
| **Total Duplication** | **71** | **~770 lines** | **Can be eliminated** |

## 🛠️ Next Steps (Priority Order)

### High Priority (Eliminates 50%+ duplication)
1. [ ] Create `useEntityState()` hook - eliminates 24 useState calls
2. [ ] Create route factory - eliminates 10 try/catch blocks  
3. [ ] Create `FormBuilder` component - eliminates form duplication
4. [ ] Create `ListBuilder` component - eliminates list view duplication

### Medium Priority
5. [ ] Create `useApiCall()` hook - centralizes fetch logic
6. [ ] Create generic error handler factory
7. [ ] Create reusable custom hooks (usePagination, useSort, useFilter, useSearch)

### Low Priority (Nice to have)
8. [ ] Create `DialogBuilder` component
9. [ ] Consolidate email template logic
10. [ ] Create `useFormState()` hook for form validation

## 📈 Impact Metrics

**Before**: ~5,600 lines of code, 80 files, significant duplication
**After**: <3,000 lines of code, <50 files, zero duplication

**Code Reduction**: 45%+ via configuration-driven generalization

## 💡 Philosophy

> "The entire app is defined in config. Code is just an interpreter of that config."

Every repeated pattern should be:
1. Extracted to config
2. Made generic via builder utilities
3. Reused via factories or custom hooks
4. Never hardcoded or duplicated

Current status: **Foundation Complete (50% done)**
- ✅ Config unified
- ✅ Builders created
- ⏳ Patterns need extraction (in progress)
