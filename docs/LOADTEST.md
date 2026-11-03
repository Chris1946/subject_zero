# Subject Zero Load Testing Guide

This guide details how to execute and interpret the realistic 90-virtual-user load test script (`scripts/loadtest.mjs`) designed for **SUBJECT ZERO**.

---

## 1. Overview & Simulation Architecture

The load test simulates a full venue competition setup:
- **30 Teams** competing simultaneously.
- **3 Devices per team** (90 total Virtual Users / VUs).
- **Realistic Jitter Polling**: Each device polls `GET /api/state` every 3 to 5 seconds with random jitter.
- **Human-paced Gameplay**: Devices submit wrong answers, pause for thought/reading, and then submit correct answers.
- **Flash Spike Test**: All 90 devices fire a concurrent request to `GET /api/state` at the exact same millisecond (simulating venue Wi-Fi reconnect or game pause/resume broadcast).

---

## 2. Safety Guards & Production Protection

To prevent accidental data corruption or denial of service on a live competition instance:
1. The script automatically inspects `BASE_URL`.
2. If `BASE_URL` contains `vercel.app`, `subjectzero`, or production domains, it **immediately aborts** with:
   ```
   ❌ [REFUSAL] BASE_URL appears to be a production or public deployment.
   ```
3. To override (e.g. for a dedicated pre-event staging verification), you must explicitly supply:
   ```bash
   node scripts/loadtest.mjs --i-know-this-is-production
   ```

---

## 3. Running the Load Test

### Step A: Against Local Dev Server

1. Start your local dev server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the load test:
   ```bash
   node scripts/loadtest.mjs
   ```

### Step B: Against a Staging / Preview Deployment

1. Set the target `BASE_URL` and admin password:
   ```bash
   $env:BASE_URL = "https://preview-deployment.vercel.app"
   $env:ADMIN_PASSWORD = "your-staging-admin-password"
   node scripts/loadtest.mjs
   ```

---

## 4. Acceptance Criteria & Target Thresholds

| Metric | Target Threshold | Rationale |
| :--- | :--- | :--- |
| **Overall Success Rate** | **>= 99.5%** | Near-zero dropped requests across 90 players |
| **Rate Limit 429 Rate** | **0%** for well-behaved teams | Legitimate polling & answers must never be blocked |
| **GET /api/state p95** | **< 150 ms** | Smooth realtime state updates |
| **POST /api/answer p95** | **< 250 ms** | Instant feedback on submitted answers |
| **Spike Concurrency p99** | **< 400 ms** | Server handles 90 simultaneous reconnections |

---

## 5. Post-Test Cleanup

When running against a shared test database:
- Use `supabase/cleanup.sql` in the Supabase SQL editor to clear test team records and reset `game_state` back to `'waiting'`.
