-- Migration: 0005_leaderboard_settings.sql
-- Leaderboard visibility toggle and public sanitized progress view

-- 1. Add leaderboard_visible to game_state
alter table game_state
  add column if not exists leaderboard_visible boolean not null default false;

-- 2. Public sanitized view: NO ids, NO join codes, NO answers, excluding disqualified teams
create or replace view team_progress_public as
select
  t.name,
  t.progress,
  t.attempts,
  t.finished_at,
  case
    when t.finished_at is not null and t.started_at is not null then
      greatest(
        0,
        floor(
          extract(epoch from (t.finished_at - t.started_at))
        )::int
      )
    else null
  end as duration_seconds
from teams t
where t.disqualified = false;
