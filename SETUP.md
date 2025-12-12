# Local Development Setup

## Environment Overview

This project uses a modern, minimal stack optimized for fast development and deployment:

### Core Technologies
- **Next.js 15.5.9** - React framework with App Router
- **React 19.2.3** - Latest React with server components
- **pnpm** - Fast, disk-efficient package manager (3min 12s install time)
- **SQLite** - Lightweight local database with WAL mode
- **Vitest 3.2.4** - Fast unit testing framework

### Authentication & Integration
- **Lucia 3.2.2** - Session-based authentication (with deprecation notice - plan migration to Auth.js v5)
- **Arctic 1.9.2** - OAuth providers integration
- **Google APIs 140.0.1** - Google Drive & Gmail integration

### UI Components
- **Mantine 7.17.8** - Modern React components library
- **Lucide React 0.441.0** - Icon library

## Setup Status

✅ **Environment initialized successfully**

- Dependencies installed via pnpm (much faster than npm)
- 377 tests passing (all validation tests successful)
- Database initialized with SQLite WAL mode
- Dev server running in 1.9 seconds

## Quick Start

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage report
pnpm test:coverage

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

The `.env` file has been created with test credentials. For production, update:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GMAIL_SENDER_EMAIL=your-email@domain.com
```

## Database

SQLite database is located at `/data/app.db` with WAL mode enabled for better concurrency.
Test database uses `/data/test.db` and is created fresh for each test run.

## Architecture Improvements

### Package Management
- Switched to **pnpm** for faster installation and better disk efficiency
- Lockfile: `pnpm-lock.yaml` (more efficient than package-lock.json)

### Configuration
- Vitest config renamed to `.mjs` for proper ESM support

### Modern Versions
- Next.js 15.5.9 (latest stable)
- React 19.2.3 (latest)
- TypeScript 5.9.3 (latest)

## Deprecation Notes

The following packages have deprecation notices but are maintained:
- `lucia@3.2.2` - Plan migration to Auth.js v5 (NextAuth.js v5) in future releases
- `@lucia-auth/adapter-sqlite@3.0.2` - Will be replaced with native Next Auth adapters
- `arctic@1.9.2` - OAuth library, actively maintained

## Performance

- **Installation**: 3min 12s with pnpm (vs ~10min with npm)
- **Tests**: 1.16s for full test suite (377 tests)
- **Dev Server Startup**: 1.9 seconds

## File Structure

```
moonlanding/
├── .env              # Environment variables (test credentials)
├── data/
│   ├── app.db       # Production database
│   └── test.db      # Test database (auto-generated)
├── src/
│   ├── app/         # Next.js pages and API routes
│   ├── engine/      # Core platform engine
│   ├── components/  # Reusable React components
│   └── specs.js     # Entity specifications
├── tests/           # Test files
├── package.json     # Dependencies manifest
├── pnpm-lock.yaml   # Locked dependency versions
└── vitest.config.mjs # Test runner configuration
```

## Troubleshooting

If you encounter installation issues:

1. Clear pnpm cache: `pnpm store prune`
2. Remove lockfile: `rm pnpm-lock.yaml`
3. Reinstall: `pnpm install`

## Next Steps

1. **Google Cloud Setup**: Configure OAuth credentials for real integration
2. **Database Migration**: Plan transition from Lucia to Auth.js v5
3. **Production Build**: Run `pnpm build` to verify production build
4. **Deployment**: Deploy to Vercel or your preferred hosting

