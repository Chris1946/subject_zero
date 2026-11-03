# SUBJECT ZERO — Event Day Organizer Runbook

A complete operational guide for event directors, judges, and technical leads running the **SUBJECT ZERO** escape room competition.

---

## 1. Timeline Checklists

### One Week Before
- [ ] **Supabase Production Project**: Dedicated Supabase project provisioned in the cloud region closest to venue.
- [ ] **Database Migrations**: Ran `supabase/all_migrations.sql` in Supabase SQL editor. Verified tables and RLS are active.
- [ ] **Production Hosting**: Vercel production deployment configured with function region matching Supabase region (`iad1` / Frankfurt / etc.).
- [ ] **Custom Domain & SSL**: Custom domain configured (e.g. `play.csi-event.org`), DNS propagated, SSL certificate active and verified.
- [ ] **Organizer Dry Run**: 2–3 organizers run through the game on a separate test deployment to familiarize themselves with puzzle flows.
- [ ] **AV Preparation**: Coordinate venue audio cables (3.5mm / HDMI / Bluetooth) for ambient background sound.

### Two Days Before
- [ ] **Generate Team Join Codes**: In Admin Dashboard (`/admin`), create all competing teams and download/copy join codes.
- [ ] **Database Sanitization**: Execute `supabase/cleanup.sql` on the test database if used for rehearsals. (DO NOT wipe production once seeded with official teams!).
- [ ] **Onsite Rate Limiting**: Ensure `EVENT_MODE=onsite` is set in Vercel Production Environment Variables (scales IP limits to 600/min).
- [ ] **Print Credential Cards**: Print physical team credential cards (one per team containing Team Name, Join Code, and Event URL).
- [ ] **Audio Soundcheck**: Test venue sound system with `/` ambient loop and chime audio to set proper room volume.

### Day Before
- [ ] **Dress Rehearsal**: Run 1 dummy team through Room 1 to verify database latency and mobile responsiveness.
- [ ] **Leaderboard Projector Test**: Connect venue projector to a dedicated display machine and open `/leaderboard` in full screen (F11).
- [ ] **Verify Captive Portal**: Test venue Wi-Fi login flow. Ensure player devices do not drop WebSocket or HTTPS connections.
- [ ] **Print Judges' Sheets**: Print copies of the **Judges' Station Sheet** (Section 3 below) for roaming marshals.

---

## 2. Event Day Execution

### Morning Setup (2–3 Hours Before Start)
- [ ] Test venue Wi-Fi on at least 3 distinct devices (iPhone, Android, laptop).
- [ ] Verify latency to Supabase API endpoints (`< 50ms`).
- [ ] Inspect room lighting (dim or atmospheric cold blue lighting enhances immersion).
- [ ] Check venue projector resolution (recommended 1920x1080) and test audio levels.

### 30 Minutes Before Briefing
- [ ] Open `/admin` on the Lead Organizer laptop. Verify game status is `waiting`.
- [ ] Ensure Projector displays `/leaderboard` showing `AWAITING PROTOCOL INITIATION`.
- [ ] Distribute sealed team credential envelopes to team tables / stations.
- [ ] Instruct players **NOT** to open envelopes until instructed.
- [ ] Set up organizer backup phone on 4G/5G mobile hotspot in case venue Wi-Fi stutters.

### During Play (Game In Progress)
- [ ] **Start Game**: Click **"Start Game"** in `/admin` at the official kickoff time.
- [ ] **Monitor Live Dashboard**:
  - Watch the live attempts counter and progress bars.
  - Watch for any team with high failed attempt rates (may need a gentle hint from a marshal).
  - Ensure background audio is playing cleanly at atmospheric volume.
- [ ] **Admin Connection Backup**: Keep a backup phone or tablet connected to `/admin` via mobile data.

### End of Game & Awards
- [ ] When the final team finishes or the time limit expires, click **"End Game"** in `/admin`.
- [ ] The leaderboard will automatically lock and reveal the official winner podium.
- [ ] Click **"Export CSV"** in `/admin` to save the official immutable scoresheet.
- [ ] Present awards based on the verified Top 3 teams on the projector.

---

## 3. Contingency Operations

### A. Venue Wi-Fi Drops
- **Player State Safety**: All team progress and elapsed times are stored safely in Supabase. Nothing is lost if Wi-Fi disconnects.
- **Action**: Advise teams to remain calm and refresh the browser once the Wi-Fi reconnects. The system resumes immediately at their current question.

### B. Player Device Battery Dies or Browser Crashes
- **Can they switch devices?**: **YES.**
- **Action**: Any team member can open the event URL on a secondary phone or laptop and enter the same 6-character Join Code. The new device will instantly restore full team state and progress. Multiple devices per team are supported.

### C. Rogue Player or Malicious Activity
- **Action**: Locate the team in the `/admin` dashboard and click **"Disqualify"**.
- **Effect**: The team is instantly locked out with a disqualification screen, submissions are rejected by the database RPC, and the team is purged from the public leaderboard.

### D. Accidental Game Pause / Emergency Interruption
- **Action**: If a venue emergency occurs, click **"Pause Game"** in `/admin`.
- **Compensation**: The system tracks `paused_total_seconds` in the database and automatically deducts paused duration from all team completion times upon resume. Click **"Resume Game"** when ready.

### E. Tie-Break Protocol
- The system automatically breaks ties in the following strict order:
  1. Lowest active duration (`duration_seconds` excluding paused time).
  2. Lowest number of wrong submission attempts (`attempts`).
  3. Earliest finish timestamp (`finished_at`).

### F. Projector Hardware Failure
- If the main venue projector dies, organizers can display the leaderboard on a secondary monitor, or toggle `Leaderboard Visible` in `/admin` so players can view `/leaderboard` directly on their phones.

---

## 4. Post-Event Wrap-up

- [ ] Click **"Export CSV"** in the admin dashboard and backup the CSV to cloud storage.
- [ ] Run `supabase/cleanup.sql` if resetting the database for a future chapter.
- [ ] Revoke or change `ADMIN_PASSWORD` in Vercel environment variables.

---

## 5. Printable Judges' Station Sheet

*(Print one copy per judge or display on a tablet)*

**Date:** ________________________   **Marshal Name:** ________________________

| Station # | Team Name | Join Code | Room 1 (0-4) | Room 2 (5-8) | Room 3 (9-12) | Room 4 (13-16) | Room 5 (17-20) | Finish Time | Notes / Hints Given |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **01** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **02** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **03** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **04** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **05** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **06** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **07** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **08** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **09** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **10** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **11** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **12** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **13** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **14** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **15** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **16** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **17** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **18** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **19** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **20** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **21** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **22** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **23** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **24** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
| **25** | | | [ ] | [ ] | [ ] | [ ] | [ ] | | |
