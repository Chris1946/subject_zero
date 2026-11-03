-- ============================================================================
-- SUBJECT ZERO — CONCATENATED MIGRATIONS (0001 to 0006)
-- Run this in the Supabase SQL Editor for complete one-click database setup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Migration 0001: Initial Schema & Tables
-- ----------------------------------------------------------------------------

create table if not exists teams (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    join_code text unique not null,
    progress int not null default 0, -- number of questions solved (0-20)
    attempts int not null default 0,
    started_at timestamptz,
    finished_at timestamptz,
    disqualified boolean not null default false,
    created_at timestamptz default now()
);

create table if not exists attempts (
    id bigint generated always as identity primary key,
    team_id uuid not null references teams(id) on delete cascade,
    question_id text not null,
    answer_given text not null,
    is_correct boolean not null,
    created_at timestamptz default now()
);

create index if not exists idx_attempts_team_id_created_at on attempts(team_id, created_at);

create table if not exists game_state (
    id int primary key check (id = 1),
    status text not null default 'waiting' check (status in ('waiting', 'running', 'paused', 'ended')),
    started_at timestamptz
);

insert into game_state (id, status, started_at)
values (1, 'waiting', null)
on conflict (id) do nothing;

alter table teams enable row level security;
alter table attempts enable row level security;
alter table game_state enable row level security;

-- ----------------------------------------------------------------------------
-- Migration 0002: submit_answer RPC
-- ----------------------------------------------------------------------------

create or replace function submit_answer(
  p_team_id uuid,
  p_question_id text,
  p_answer_given text,
  p_is_correct boolean
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_team record;
  v_order text[] := array[
    '1.1', '1.2', '1.3', '1.4',
    '2.1', '2.2', '2.3', '2.4',
    '3.1', '3.2', '3.3', '3.4',
    '4.1', '4.2', '4.3', '4.4',
    '5.1', '5.2', '5.3', '5.4'
  ];
  v_expected_id text;
  v_new_progress int;
  v_finished boolean := false;
begin
  select * into v_team
  from teams
  where id = p_team_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'TEAM_NOT_FOUND',
      'message', 'Team record could not be found'
    );
  end if;

  if v_team.disqualified then
    return jsonb_build_object(
      'success', false,
      'error', 'TEAM_DISQUALIFIED',
      'message', 'Team is disqualified from competition'
    );
  end if;

  if v_team.finished_at is not null or v_team.progress >= 20 then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_COMPLETED',
      'message', 'Team has already completed all facility protocols'
    );
  end if;

  v_expected_id := v_order[v_team.progress + 1];
  if p_question_id != v_expected_id then
    return jsonb_build_object(
      'success', false,
      'error', 'OUT_OF_ORDER',
      'message', 'Submitted question ID does not match current sequence',
      'expectedQuestionId', v_expected_id
    );
  end if;

  insert into attempts (team_id, question_id, answer_given, is_correct)
  values (p_team_id, p_question_id, p_answer_given, p_is_correct);

  if p_is_correct then
    v_new_progress := v_team.progress + 1;
    v_finished := (v_new_progress >= 20);

    update teams
    set
      progress = v_new_progress,
      attempts = attempts + 1,
      started_at = coalesce(started_at, now()),
      finished_at = case when v_finished then now() else finished_at end
    where id = p_team_id;

    return jsonb_build_object(
      'success', true,
      'isCorrect', true,
      'newProgress', v_new_progress,
      'finished', v_finished,
      'attempts', v_team.attempts + 1
    );
  else
    update teams
    set attempts = attempts + 1
    where id = p_team_id;

    return jsonb_build_object(
      'success', true,
      'isCorrect', false,
      'newProgress', v_team.progress,
      'finished', false,
      'attempts', v_team.attempts + 1
    );
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Migration 0003: Game Control, Pause Tracking, Admin Log, Team Results View
-- ----------------------------------------------------------------------------

alter table game_state
  add column if not exists paused_at timestamptz,
  add column if not exists paused_total_seconds int not null default 0;

create table if not exists admin_log (
  id bigint generated always as identity primary key,
  action text not null,
  detail jsonb,
  created_at timestamptz default now()
);

alter table admin_log enable row level security;

