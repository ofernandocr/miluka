# miLuka - Expense Tracking App

## Quick Start
- `REQUIREMENTS.md` — full feature definitions
- `ARCHITECTURE.md` — project structure, data model, and design decisions
- `DEPLOY.md` — production deployment guide (Supabase Cloud + Cloudflare Pages)
- Keep all documentation updated when making changes

## Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (self-hosted via Docker)
- **Database:** PostgreSQL (Supabase)
- **Charts:** Recharts
- **PWA:** vite-plugin-pwa
- **Testing:** Vitest + React Testing Library + Mock Service Worker
- **Test DB:** Docker container for integration tests

## Code Conventions
- All code, comments, declarations, and documentation must be in **English**
- Follow existing patterns in the codebase (naming, typing, component structure)
- Do not add comments to code unless they clarify non-obvious logic
- Use existing libraries and utilities — never assume a library is available without checking

## Workflow
- Work is segmented: each session/commit modifies specific modules or functionality
- No large sweeping changes unless explicitly required
- Run `npm run lint` (tsc --noEmit) and `npm run test` before every commit
- If lint or tests fail, fix them before committing
- **Commit only, no push** — user will push explicitly when ready
- **Every project modification must include updating the corresponding documentation** (REQUIREMENTS.md, ARCHITECTURE.md, or both) to reflect the changes made

## Testing Strategy
- **Framework:** Vitest
- **Location:** `src/__tests__/` — mirrors the src structure
- **Component tests:** React Testing Library (behavior-focused, not implementation)
- **Integration tests:** Dedicated Docker service (`miluka-test-db`) with real PostgreSQL + seed data
- **API mocking:** Mock Service Worker (MSW) for HTTP-level mocking
- **Coverage targets:**
  - Hooks: test all states (loading, empty, error, populated)
  - Components: test rendering, user interactions, edge cases
  - Pages: test integration between components and hooks

## Docker Services
| Service | Image | Port | Description |
|---------|-------|------|-------------|
| db | supabase/postgres | 5432 | PostgreSQL |
| auth | supabase/gotrue | - | Authentication |
| rest | postgrest/postgrest | - | Auto REST API |
| studio | supabase/studio | 54323 | Admin UI |
| meta | supabase/postgres-meta | - | DB metadata |
| kong | kong/kong | 8000 | API gateway |
| web | local build | 5173 | React frontend |
| test-db | postgres:17-alpine | 5433 | Test database |

## Commands
- `docker compose up -d` - Start all services
- `docker compose down` - Stop all services
- `docker compose logs -f <service>` - View logs
- `docker compose exec db psql -U postgres` - Direct DB access
- `npm run test` - Run tests (in web/ or via docker compose exec web)
- `npm run test:watch` - Watch mode
- `npm run lint` - TypeScript type-check

## Database
- Schema: `sql/001_schema.sql` (profiles, categories, transactions, wallets)
- RLS: `sql/002_rls.sql`
- Seed: `sql/003_seed.sql` (17 categories — run after user signs up)
- Migrations: `sql/004_wallets.sql`, `sql/005_transactions_wallet.sql`
- Test seed: `sql/003_seed.sql` + test-specific fixtures in `src/__tests__/fixtures/`
- Apply SQL via Studio (http://localhost:54323) or `psql`
- After schema changes, reload PostgREST cache: `psql -c "NOTIFY pgrst, 'reload schema';"`

## First-Time Setup
1. `cp .env.example .env`
2. `docker compose up -d` (waits ~30s for all services to become healthy)
3. Sign up at http://localhost:5173/register
4. `docker compose exec -T db psql -U postgres < sql/003_seed.sql`
5. Login and use the app

## Environment
- Copy `.env.example` to `.env` before starting
- `.env.test` for test-specific overrides (test DB URL, etc.)
- Default Studio credentials: supabase / this_password_is_insecure_and_should_be_updated

## Development
- `docker compose up -d` starts everything
- Frontend hot-reloads on changes via volume mount
- Studio at http://localhost:54323
- API gateway at http://localhost:8000
- App at http://localhost:5173
