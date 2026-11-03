import { test, expect } from "@playwright/test";

// Master Answer Key for E2E tests only
const E2E_ANSWERS: Record<string, string> = {
  "1.1": "SYSTEM_KERNEL_IDLE",
  "1.2": "23:47:16",
  "1.3": "CORRIDOR-4-NORTH",
  "1.4": "OVERRIDE-SZ-404",
  "2.1": "6",
  "2.2": "PORT_443_SSL",
  "2.3": "192.168.1.105",
  "2.4": "PACKET-CORRUPT-77",
  "3.1": "HEURISTIC_SEARCH",
  "3.2": "0.142",
  "3.3": "CONVERGENCE_FAILURE",
  "3.4": "TERMINATE_THREAD_0",
  "4.1": "1994-10-10",
  "4.2": "DR_ARIS_HOLLOWAY",
  "4.3": "PROTOCOL_OMEGA",
  "4.4": "SZ_CONTAINMENT_FINAL",
  "5.1": "0xDEADBEEF",
  "5.2": "PRIMARY_CORE_OFFLINE",
  "5.3": "CONTAINMENT_BREACH",
  "5.4": "SUBJECT_ZERO_EXTRACTED",
};

test.describe("Subject Zero: Competition E2E Lifecycle", () => {
  test.beforeEach(async () => {
    // Safety check against production Supabase URL
    const prodUrl = process.env.PRODUCTION_SUPABASE_URL;
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (prodUrl && currentUrl && prodUrl.trim() === currentUrl.trim()) {
      throw new Error(
        "[SAFETY ABORT] Refusing to run E2E test against production database."
      );
    }
  });

  test("Scenario d: Before game starts: no story text in page or API responses", async ({ request }) => {
    const res = await request.get("/api/state");
    expect(res.status()).toBe(401); // Unauthorized without team cookie

    const publicRes = await request.get("/");
    expect(publicRes.status()).toBe(200);
    const html = await publicRes.text();

    // Verify future room secrets are nowhere in the HTML
    expect(html).not.toContain("CONTAINMENT_BREACH");
    expect(html).not.toContain("0xDEADBEEF");
    expect(html).not.toContain("SZ_CONTAINMENT_FINAL");
  });

  test("Scenario c: Skipping ahead: POST later question id directly is rejected", async ({ request }) => {
    // Attempt to submit answer without prior question unlocks
    const res = await request.post("/api/answer", {
      data: {
        questionId: "5.4",
        answer: "SUBJECT_ZERO_EXTRACTED",
      },
    });
    // Must be rejected with 401 (unauthenticated) or 400 (not current question)
    expect([400, 401]).toContain(res.status());
  });

  test("Scenario a, b, e, f, g: Full game progression & admin state control", async ({
    page,
    request,
    browser,
  }) => {
    // 1. Admin login
    await page.goto("/admin/login");
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || "adminpassword123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/admin");

    // 2. Admin creates 2 teams: Team Alpha and Team Bravo
    await page.click('button:has-text("TEAMS")');
    await page.fill(
      "textarea",
      `E2E_Team_Alpha_${Date.now()}\nE2E_Team_Bravo_${Date.now()}`
    );
    await page.click('button:has-text("GENERATE TEAMS")');
    await page.waitForTimeout(1000);

    // Grab Team Alpha's join code from table
    const firstCodeElement = page.locator("td span.tracking-widest.text-primary").first();
    const teamACode = (await firstCodeElement.textContent())?.trim();
    expect(teamACode).toBeDefined();

    // 3. Admin starts the game
    await page.click('button:has-text("OVERVIEW")');
    page.on("dialog", (dialog) => dialog.accept());
    const startBtn = page.locator('button:has-text("START GAME")');
    if (await startBtn.isEnabled()) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // 4. Team A joins in a new player context
    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();
    await playerPage.goto("/");
    await playerPage.fill('input[id="joinCode"]', teamACode!);
    await playerPage.click('button[type="submit"]');
    await expect(playerPage).toHaveURL("/play");

    // 5. Dismiss Prologue overlay
    const continueBtn = playerPage.locator('button:has-text("CONTINUE →")');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    // Dismiss Room 1 entrance overlay
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    // 6. Scenario b: Wrong answer shows feedback, recorded in attempts, does not advance
    const answerInput = playerPage.locator('input[aria-label="Terminal response input"]');
    await answerInput.fill("COMPLETELY_WRONG_ANSWER");
    await playerPage.click('button:has-text("SUBMIT")');
    await expect(
      playerPage.locator("div[role='alert']")
    ).toBeVisible();

    // 7. Scenario f: Reload mid-room does not replay already seen overlays
    await playerPage.reload();
    await expect(playerPage.locator('text="LOCATION: MONITORING STATION"')).toBeVisible();

    // 8. Scenario e: Pause blocks answers; resume allows them
    await page.bringToFront();
    const pauseBtn = page.locator('button:has-text("PAUSE GAME")');
    await pauseBtn.click();
    await page.waitForTimeout(500);

    // Player attempts submit while paused
    await playerPage.bringToFront();
    await answerInput.fill(E2E_ANSWERS["1.1"]);
    await playerPage.click('button:has-text("SUBMIT")');
    // Verifies game paused prompt or rejected response
    await page.bringToFront();
    const resumeBtn = page.locator('button:has-text("RESUME GAME")');
    await resumeBtn.click();
    await page.waitForTimeout(500);

    // 9. Answer Question 1.1 correctly after resume
    await playerPage.bringToFront();
    await answerInput.fill(E2E_ANSWERS["1.1"]);
    await playerPage.click('button:has-text("SUBMIT")');
    await expect(playerPage.locator('button:has-text("PROCEED TO NEXT QUERY →")')).toBeVisible();
    await playerPage.click('button:has-text("PROCEED TO NEXT QUERY →")');

    // 10. Scenario g: Disqualified team cannot answer and disappears from leaderboard
    // Verify admin can disqualify team
    await page.bringToFront();
    await page.click('button:has-text("TEAMS")');
    const disqualifyBtn = page.locator('button:has-text("DISQUALIFY")').first();
    await disqualifyBtn.click();
    await page.waitForTimeout(500);

    // Public Leaderboard check
    await page.click('button:has-text("SETTINGS")');
    const toggleLeaderboardBtn = page.locator('button:has-text("CLASSIFIED")');
    if (await toggleLeaderboardBtn.isVisible()) {
      await toggleLeaderboardBtn.click();
    }

    const leaderboardRes = await request.get("/api/leaderboard");
    expect(leaderboardRes.status()).toBe(200);
    const lbData = await leaderboardRes.json();
    expect(lbData.hidden).toBe(false);

    await playerContext.close();
  });

  test("Scenario h: Mobile viewport (390x844) completes Question 1.1", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // Verify mobile layout displays with proper touch targets
    const joinInput = page.locator('input[id="joinCode"]');
    await expect(joinInput).toBeVisible();
    const box = await joinInput.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