create or replace function submit_answer(
  p_team_id uuid,
  p_question_id text,
  p_answer_given text,
  p_is_correct boolean
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_game_status text;
  v_team record;
  v_order text[] := array[
    '1.1', '1.2', '1.3', '1.4',
    '2.1', '2.2', '2.3', '2.4',
    '3.1', '3.2', '3.3', '3.4',
    '4.1', '4.2', '4.3', '4.4',
    '5.1', '5.2', '5.3', '5.4'
  ];
  v_expected_id text;
  v_new_progress int;
  v_finished boolean := false;
begin
  select status into v_game_status
  from game_state
  where id = 1;

  if v_game_status is null or v_game_status != 'running' then
    return jsonb_build_object(
      'success', false,
      'error', 'GAME_NOT_RUNNING',
      'message', 'Submissions rejected: system is ' || coalesce(v_game_status, 'offline')
    );
  end if;

  select * into v_team
  from teams
  where id = p_team_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'TEAM_NOT_FOUND',
      'message', 'Team record could not be found'
    );
  end if;

  if v_team.disqualified then
    return jsonb_build_object(
      'success', false,
      'error', 'TEAM_DISQUALIFIED',
      'message', 'Team is disqualified from competition'
    );
  end if;

  if v_team.finished_at is not null or v_team.progress >= 20 then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_COMPLETED',
      'message', 'Team has already completed all facility protocols'
    );
  end if;

  v_expected_id := v_order[v_team.progress + 1];
  if p_question_id != v_expected_id then
    return jsonb_build_object(
      'success', false,
      'error', 'OUT_OF_ORDER',
      'message', 'Submitted question ID does not match current sequence',
      'expectedQuestionId', v_expected_id
    );
  end if;

  insert into attempts (team_id, question_id, answer_given, is_correct)
  values (p_team_id, p_question_id, p_answer_given, p_is_correct);

  if p_is_correct then
    v_new_progress := v_team.progress + 1;
    v_finished := (v_new_progress >= 20);

    update teams
    set
      progress = v_new_progress,
      attempts = attempts + 1,
      started_at = coalesce(started_at, now()),
      finished_at = case when v_finished then now() else finished_at end
    where id = p_team_id;

    return jsonb_build_object(
      'success', true,
      'isCorrect', true,
      'newProgress', v_new_progress,
      'finished', v_finished,
      'attempts', v_team.attempts + 1
    );
  else
    update teams
    set attempts = attempts + 1
    where id = p_team_id;

    return jsonb_build_object(
      'success', true,
      'isCorrect', false,
      'newProgress', v_team.progress,
      'finished', false,
      'attempts', v_team.attempts + 1
    );
  end if;
end;
$$;

create or replace view team_results as
select
  t.id,
  t.name,
  t.join_code,
  t.progress,
  t.attempts,
  t.disqualified,
  t.started_at,
  t.finished_at,
  case
    when t.finished_at is not null and gs.started_at is not null then
      greatest(
        0,
        floor(
          extract(epoch from (t.finished_at - gs.started_at)) - coalesce(gs.paused_total_seconds, 0)
        )::int
      )
    else null
  end as duration_seconds
from teams t
cross join game_state gs
where gs.id = 1;

-- ----------------------------------------------------------------------------
-- Migration 0004: Rate Limiting Table & hit_rate_limit RPC
-- ----------------------------------------------------------------------------

create table if not exists rate_limit_hits (
  key text not null,
  created_at timestamptz default now()
);

create index if not exists idx_rate_limit_hits_key_created_at
  on rate_limit_hits (key, created_at desc);

alter table rate_limit_hits enable row level security;

-- ----------------------------------------------------------------------------
-- Migration 0005: Leaderboard Visibility & Public Progress View
-- ----------------------------------------------------------------------------

alter table game_state
  add column if not exists leaderboard_visible boolean not null default false;

create or replace view team_progress_public as
select
  t.name,
  t.progress,
  t.attempts,
  t.finished_at,
  case
    when t.finished_at is not null and gs.started_at is not null then
      greatest(
        0,
        floor(
          extract(epoch from (t.finished_at - gs.started_at)) - coalesce(gs.paused_total_seconds, 0)
        )::int
      )
    else null
  end as duration_seconds
from teams t
cross join game_state gs
where t.disqualified = false
  and gs.id = 1;

-- ----------------------------------------------------------------------------
-- Migration 0006: Hot-path Indexes, Bounded Limiter Cleanup, RPC Role Lockdown
-- ----------------------------------------------------------------------------

create index if not exists idx_teams_join_code on teams (join_code);
create index if not exists idx_teams_progress on teams (progress desc, attempts asc);
create index if not exists idx_teams_disqualified on teams (disqualified);

create index if not exists idx_attempts_team_question_correct
  on attempts (team_id, question_id, is_correct);

create index if not exists idx_attempts_created_at
  on attempts (created_at desc);

create index if not exists idx_rate_limit_hits_created_at_cleanup
  on rate_limit_hits (created_at);

create index if not exists idx_admin_log_created_at
  on admin_log (created_at desc);

create or replace function hit_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));

  if random() < 0.10 then
    delete from rate_limit_hits
    where ctid in (
      select ctid from rate_limit_hits
      where created_at < now() - interval '1 hour'
      limit 200
    );
  end if;

  select count(*) into v_count
  from rate_limit_hits
  where key = p_key
    and created_at >= (now() - (p_window_seconds || ' seconds')::interval);

  if v_count >= p_max then
    return false;
  end if;

  insert into rate_limit_hits (key, created_at)
  values (p_key, now());

  return true;
end;
$$;

revoke execute on function hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function hit_rate_limit(text, int, int) to service_role;

revoke execute on function submit_answer(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function submit_answer(uuid, text, text, boolean) to service_role;

-- ----------------------------------------------------------------------------
-- Migration 0007: Squad Co-op, 4-Member Slots, Turn Enforcement, 15m Timers
-- ----------------------------------------------------------------------------

alter table teams
  add column if not exists round_duration_seconds int not null default 900,
  add column if not exists current_round_started_at timestamptz,
  add column if not exists lobby_ready boolean not null default false;

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  member_index int not null check (member_index between 1 and 4),
  name text not null,
  email text not null,
  assigned_round int check (assigned_round between 1 and 4),
  round5_question_id text check (round5_question_id in ('5.1', '5.2', '5.3', '5.4')),
  round5_submitted boolean not null default false,
  round5_answer_correct boolean not null default false,
  is_connected boolean not null default false,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint uq_team_members_team_index unique (team_id, member_index),
  constraint uq_team_members_team_email unique (team_id, email)
);

create index if not exists idx_team_members_team_id on team_members(team_id);
create index if not exists idx_team_members_email on team_members(email);

alter table team_members enable row level security;

