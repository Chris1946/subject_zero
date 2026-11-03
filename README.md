# SUBJECT ZERO

> **Halloween Digital Horror Escape-Room Competition Web App**  
> Built for ~100 players (~25 teams of 4 investigators) across 5 investigative containment rooms.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, strict TypeScript)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Terminal aesthetic, dark-mode only)
- **Audio & Animations**: `howler`, `framer-motion`
- **Validation**: `zod`
- **Testing**: `vitest`, `playwright`
- **Deployment**: [Vercel](https://vercel.com/)

---

## ⚠️ Security Notice: Master Answer Key Protection

> [!IMPORTANT]  
> **Answers must NEVER be sent to or exposed in the browser.**
> 
> All answer validation, verification algorithms, and solution keys remain exclusively on the server in protected route handlers (`/api/*`). The client bundle receives only validation outcomes (e.g. `correct: true | false`, error prompts, and unlocked room content). Row Level Security (RLS) is strictly enabled across all tables without public access policies, ensuring that client-side Supabase tokens cannot query or bypass the server validation layer.

---

## Local Development Setup

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials, admin password, and session secret:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
ADMIN_PASSWORD=your-secure-admin-password
SESSION_SECRET=minimum_32_character_random_hex_string_here
EVENT_MODE=remote
```

### 2. Apply Database Migrations
In the Supabase SQL Editor:
- Execute `supabase/all_migrations.sql` to apply all migrations (0001 through 0006).
- *(Optional - Test Environments Only)*: Execute `supabase/seed.sql` to seed test teams.

### 3. Install Dependencies & Run Dev Server
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Automated Test Suite

Run the full testing and security audit suite:

```bash
# 1. Run Unit Tests (111 tests covering answers, rate limits, sessions, content)
npm test

# 2. Check Scene Images Integrity
npm run check:images

# 3. Client Bundle & HTML Leak Audit (Assures 0 answer keys or future rooms leak to browser)
npm run test:leak

# 4. Database Row Level Security (RLS) Audit (Asserts anon key has 0 table/RPC access)
npm run test:rls

# 5. Playwright End-to-End Tests
npm run test:e2e
```

---

## Realistic Competition Load Testing

Simulates 30 teams x 3 devices each (90 Virtual Users) playing concurrently with jittered polling and synchronized spike requests:

```bash
# Test against local server
node scripts/loadtest.mjs

# Test against staging URL
$env:BASE_URL = "https://your-staging.vercel.app"
node scripts/loadtest.mjs --i-know-this-is-production
```
Detailed instructions are available in [docs/LOADTEST.md](file:///c:/Users/salma/Desktop/CSI/project/docs/LOADTEST.md).

---

## Production Deployment Guide

### 1. Supabase Production Setup
1. Create a dedicated Supabase project in the region closest to your venue.
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Open [`supabase/all_migrations.sql`](file:///c:/Users/salma/Desktop/CSI/project/supabase/all_migrations.sql), copy its contents, and click **Run**.
4. Verify all tables (`teams`, `attempts`, `game_state`, `rate_limit_hits`, `admin_log`) and views are created with RLS enabled.
5. **DO NOT run `supabase/seed.sql` in production.** Production teams are created through the `/admin` dashboard.

### 2. Vercel Hosting Configuration
1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Set the **Function Region** in `vercel.json` (or Project Settings > Functions) to the region closest to your Supabase database (default is `iad1` US East; change to matching region e.g. Frankfurt `fra1` or Singapore `sin1` to minimize latency).
4. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `EVENT_MODE=onsite`
5. Set Build Command: `next build --webpack` (or default `npm run build`). Deploy the project.

### 3. Custom Domain Checklist
- [ ] Add your custom domain (e.g. `play.csi-event.org`) under **Vercel Project Settings > Domains**.
- [ ] Configure CNAME / A records in your DNS provider.
- [ ] Verify SSL certificate generation and HTTPS redirect.
- [ ] Test round-trip latency from venue Wi-Fi: `curl -w "%{time_total}\n" -o /dev/null -s https://play.csi-event.org/api/health` (target `< 50ms`).

### 4. Event-Mode Checklist
- [ ] Ensure `EVENT_MODE=onsite` is enabled in production environment variables.
- [ ] In `onsite` mode, per-IP rate limits are automatically scaled for ~100 players sharing the venue public IP:
  - Submissions: **600 / min** per IP.
  - Join attempts: **300 / min** per IP.
  - Leaderboard queries: **600 / min** per IP.
  - State polling: **1200 / min** per IP.
  - Per-team answer brute-force limit remains strictly **6 / min** per team.
  - Global failed join limit prevents automated dictionary attacks (**60 failed joins / min** across all IPs).
  - Admin login remains strictly throttled at **5 attempts per 5 minutes** per IP.

---

## Event Day Operations & Organizer Runbook

For complete event-day operational timelines, non-developer organizer checklists, contingency plans, and printable judges' sheets, refer to:
- 📖 [docs/RUNBOOK.md](file:///c:/Users/salma/Desktop/CSI/project/docs/RUNBOOK.md)
- 📋 [docs/AUDIT.md](file:///c:/Users/salma/Desktop/CSI/project/docs/AUDIT.md) (Section 11 Technical Implementation Audit)
- 📊 [docs/LOADTEST.md](file:///c:/Users/salma/Desktop/CSI/project/docs/LOADTEST.md) (Load Testing Documentation)
- 🖼️ [docs/IMAGES.md](file:///c:/Users/salma/Desktop/CSI/project/docs/IMAGES.md) (Scene Artwork Specifications)
