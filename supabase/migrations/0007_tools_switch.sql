-- Migration: 0007_tools_switch.sql
-- Kill switch for interactive puzzle tools
-- When false, all rooms fall back to plain-text prompts (e.g. 1.1 displays the binary string directly)

alter table game_state
  add column if not exists tools_enabled boolean not null default true;
