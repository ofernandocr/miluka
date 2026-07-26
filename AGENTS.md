# miLuka - Expense Tracking App

## Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (self-hosted via Docker)
- **Database:** PostgreSQL (Supabase)
- **Charts:** Recharts
- **PWA:** vite-plugin-pwa

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

## Commands
- `docker compose up -d` - Start all services
- `docker compose down` - Stop all services
- `docker compose logs -f <service>` - View logs
- `docker compose exec db psql -U postgres` - Direct DB access

## Database
- Schema: `sql/001_schema.sql`
- RLS: `sql/002_rls.sql`
- Seed: `sql/003_seed.sql`
- Apply SQL via Studio (http://localhost:54323) or `psql`

## Environment
- Copy `.env.example` to `.env` before starting
- Default Studio credentials: supabase / this_password_is_insecure_and_should_be_updated

## Development
- `docker compose up -d` starts everything
- Frontend hot-reloads on changes via volume mount
- Studio at http://localhost:54323
- API gateway at http://localhost:8000
- App at http://localhost:5173
