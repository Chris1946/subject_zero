-- Migration: 0002_submit_answer.sql
-- Atomic question answer processing and team progress update function

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
  -- 1. Lock the team record to eliminate concurrent submission race conditions
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

  -- 2. Reject if team is disqualified
  if v_team.disqualified then
    return jsonb_build_object(
      'success', false,
      'error', 'TEAM_DISQUALIFIED',
      'message', 'Team is disqualified from competition'
    );
  end if;

  -- 3. Reject if team has already completed all questions
  if v_team.finished_at is not null or v_team.progress >= 20 then
    return jsonb_build_object(
      'success', false,
      'error', 'TEAM_ALREADY_FINISHED',
      'message', 'Team has already completed the investigation'
    );
  end if;

  -- 4. Verify question sequence (no skipping ahead or submitting old questions)
  -- PostgreSQL arrays are 1-indexed: progress 0 maps to index 1 ('1.1')
  v_expected_id := v_order[v_team.progress + 1];
  if p_question_id != v_expected_id then
    return jsonb_build_object(
      'success', false,
      'error', 'INVALID_QUESTION_SEQUENCE',
      'message', 'Question does not match the current team progress'
    );
  end if;

  -- 5. Record attempt in attempts table (always, whether correct or incorrect)
  insert into attempts (team_id, question_id, answer_given, is_correct, created_at)
  values (p_team_id, p_question_id, p_answer_given, p_is_correct, now());

  -- 6. Apply state updates
  if p_is_correct then
    v_new_progress := v_team.progress + 1;
    v_finished := (v_new_progress >= 20);

    update teams
    set progress = v_new_progress,
        attempts = attempts + 1,
        started_at = coalesce(started_at, now()),
        finished_at = case when v_finished then now() else finished_at end
    where id = p_team_id;

    return jsonb_build_object(
      'success', true,
      'is_correct', true,
      'progress', v_new_progress,
      'finished', v_finished
    );
  else
    update teams
    set attempts = attempts + 1,
        started_at = coalesce(started_at, now())
    where id = p_team_id;

    return jsonb_build_object(
      'success', true,
      'is_correct', false,
      'progress', v_team.progress,
      'finished', false
    );
  end if;
end;
$$;
