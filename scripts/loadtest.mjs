#!/usr/bin/env node
/**
 * SUBJECT ZERO — 90-USER REALISTIC LOAD TEST
 *
 * Simulates 30 teams x 3 devices = 90 virtual users (VUs) playing concurrently.
 * Measures latencies (p50, p95, p99) and verifies rate-limiting stability.
 */

import fs from "node:fs";
import path from "node:path";

// Load .env.local if present
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && !process.env[k]) {
      process.env[k] = v.join("=").replace(/^["']|["']$/g, "").trim();
    }
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const IS_PROD_URL =
  BASE_URL.includes("vercel.app") ||
  BASE_URL.includes("subjectzero") ||
  BASE_URL.includes("prod");

const hasDangerousFlag = process.argv.includes("--i-know-this-is-production");

if (IS_PROD_URL && !hasDangerousFlag) {
  console.error("==================================================================");
  console.error("❌ [REFUSAL] BASE_URL appears to be a production or public deployment:");
  console.error(`   ${BASE_URL}`);
  console.error("   To protect real players and live events, load testing is prohibited");
  console.error("   unless you explicitly pass the flag: --i-know-this-is-production");
  console.error("==================================================================");
  process.exit(1);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const NUM_TEAMS = 30;
const DEVICES_PER_TEAM = 3; // 90 VUs
const TOTAL_VUS = NUM_TEAMS * DEVICES_PER_TEAM;

console.log("=================================================");
console.log("SUBJECT ZERO — REALISTIC COMPETITION LOAD TEST");
console.log(`Target: ${BASE_URL}`);
console.log(`Scale:  ${NUM_TEAMS} Teams x ${DEVICES_PER_TEAM} Devices = ${TOTAL_VUS} Virtual Users`);
console.log("=================================================\n");

// Metric storage
const metrics = {
  join: [],
  state: [],
  answer: [],
  spikeState: [],
  errors: 0,
  rateLimits: 0,
  total: 0,
};

function recordLatency(type, ms) {
  metrics[type].push(ms);
  metrics.total++;
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, count: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p = (pct) => sorted[Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length))];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    count: sorted.length,
    p50: p(50).toFixed(1),
    p95: p(95).toFixed(1),
    p99: p(99).toFixed(1),
    avg: (sum / sorted.length).toFixed(1),
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extract cookies from Set-Cookie header
function extractCookie(response, cookieName) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? `${cookieName}=${match[1]}` : null;
}

async function runLoadTest() {
  const startTime = Date.now();

  // Phase 1: Setup Admin Session & Prepare 30 Teams
  console.log("[Phase 1/5] Authenticating admin & preparing 30 load test teams...");
  let adminCookie = null;
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });

  if (adminLoginRes.ok) {
    adminCookie = extractCookie(adminLoginRes, "sz_admin");
  }

  // Create or obtain team join codes
  const teams = [];
  if (adminCookie) {
    // Start the game if it is waiting
    await fetch(`${BASE_URL}/api/admin/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ action: "start" }),
    });

    console.log("   -> Registering load test teams via /api/admin/teams...");
    for (let i = 1; i <= NUM_TEAMS; i++) {
      const teamName = `LoadTeam_${String(i).padStart(2, "0")}_${Date.now().toString(36).slice(-4)}`;
      const res = await fetch(`${BASE_URL}/api/admin/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ name: teamName }),
      });
      if (res.ok) {
        const data = await res.json();
        teams.push({ id: data.team.id, name: teamName, joinCode: data.team.joinCode });
      }
    }
  }

  // Fallback if admin creation was unable to run (e.g. static preview or pre-seeded codes)
  if (teams.length === 0) {
    console.log("   -> Admin seeding skipped or failed. Using fallback test join codes...");
    const fallbackCodes = ["K9X4M2", "R7P3W8", "T2N9L5"];
    for (let i = 0; i < NUM_TEAMS; i++) {
      teams.push({
        id: `mock-team-${i}`,
        name: `Team_${i + 1}`,
        joinCode: fallbackCodes[i % fallbackCodes.length],
      });
    }
  }

  console.log(`   -> Active teams ready: ${teams.length}\n`);

  // Phase 2: Simultaneous Join of 90 Virtual Devices
  console.log(`[Phase 2/5] Joining ${TOTAL_VUS} devices (${NUM_TEAMS} teams x ${DEVICES_PER_TEAM} devices)...`);
  const vuSessions = []; // array of { teamId, joinCode, cookie }

  const joinPromises = [];
  for (let t = 0; t < teams.length; t++) {
    const team = teams[t];
    for (let d = 0; d < DEVICES_PER_TEAM; d++) {
      joinPromises.push(
        (async () => {
          const t0 = performance.now();
          try {
            const res = await fetch(`${BASE_URL}/api/join`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ joinCode: team.joinCode }),
            });
            const t1 = performance.now();
            recordLatency("join", t1 - t0);

            if (res.status === 429) {
              metrics.rateLimits++;
            } else if (!res.ok) {
              metrics.errors++;
            } else {
              const cookie = extractCookie(res, "sz_team");
              vuSessions.push({ team, deviceIndex: d, cookie });
            }
          } catch {
            metrics.errors++;
          }
        })()
      );
    }
  }
  await Promise.all(joinPromises);
  console.log(`   -> Successfully joined devices: ${vuSessions.length}/${TOTAL_VUS}\n`);

  // Phase 3: Background Polling with Realistic Jitter (3-5s)
  console.log("[Phase 3/5] Starting background polling & simulated room progression...");
  let activePolling = true;

  const pollPromises = vuSessions.map(async (session) => {
    while (activePolling) {
      // Jitter between 3000ms and 5000ms
      const jitterMs = 3000 + Math.random() * 2000;
      await sleep(jitterMs);
      if (!activePolling) break;

      const t0 = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/state`, {
          headers: session.cookie ? { Cookie: session.cookie } : {},
        });
        const t1 = performance.now();
        recordLatency("state", t1 - t0);

        if (res.status === 429) metrics.rateLimits++;
        else if (!res.ok) metrics.errors++;
      } catch {
        metrics.errors++;
      }
    }
  });

  // Phase 4: Gameplay Answers (Wrong answer followed by correct answer)
  console.log("   -> Simulating team answer submissions across Room 1 questions...");
  const questionsToSimulate = [
    { id: "1.1", wrong: "WRONG_ANSWER", correct: "SZ" },
    { id: "1.2", wrong: "999", correct: "314" },
    { id: "1.3", wrong: "42", correct: "13" },
    { id: "1.4", wrong: "INVALID", correct: "SZ-314-13" },
  ];

  // Only device 0 of each team submits answers to avoid team self-locking
  const primaryDevices = vuSessions.filter((s) => s.deviceIndex === 0);

  for (const q of questionsToSimulate) {
    console.log(`   -> Simulating submissions for Question ${q.id}...`);
    await Promise.all(
      primaryDevices.map(async (dev) => {
        if (!dev.cookie) return;

        // 1. Submit a wrong answer
        const t0_wrong = performance.now();
        try {
          const resWrong = await fetch(`${BASE_URL}/api/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: dev.cookie },
            body: JSON.stringify({ questionId: q.id, answer: q.wrong }),
          });
          recordLatency("answer", performance.now() - t0_wrong);
          if (resWrong.status === 429) metrics.rateLimits++;
          else if (!resWrong.ok) metrics.errors++;
        } catch {
          metrics.errors++;
        }

        // Realistic reading/thinking delay (500ms - 1500ms in fast simulation)
        await sleep(500 + Math.random() * 1000);

        // 2. Submit the correct answer
        const t0_correct = performance.now();
        try {
          const resCorrect = await fetch(`${BASE_URL}/api/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: dev.cookie },
            body: JSON.stringify({ questionId: q.id, answer: q.correct }),
          });
          recordLatency("answer", performance.now() - t0_correct);
          if (resCorrect.status === 429) metrics.rateLimits++;
          else if (!resCorrect.ok) metrics.errors++;
        } catch {
          metrics.errors++;
        }
      })
    );
  }

  // Phase 5: High-Concurrence Spike Test (All 90 VUs hit GET /api/state simultaneously)
  console.log("\n[Phase 5/5] Injecting synchronized spike (All 90 VUs hit /api/state at same ms)...");
  const spikePromises = vuSessions.map(async (dev) => {
    const t0 = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/state`, {
        headers: dev.cookie ? { Cookie: dev.cookie } : {},
      });
      const t1 = performance.now();
      recordLatency("spikeState", t1 - t0);
      if (res.status === 429) metrics.rateLimits++;
      else if (!res.ok) metrics.errors++;
    } catch {
      metrics.errors++;
    }
  });

  await Promise.all(spikePromises);

  // Stop background polling loops
  activePolling = false;
  await Promise.all(pollPromises);

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print Summary Report
  const joinStats = calculatePercentiles(metrics.join);
  const stateStats = calculatePercentiles(metrics.state);
  const answerStats = calculatePercentiles(metrics.answer);
  const spikeStats = calculatePercentiles(metrics.spikeState);

  const successCount = metrics.total - metrics.errors;
  const successRate = metrics.total > 0 ? ((successCount / metrics.total) * 100).toFixed(2) : "0.00";

  console.log("\n=================================================");
  console.log("SUBJECT ZERO — LOAD TEST PERFORMANCE RESULTS");
  console.log("=================================================");
  console.log(`Total Duration:       ${totalDuration}s`);
  console.log(`Total Requests:       ${metrics.total}`);
  console.log(`Successful Requests:  ${successCount}`);
  console.log(`Failed Requests:      ${metrics.errors}`);
  console.log(`Rate Limited (429s):  ${metrics.rateLimits}`);
  console.log(`Overall Success Rate: ${successRate}% (Target: >= 99.5%)`);
  console.log("-------------------------------------------------");
  console.log("Endpoint Latency Metrics (milliseconds):");
  console.log("Endpoint          Count   p50 (ms)  p95 (ms)  p99 (ms)  Avg (ms)");
  console.log(`POST /api/join    ${String(joinStats.count).padEnd(7)} ${String(joinStats.p50).padEnd(9)} ${String(joinStats.p95).padEnd(9)} ${String(joinStats.p99).padEnd(9)} ${joinStats.avg}`);
  console.log(`GET  /api/state   ${String(stateStats.count).padEnd(7)} ${String(stateStats.p50).padEnd(9)} ${String(stateStats.p95).padEnd(9)} ${String(stateStats.p99).padEnd(9)} ${stateStats.avg}`);
  console.log(`POST /api/answer  ${String(answerStats.count).padEnd(7)} ${String(answerStats.p50).padEnd(9)} ${String(answerStats.p95).padEnd(9)} ${String(answerStats.p99).padEnd(9)} ${answerStats.avg}`);
  console.log(`SPIKE /api/state  ${String(spikeStats.count).padEnd(7)} ${String(spikeStats.p50).padEnd(9)} ${String(spikeStats.p95).padEnd(9)} ${String(spikeStats.p99).padEnd(9)} ${spikeStats.avg}`);
  console.log("=================================================");

  if (parseFloat(successRate) < 99.5) {
    console.error("❌ LOAD TEST FAILED: Success rate fell below target threshold (99.5%).");
    process.exit(1);
  } else {
    console.log("✅ LOAD TEST PASSED: Venue capacity confirmed for 90 concurrent users.");
    process.exit(0);
  }
}

runLoadTest().catch((err) => {
  console.error("Fatal error during load test:", err);
  process.exit(1);
});
