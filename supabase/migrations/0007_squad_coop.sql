-- Migration: 0007_squad_coop.sql
-- 4-Player Co-op Squad Mechanics: Member tracking, turn enforcement, 15-minute round timers, and Round 5 distributed assignment

-- 1. Add squad co-op configuration columns to teams
alter table teams
  add column if not exists round_duration_seconds int not null default 900,
  add column if not exists current_round_started_at timestamptz,
  add column if not exists lobby_ready boolean not null default false;

-- 2. Create team_members table for strict 4-member squad enforcement
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

-- 3. Row Level Security for team_members (strictly managed by server role)
alter table team_members enable row level security;
