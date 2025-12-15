# WFGY: Technical Debt & Code Minimization (Priority Order by Impact)

## Critical: Fix 3 Complex Functions (🔥)
- [ ] DashboardPage (135 lines) - split into smaller components
- [ ] ReviewDetail (129 lines) - extract PDF/highlight logic
- [ ] EntityDetail (104 lines) - split tabs into separate components

## Urgent: Consolidate Repeated Constants
- [ ] ROOT_FOLDER_ID (appears 3x) → single CONFIG reference
- [ ] 45x console.error patterns → Logger utility class
- [ ] 34x NextResponse.json() → apiResponse() wrapper
- [ ] 19x can(user, spec) calls → permission middleware

## High: Remove Dead Code & Fix Exports
- [ ] Remove unused exports in page.jsx (4 generateMetadata duplicates)
- [ ] Remove single-use exports (backup, email-config, gmail-templates)
- [ ] Verify all functions are called/tested

## High: Consolidate Configuration
- [ ] Extract all hardcoded defaults to CONFIG (localhost, example.com)
- [ ] Move ROOT_FOLDER_ID, EMAIL_FROM, APP_URL defaults
- [ ] Move all status enums/options to CONFIG
- [ ] Remove process.env.X || 'fallback' patterns

## Medium: Implement Observability Stack
- [ ] Create Logger class (debug, info, warn, error with tracing)
- [ ] Add request tracing (unique ID through full stack)
- [ ] Create apiResponse() wrapper with metadata
- [ ] Add performance metrics (operation timing)
- [ ] Enhance window.__DEBUG__ with performance/network tabs

## Medium: DRY - Generic Handlers
- [ ] Extract permission check to middleware (@middleware/auth)
- [ ] Create generic field validator (@lib/validator)
- [ ] Create audit logging wrapper (@lib/audit)
- [ ] Replace 50+ similar patterns with these utilities

## Medium: Fix Dangerous Patterns
- [ ] Replace magic params (13 params on PDFViewer) - use config objects
- [ ] Remove fallback strings - fail loudly on missing env
- [ ] Standardize error responses with error codes

## Low: Update Documentation
- [ ] Update CLAUDE.md with full API protocol
- [ ] Document error handling strategy
- [ ] Document observability hooks (Logger, apiResponse)
- [ ] Document environment variables
- [ ] Delete /docs/* (mwr-spec, friday-spec, pdf-system)

## Verify: Build & Completeness
- [ ] npm run build passes (0 errors)
- [ ] All 200-line splits verified
- [ ] No dead code remains
- [ ] No hardcoded values (all in CONFIG)
- [ ] All todos cleared
