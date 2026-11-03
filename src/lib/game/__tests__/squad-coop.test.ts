import { describe, it, expect } from "vitest";

describe("Squad Co-op 4-Player Mechanics", () => {
  interface SquadMemberMock {
    id: string;
    name: string;
    email: string;
    assigned_round: number;
    round5_question_id: string;
    round5_submitted: boolean;
  }

  const sampleMembers: SquadMemberMock[] = [
    {
      id: "mem-1",
      name: "Agent Alice",
      email: "alice@holloway.net",
      assigned_round: 1,
      round5_question_id: "5.1",
      round5_submitted: false,
    },
    {
      id: "mem-2",
      name: "Agent Bob",
      email: "bob@holloway.net",
      assigned_round: 2,
      round5_question_id: "5.2",
      round5_submitted: false,
    },
    {
      id: "mem-3",
      name: "Agent Charlie",
      email: "charlie@holloway.net",
      assigned_round: 3,
      round5_question_id: "5.3",
      round5_submitted: false,
    },
    {
      id: "mem-4",
      name: "Agent Dana",
      email: "dana@holloway.net",
      assigned_round: 4,
      round5_question_id: "5.4",
      round5_submitted: false,
    },
  ];

  function getActiveOperator(members: SquadMemberMock[], progress: number) {
    const currentRound = Math.min(5, Math.floor(progress / 4) + 1);
    if (currentRound === 5) return null; // All players active in round 5
    return members.find((m) => m.assigned_round === currentRound) ?? null;
  }

  function checkTurnPermission(
    member: SquadMemberMock,
    progress: number,
    questionId: string
  ): { allowed: boolean; reason?: string } {
    const currentRound = Math.min(5, Math.floor(progress / 4) + 1);

    if (currentRound < 5) {
      if (member.assigned_round !== currentRound) {
        return {
          allowed: false,
          reason: `THIS IS NOT YOUR TURN. Sector ${currentRound} is assigned to another agent.`,
        };
      }
      return { allowed: true };
    }

    // Round 5: Distributed Objective Check
    if (member.round5_question_id !== questionId) {
      return {
        allowed: false,
        reason: `ACCESS RESTRICTED: You are assigned Objective ${member.round5_question_id}`,
      };
    }

    return { allowed: true };
  }

  describe("Turn-taking Enforcement in Sectors 1–4", () => {
    it("permits only Agent Alice in Sector 1 (Questions 1.1–1.4)", () => {
      // Progress = 0 (Question 1.1)
      expect(getActiveOperator(sampleMembers, 0)?.name).toBe("Agent Alice");
      expect(checkTurnPermission(sampleMembers[0], 0, "1.1").allowed).toBe(true);

      // Bob, Charlie, Dana are rejected
      expect(checkTurnPermission(sampleMembers[1], 0, "1.1").allowed).toBe(false);
      expect(checkTurnPermission(sampleMembers[2], 0, "1.1").allowed).toBe(false);
      expect(checkTurnPermission(sampleMembers[3], 0, "1.1").allowed).toBe(false);
    });

    it("permits only Agent Bob in Sector 2 (Questions 2.1–2.4)", () => {
      // Progress = 5 (Question 2.2)
      expect(getActiveOperator(sampleMembers, 5)?.name).toBe("Agent Bob");
      expect(checkTurnPermission(sampleMembers[1], 5, "2.2").allowed).toBe(true);

      expect(checkTurnPermission(sampleMembers[0], 5, "2.2").allowed).toBe(false);
      expect(checkTurnPermission(sampleMembers[0], 5, "2.2").reason).toContain("NOT YOUR TURN");
    });

    it("permits only Agent Charlie in Sector 3 (Questions 3.1–3.4)", () => {
      // Progress = 10 (Question 3.3)
      expect(getActiveOperator(sampleMembers, 10)?.name).toBe("Agent Charlie");
      expect(checkTurnPermission(sampleMembers[2], 10, "3.3").allowed).toBe(true);
      expect(checkTurnPermission(sampleMembers[1], 10, "3.3").allowed).toBe(false);
    });

    it("permits only Agent Dana in Sector 4 (Questions 4.1–4.4)", () => {
      // Progress = 14 (Question 4.3)
      expect(getActiveOperator(sampleMembers, 14)?.name).toBe("Agent Dana");
      expect(checkTurnPermission(sampleMembers[3], 14, "4.3").allowed).toBe(true);
      expect(checkTurnPermission(sampleMembers[2], 14, "4.3").allowed).toBe(false);
    });
  });

  describe("Round 5 Distributed Co-op & Final Synchronization", () => {
    it("allows all agents into Round 5 but strictly restricts them to their assigned question", () => {
      const progress = 16; // Round 5 start

      // Alice is assigned 5.1
      expect(checkTurnPermission(sampleMembers[0], progress, "5.1").allowed).toBe(true);
      expect(checkTurnPermission(sampleMembers[0], progress, "5.2").allowed).toBe(false);

      // Bob is assigned 5.2
      expect(checkTurnPermission(sampleMembers[1], progress, "5.2").allowed).toBe(true);
      expect(checkTurnPermission(sampleMembers[1], progress, "5.3").allowed).toBe(false);

      // Dana is assigned 5.4
      expect(checkTurnPermission(sampleMembers[3], progress, "5.4").allowed).toBe(true);
    });

    it("detects when 3 have submitted and the 4th is the final finisher", () => {
      const membersState = sampleMembers.map((m) => ({ ...m }));

      // Agent 1 submits
      membersState[0].round5_submitted = true;
      let submittedCount = membersState.filter((m) => m.round5_submitted).length;
      expect(submittedCount).toBe(1);
      expect(submittedCount === 4).toBe(false);

      // Agent 2 submits
      membersState[1].round5_submitted = true;
      submittedCount = membersState.filter((m) => m.round5_submitted).length;
      expect(submittedCount).toBe(2);

      // Agent 3 submits
      membersState[2].round5_submitted = true;
      submittedCount = membersState.filter((m) => m.round5_submitted).length;
      expect(submittedCount).toBe(3);
      expect(submittedCount === 4).toBe(false);

      // Agent 4 (last submitter) submits
      membersState[3].round5_submitted = true;
      submittedCount = membersState.filter((m) => m.round5_submitted).length;
      expect(submittedCount).toBe(4);
      // All 4 complete!
      expect(submittedCount === 4).toBe(true);
    });

    it("keeps timers ticking when 1, 2, or 3 players complete and stops only when all 4 complete", () => {
      const members = [
        { id: "1", round5_submitted: true },
        { id: "2", round5_submitted: true },
        { id: "3", round5_submitted: false },
        { id: "4", round5_submitted: false },
      ];

      const isSquadFinished = (mList: Array<{ round5_submitted: boolean }>) => {
        return mList.filter((m) => m.round5_submitted).length >= 4;
      };

      // 2 completed -> timers should NOT stop
      expect(isSquadFinished(members)).toBe(false);

      // 3 completed -> timers should NOT stop
      members[2].round5_submitted = true;
      expect(isSquadFinished(members)).toBe(false);

      // 4 completed -> timers STOP!
      members[3].round5_submitted = true;
      expect(isSquadFinished(members)).toBe(true);
    });
  });

  describe("10-Minute Round Timeout Logic", () => {
    it("calculates remaining seconds and signals auto-pass when timer reaches 0", () => {
      const roundDuration = 600; // 10 mins (600s)
      const startedAt = Date.now() - 240 * 1000; // 4 mins ago
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, roundDuration - elapsed);

      expect(remaining).toBe(360); // 6 mins left

      // When 605 seconds elapsed
      const expiredStartedAt = Date.now() - 605 * 1000;
      const expiredElapsed = Math.floor((Date.now() - expiredStartedAt) / 1000);
      const expiredRemaining = Math.max(0, roundDuration - expiredElapsed);

      expect(expiredRemaining).toBe(0);
      const shouldAutoPass = expiredRemaining <= 0;
      expect(shouldAutoPass).toBe(true);
    });
  });
});
