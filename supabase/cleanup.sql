-- ============================================================================
-- DANGER / WARNING: DESTRUCTIVE CLEANUP SCRIPT!
-- ============================================================================
-- THIS SCRIPT WILL PERMANENTLY ERASE ALL TEAMS, SUBMISSION ATTEMPTS,
-- RATE LIMIT RECORDS, AND AUDIT LOGS, AND RESETS THE GAME STATE TO 'waiting'.
--
-- DO NOT RUN THIS DURING A LIVE COMPETITION OR ON A LIVE DATABASE WITH
-- REAL TEAMS UNLESS YOU INTEND TO COMPLETELY WIPE THE EVENT!
-- ============================================================================

begin;

-- 1. Remove all submission attempts and squad members
delete from attempts;
delete from team_members;

-- 2. Remove all registered teams
delete from teams;

-- 3. Clear rate limit tracking hits
delete from rate_limit_hits;

-- 4. Clear admin action logs
delete from admin_log;

-- 5. Reset singleton game_state row to initial 'waiting' state
update game_state
set
  status = 'waiting',
  started_at = null,
  paused_at = null,
  paused_total_seconds = 0,
  leaderboard_visible = false
where id = 1;

commit;

-- Verification
select status, started_at, paused_at, paused_total_seconds, leaderboard_visible from game_state where id = 1;
select count(*) as remaining_teams from teams;
select count(*) as remaining_attempts from attempts;
select count(*) as remaining_rate_limit_hits from rate_limit_hits;
