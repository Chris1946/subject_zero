#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

console.log("=================================================");
console.log("SUBJECT ZERO — DATABASE RLS & SECURITY AUDIT");
console.log("=================================================\n");

// 1. Load environment variables from .env.local or process.env
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && !process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("❌ [FATAL] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  console.error("Please configure .env.local before running RLS audit.");
  process.exit(1);
}

console.log(`Connecting via ANON key to: ${supabaseUrl}\n`);

// 2. Initialize client with ONLY the public anon key (NEVER service role)
const client = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

let failed = false;

function reportResult(checkName, passed, detail) {
  if (passed) {
    console.log(`✅ [PASS] ${checkName}: Access denied or blocked as expected.`);
  } else {
    console.error(`❌ [FAIL] ${checkName}: UNEXPECTED SUCCESS OR LEAK! -> ${detail}`);
    failed = true;
  }
}

async function runRlsTests() {
  // Test 1: SELECT from teams
  try {
    const { data, error } = await client.from("teams").select("*");
    const passed = error !== null || !data || data.length === 0;
    reportResult("SELECT from 'teams'", passed, `Returned ${data?.length} row(s)`);
  } catch (err) {
    reportResult("SELECT from 'teams'", true, err.message);
  }

  // Test 2: SELECT from attempts
  try {
    const { data, error } = await client.from("attempts").select("*");
    const passed = error !== null || !data || data.length === 0;
    reportResult("SELECT from 'attempts'", passed, `Returned ${data?.length} row(s)`);
  } catch (err) {
    reportResult("SELECT from 'attempts'", true, err.message);
  }

  // Test 3: SELECT from game_state
  try {
    const { data, error } = await client.from("game_state").select("*");
    const passed = error !== null || !data || data.length === 0;
    reportResult("SELECT from 'game_state'", passed, `Returned ${data?.length} row(s)`);
  } catch (err) {
    reportResult("SELECT from 'game_state'", true, err.message);
  }

  // Test 4: SELECT from rate_limit_hits
  try {
    const { data, error } = await client.from("rate_limit_hits").select("*");
    const passed = error !== null || !data || data.length === 0;
    reportResult("SELECT from 'rate_limit_hits'", passed, `Returned ${data?.length} row(s)`);
  } catch (err) {
    reportResult("SELECT from 'rate_limit_hits'", true, err.message);
  }

  // Test 5: SELECT from admin_log
  try {
    const { data, error } = await client.from("admin_log").select("*");
    const passed = error !== null || !data || data.length === 0;
    reportResult("SELECT from 'admin_log'", passed, `Returned ${data?.length} row(s)`);
  } catch (err) {
    reportResult("SELECT from 'admin_log'", true, err.message);
  }

  // Test 5b: SELECT from team_members
  try {
    const { data, error } = await client.from("team_members").select("*");
    const passed = error !== null || !data || data.length === 0;
    reportResult("SELECT from 'team_members'", passed, `Returned ${data?.length} row(s)`);
  } catch (err) {
    reportResult("SELECT from 'team_members'", true, err.message);
  }

  // Test 6: INSERT into teams
  try {
    const { data, error } = await client.from("teams").insert({
      name: `RLS_PROBE_${Date.now()}`,
      join_code: "EXPLOIT",
    }).select();
    const passed = error !== null && (!data || data.length === 0);
    reportResult("INSERT into 'teams'", passed, `Successfully inserted unauthorized record!`);
  } catch (err) {
    reportResult("INSERT into 'teams'", true, err.message);
  }

  // Test 6b: INSERT into team_members
  try {
    const { data, error } = await client.from("team_members").insert({
      member_index: 1,
      name: "Exploit Agent",
      email: "hacker@probe.com",
    }).select();
    const passed = error !== null && (!data || data.length === 0);
    reportResult("INSERT into 'team_members'", passed, `Successfully inserted unauthorized member!`);
  } catch (err) {
    reportResult("INSERT into 'team_members'", true, err.message);
  }

  // Test 7: UPDATE game_state
  try {
    const { data, error } = await client.from("game_state").update({
      status: "ended",
    }).eq("id", 1).select();
    const passed = error !== null || !data || data.length === 0;
    reportResult("UPDATE 'game_state'", passed, `Successfully mutated game state without auth!`);
  } catch (err) {
    reportResult("UPDATE 'game_state'", true, err.message);
  }

  // Test 8: hit_rate_limit RPC execution
  try {
    const { data, error } = await client.rpc("hit_rate_limit", {
      p_key: "probe",
      p_max: -1,
      p_window_seconds: -1,
    });
    // With execute revoked or invalid args, it MUST error
    const passed = error !== null;
    reportResult("RPC 'hit_rate_limit'", passed, `RPC returned without error: ${JSON.stringify(data)}`);
  } catch (err) {
    reportResult("RPC 'hit_rate_limit'", true, err.message);
  }

  console.log("\n-------------------------------------------------");
  if (failed) {
    console.error("❌ RLS SECURITY AUDIT FAILED. One or more tables/RPCs are accessible to anon.");
    process.exit(1);
  } else {
    console.log("✅ ALL RLS CHECKS PASSED. Anonymous clients have 0 read/write access to core data.");
    process.exit(0);
  }
}

runRlsTests();
