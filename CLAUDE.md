# CLAUDE.md - Technical Caveats

## Architecture

Zero-build runtime using `tsx` for TypeScript/JSX transpilation at runtime.

```bash
npm install && npm run dev  # Port 3004
```

## Critical Caveats

### Content-Length Header (CRITICAL)
Set `Content-Length` header when sending HTML responses. Without it, Node.js uses chunked transfer encoding causing browsers to receive incomplete HTML:
```js
res.setHeader('Content-Length', Buffer.byteLength(html, 'utf-8'))
```

### Import Paths
All imports must use `@/` alias (maps to `src/`). Relative imports fail with tsx.

### Route Handler Order
`/client/` bundle handler MUST come before page renderer to prevent client files from being processed as dynamic pages.

### Error Serialization
Error handling must safely convert errors to strings - Symbol values in error properties cause crashes.

### tsx JSX Config
tsconfig.json must include `"jsx": "react-jsx"` for tsx to transpile JSX in .js files.

### SQLite Concurrency
Database locks on write. High concurrency causes "database is locked" errors.

### PDF Coordinates
Position data uses PDF coordinates (bottom-left origin). Zoom/rotate breaks positioning - must recalculate after display transform.

### Module Cache
Custom module cache can become stale. Clear with: `rm -f data/app.db data/app.db-wal data/app.db-shm`

## Rebuild Spec

See `docs/` for configuration-driven rebuild spec targeting webjsx + Ripple UI:
- `spec.js` - Feature analysis, schemas, migration plan
- `entities.yaml` - Entity definitions with stage workflows
- `system.yaml` - Thresholds, automation, integrations
- `permissions.yaml` - Role-based permission matrix
