-- ============================================================================
-- WARNING: FOR LOCAL / TEST ENVIRONMENTS ONLY!
-- DO NOT RUN THIS SCRIPT IN A PRODUCTION SUPABASE INSTANCE!
-- Running this script in production will insert dummy teams and could corrupt
-- or pollute official competition data.
-- ============================================================================

-- Seed script: supabase/seed.sql
-- Inserts 3 test teams with random-looking 6-character uppercase join codes

insert into teams (name, join_code, progress, attempts)
values
    ('Team Alpha (Research Division)', 'K9X4M2', 0, 0),
    ('Team Beta (Containment Unit)', 'R7P3W8', 0, 0),
    ('Team Gamma (Signal Recon)', 'T2N9L5', 0, 0)
on conflict (name) do nothing;
