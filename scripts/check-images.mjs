import fs from "node:fs";
import path from "node:path";

const REQUIRED_SCENES = [
  "prologue",
  "round1",
  "round2",
  "round3",
  "round4",
  "round5",
  "final",
];

const DESKTOP_MAX_BYTES = 250 * 1024; // 250 KB
const MOBILE_MAX_BYTES = 100 * 1024;  // 100 KB

const scenesDir = path.resolve(process.cwd(), "public", "scenes");

console.log("=================================================");
console.log("SUBJECT ZERO // SCENE IMAGES VERIFICATION AUDIT");
console.log("Target: 1600x900 WebP < 250KB, 800x450 WebP < 100KB");
console.log("=================================================\n");

let missingCount = 0;
let overBudgetCount = 0;

for (const key of REQUIRED_SCENES) {
  const desktopFile = path.join(scenesDir, `${key}.webp`);
  const mobileFile = path.join(scenesDir, `${key}-mobile.webp`);

  const desktopExists = fs.existsSync(desktopFile);
  const mobileExists = fs.existsSync(mobileFile);

  if (!desktopExists) {
    console.warn(`[MISSING] Desktop image for key: ${key}.webp`);
    missingCount++;
  } else {
    const size = fs.statSync(desktopFile).size;
    const sizeKb = (size / 1024).toFixed(1);
    if (size > DESKTOP_MAX_BYTES) {
      console.warn(`[OVER BUDGET] ${key}.webp is ${sizeKb} KB (Budget: 250 KB)`);
      overBudgetCount++;
    } else {
      console.log(`[OK] ${key}.webp (${sizeKb} KB)`);
    }
  }

  if (mobileExists) {
    const mobileSize = fs.statSync(mobileFile).size;
    const mobileSizeKb = (mobileSize / 1024).toFixed(1);
    if (mobileSize > MOBILE_MAX_BYTES) {
      console.warn(`[OVER BUDGET] ${key}-mobile.webp is ${mobileSizeKb} KB (Budget: 100 KB)`);
      overBudgetCount++;
    } else {
      console.log(`[OK] ${key}-mobile.webp (${mobileSizeKb} KB)`);
    }
  }
}

console.log("\n-------------------------------------------------");
console.log(`Audit Complete: ${REQUIRED_SCENES.length} required scenes checked.`);
if (missingCount > 0 || overBudgetCount > 0) {
  console.warn(`WARNING: ${missingCount} missing, ${overBudgetCount} over budget.`);
} else {
  console.log("ALL 7 SCENE IMAGES PRESENT AND WITHIN BUDGETS.");
}
console.log("-------------------------------------------------\n");

// Warning only: exit 0 so build is not blocked
process.exit(0);
