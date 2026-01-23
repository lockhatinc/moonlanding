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

### Server Network Binding
Server must bind to `0.0.0.0` for external access (browser automation, Docker):
```js
server.listen(PORT, '0.0.0.0', () => {...})
```
Binding to localhost only blocks external connections.

### PDF Coordinates
Position data uses PDF coordinates (bottom-left origin). Zoom/rotate breaks positioning - must recalculate after display transform.

### Module Cache
Custom module cache can become stale. Clear with: `rm -f data/app.db data/app.db-wal data/app.db-shm`

### Password Hashing
User passwords use bcrypt. When seeding users, generate hash with `bcrypt.hash('password', 12)`.

### Form Number Fields
HTML form data always sends strings. Number fields must be converted before API submission:
```js
form.querySelectorAll('input[type=number]').forEach(inp => {
  if (data[inp.name]) data[inp.name] = Number(data[inp.name]);
});
```

### Dynamic Enum Options
Enum fields with dynamic options (e.g., `options: engagement_lifecycle.stages[].name`) must be resolved at render time by looking up the workflow definition in the config.
