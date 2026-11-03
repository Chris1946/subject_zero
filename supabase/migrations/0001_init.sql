-- Migration: 0001_init.sql
-- Subject Zero Escape Room Initial Schema

-- 1. Teams Table
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

-- 2. Attempts Table
create table if not exists attempts (
    id bigint generated always as identity primary key,
    team_id uuid not null references teams(id) on delete cascade,
    question_id text not null,
    answer_given text not null,
    is_correct boolean not null,
    created_at timestamptz default now()
);

create index if not exists idx_attempts_team_id_created_at on attempts(team_id, created_at);

-- 3. Game State Table (Single-row configuration)
create table if not exists game_state (
    id int primary key check (id = 1),
    status text not null default 'waiting' check (status in ('waiting', 'running', 'paused', 'ended')),
    started_at timestamptz
);

-- Insert initial singleton row
insert into game_state (id, status, started_at)
values (1, 'waiting', null)
on conflict (id) do nothing;

-- 4. Row Level Security (RLS)
-- Row Level Security is enabled on all tables without public policies.
-- In Subject Zero, all reads and writes are mediated by server-side route handlers
-- using the Supabase Service Role Key. By having RLS enabled and defining no
-- public access policies, anonymous or client-side anon-key access is strictly
-- blocked from querying or modifying team data, submissions, and game status directly.
alter table teams enable row level security;
alter table attempts enable row level security;
alter table game_state enable row level security;
