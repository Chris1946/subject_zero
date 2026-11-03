#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const NEXT_DIR = path.join(ROOT_DIR, ".next");
const STATIC_DIR = path.join(NEXT_DIR, "static");
const SERVER_DIR = path.join(NEXT_DIR, "server");

console.log("=================================================");
console.log("SUBJECT ZERO — CLIENT BUNDLE & HTML LEAK DETECTOR");
console.log("=================================================\n");

// 1. Build if .next doesn't exist or if --build is specified
const shouldBuild = process.argv.includes("--build") || !fs.existsSync(STATIC_DIR);
if (shouldBuild) {
  console.log("[1/3] Building Next.js application (next build)...");
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch {
    console.error("\n[FATAL] Build failed before bundle inspection.");
    process.exit(1);
  }
} else {
  console.log("[1/3] Using existing build in .next/ (pass --build to rebuild)");
}

// 2. Extract answer targets from answers.server.ts
const answersFile = path.join(ROOT_DIR, "src", "lib", "game", "answers.server.ts");

const answersContent = fs.readFileSync(answersFile, "utf-8");

// Parse answers from MASTER_ANSWER_KEY
const answerMatches = answersContent.matchAll(/"([^"]+)":\s*"([^"]+)"/g);
const targetAnswers = [];
for (const match of answerMatches) {
  const ans = match[2].trim();
  // Filter out single short chars (1-2 chars) that could appear by coincidence in minified code
  if (ans.length >= 4) {
    targetAnswers.push({ label: `Answer [${match[1]}]`, text: ans });
  }
}

// Distinctive multi-character answers specifically required by the game
const criticalAnswers = [
  "SZ-314-13",
  "-10-RESTORE",
  "TRUTH-2-ALIVE",
  "THEY LIED",
  "SHUTDOWN -> AUTHENTICATION",
  "CORRUPT",
  "RESTORE",
  "0101",
];

for (const ca of criticalAnswers) {
  if (!targetAnswers.some((t) => t.text === ca)) {
    targetAnswers.push({ label: `Critical Answer`, text: ca });
  }
}

// Extract room 2-5 prompt snippets and discovery titles from content.server.ts
const targetRoomPrompts = [
  { label: "Room 2 Terminal 1", text: "NETWORK TERMINAL 01: SESSION FILTER" },
  { label: "Room 2 Terminal 2", text: "NETWORK TERMINAL 02: DATA RECONSTRUCTION" },
  { label: "Room 2 Terminal 3", text: "NETWORK TERMINAL 03: KEY RECOVERY" },
  { label: "Room 2 Terminal 4", text: "NETWORK TERMINAL 04: INCIDENT RECORD ACCESS" },
  { label: "Room 2 Discovery", text: "RECOVERED FILE: OCTOBER 10" },
  { label: "Room 3 Terminal 1", text: "CORE TERMINAL 01: MEMORY IDENTIFICATION" },
  { label: "Room 3 Terminal 2", text: "CORE TERMINAL 02: SCRIPT RECOVERY" },
  { label: "Room 3 Terminal 3", text: "CORE TERMINAL 03: COMMAND RECOVERY" },
  { label: "Room 3 Terminal 4", text: "CORE TERMINAL 04: MEMORY RESTORATION" },
  { label: "Room 3 Discovery", text: "RECOVERED FILE: SZ_FINAL_SESSION" },
  { label: "Room 4 Terminal 1", text: "ARCHIVE TERMINAL 01: CLASSIFIED LOG RECOVERY" },
  { label: "Room 4 Terminal 2", text: "ARCHIVE TERMINAL 02: RECOVERY TARGET" },
  { label: "Room 4 Terminal 3", text: "ARCHIVE TERMINAL 03: AUDIO RECORDING" },
  { label: "Room 4 Terminal 4", text: "ARCHIVE TERMINAL 04: RESEARCH ARCHIVE ACCESS" },
  { label: "Room 4 Discovery", text: "RECOVERED FILE: THE DR. VANE RECORDINGS" },
  { label: "Room 5 Terminal 1", text: "CHAMBER TERMINAL 01: FINAL FACILITY OVERRIDE" },
  { label: "Room 5 Terminal 2", text: "CHAMBER TERMINAL 02: RECOVERY VERIFICATION" },
  { label: "Room 5 Terminal 3", text: "CHAMBER TERMINAL 03: SYSTEM RESTORATION SEQUENCE" },
  { label: "Room 5 Terminal 4", text: "CHAMBER TERMINAL 04: FINAL SYSTEM DECISION" },
  { label: "Room 5 Discovery", text: "SUBJECT ZERO — TRUE IDENTITY" },
];

const allCheckTargets = [...targetAnswers, ...targetRoomPrompts];

console.log(`[2/3] Loaded ${allCheckTargets.length} secret targets (Answers & Rooms 2-5 content) to verify.`);

// 3. Collect all files to inspect: .next/static (JS, CSS) and .next/server (HTML, RSC)
function getFilesRecursively(dir, filterExts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, filterExts));
    } else if (entry.isFile()) {
      if (!filterExts || filterExts.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const staticFiles = getFilesRecursively(STATIC_DIR, [".js", ".css", ".html"]);
const serverHtmlFiles = getFilesRecursively(SERVER_DIR, [".html"]);
const filesToScan = [...staticFiles, ...serverHtmlFiles];

console.log(`[3/3] Scanning ${filesToScan.length} client bundles and pre-rendered HTML files...`);

let leakCount = 0;
const leaks = [];

for (const filePath of filesToScan) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(ROOT_DIR, filePath);

  for (const target of allCheckTargets) {
    let matched = false;
    if (target.text === "RESTORE") {
      // Exclude Next.js App Router internal symbol 'ACTION_RESTORE'
      const sanitized = content.replaceAll("ACTION_RESTORE", "");
      matched = sanitized.includes("RESTORE");
    } else {
      matched = content.includes(target.text);
    }

    if (matched) {
      leakCount++;
      leaks.push({
        file: relPath,
        label: target.label,
        matchedText: target.text,
      });
    }
  }
}

if (leakCount > 0) {
  console.error(`\n❌ [SECURITY VIOLATION] Detected ${leakCount} bundle/HTML leak(s)!`);
  for (const leak of leaks) {
    console.error(` - [${leak.label}] found in "${leak.file}" -> "${leak.matchedText}"`);
  }
  process.exit(1);
} else {
  console.log(`\n✅ [PASSED] Zero leaks found across ${filesToScan.length} inspected client files.`);
  console.log("   - No master answer keys present in client bundles.");
  console.log("   - No future room (Rooms 2-5) prompts or discovery files present in client bundles.");
  process.exit(0);
}
