# Supabase Migrations & Database Architecture

This directory contains the database migrations, schemas, and maintenance scripts for **SUBJECT ZERO**.

## Migration Execution Order

When deploying to a new Supabase project or configuring a local test instance, apply the migrations sequentially in numerical order:

| Step | File | Purpose | Key Objects Created / Altered |
| :--- | :--- | :--- | :--- |
| **01** | `0001_init.sql` | Initial core tables & Row Level Security | `teams`, `attempts`, `game_state`, RLS enablement |
| **02** | `0002_submit_answer.sql` | Atomic submission & validation RPC | `submit_answer()` function (with team row locking) |
| **03** | `0003_game_control.sql` | Pause logic, admin logging & team results view | `admin_log`, `team_results` view, updated `submit_answer()` with game state checks |
| **04** | `0004_rate_limits.sql` | Distributed advisory-locked rate limiter | `rate_limit_hits` table, `hit_rate_limit()` RPC |
| **05** | `0005_leaderboard_settings.sql` | Leaderboard control & sanitized public view | `game_state.leaderboard_visible`, `team_progress_public` view (no join codes or IDs) |
| **06** | `0006_indexes.sql` | Performance tuning & RPC privilege hardening | Hot-path composite indexes, bounded limiter cleanup, revoke RPC execution from `public`/`anon` |

---

## One-Click Setup (`all_migrations.sql`)

For setting up a fresh project in the Supabase Dashboard SQL Editor:
- Open `supabase/all_migrations.sql`.
- Copy and paste the entire script into the SQL Editor.
- Click **Run**. This applies migrations 0001 through 0006 in one atomic sequence.

---

## Utility & Maintenance Scripts

### `seed.sql`
- **WARNING**: Only run in **LOCAL or TEST** environments. Never run on production!
- Inserts 3 sample teams with valid 6-character uppercase join codes for local testing and scenario walkthroughs.

### `cleanup.sql`
- **DANGER**: Highly destructive reset script!
- Wipes all rows in `attempts`, `teams`, `rate_limit_hits`, and `admin_log`.
- Resets `game_state` row 1 back to `{ status: 'waiting', started_at: null, paused_at: null, paused_total_seconds: 0, leaderboard_visible: false }`.
- Use when resetting the venue staging environment between dry runs.

---

## Security Architecture & RLS

- **Strict RLS**: All tables (`teams`, `attempts`, `game_state`, `rate_limit_hits`, `admin_log`) have Row Level Security enabled with **no public policies**.
- **No Direct Anon Access**: The client-side anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) cannot select, insert, update, or delete from any table.
- **Server-Side Mediation**: All reads and writes pass through Next.js server-only Route Handlers and Server Actions utilizing `SUPABASE_SERVICE_ROLE_KEY`.
- **RPC Lockdown**: Execution of `hit_rate_limit` and `submit_answer` is explicitly revoked from `anon` and `authenticated` roles and granted exclusively to `service_role`.
