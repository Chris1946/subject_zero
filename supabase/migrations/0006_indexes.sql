-- Migration: 0006_indexes.sql
-- Optimizations for hot-path queries, index hardening, and bounded rate limiter cleanup.

-- 1. Ensure fast lookup for team authentication by join code
create index if not exists idx_teams_join_code on teams (join_code);

-- 2. Fast lookup for team active state and progress
create index if not exists idx_teams_progress on teams (progress desc, attempts asc);
create index if not exists idx_teams_disqualified on teams (disqualified);

-- 3. Composite indexes for attempt queries
create index if not exists idx_attempts_team_question_correct
  on attempts (team_id, question_id, is_correct);

create index if not exists idx_attempts_created_at
  on attempts (created_at desc);

-- 4. Rate limit cleanup index
create index if not exists idx_rate_limit_hits_created_at_cleanup
  on rate_limit_hits (created_at);

-- 5. Admin audit log index
create index if not exists idx_admin_log_created_at
  on admin_log (created_at desc);

-- 6. Replace hit_rate_limit with bounded opportunistic cleanup
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
  -- 1. Take transaction-level advisory lock on hash of the key to prevent concurrent bypass
  perform pg_advisory_xact_lock(hashtext(p_key));

  -- 2. Bounded opportunistic cleanup (max 200 rows per call, run on ~10% of calls to prevent table locks)
  if random() < 0.10 then
    delete from rate_limit_hits
    where ctid in (
      select ctid from rate_limit_hits
      where created_at < now() - interval '1 hour'
      limit 200
    );
  end if;

  -- 3. Count hits inside the active sliding window
  select count(*) into v_count
  from rate_limit_hits
  where key = p_key
    and created_at >= (now() - (p_window_seconds || ' seconds')::interval);

  -- 4. Reject if max exceeded
  if v_count >= p_max then
    return false;
  end if;

  -- 5. Record this hit and allow
  insert into rate_limit_hits (key, created_at)
  values (p_key, now());

  return true;
end;
$$;

-- 7. Revoke direct RPC execution from anon and authenticated roles
revoke execute on function hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function hit_rate_limit(text, int, int) to service_role;

revoke execute on function submit_answer(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function submit_answer(uuid, text, text, boolean) to service_role;

