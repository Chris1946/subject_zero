-- Migration: 0004_rate_limits.sql
-- Atomic Postgres advisory-locked rate limiter table and function

create table if not exists rate_limit_hits (
  key text not null,
  created_at timestamptz default now()
);

create index if not exists idx_rate_limit_hits_key_created_at
  on rate_limit_hits (key, created_at desc);

alter table rate_limit_hits enable row level security;

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

  -- 2. Opportunistic cleanup of stale records older than 1 hour
  delete from rate_limit_hits
  where created_at < now() - interval '1 hour';

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
