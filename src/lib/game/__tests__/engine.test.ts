import { describe, it, expect } from "vitest";
import {
  ORDER,
  getCurrentQuestion,
  getUnlockedStory,
  checkAnswer,
} from "../engine.server";
import { MASTER_ANSWER_KEY, matchAnswer } from "../answers.server";
import { GAME_CONTENT } from "../content.server";

describe("Subject Zero Game Engine & Answers", () => {
  describe("Task 5.3: Question Sequence & Order Integrity", () => {
    it("ORDER has exactly 20 unique question identifiers", () => {
      expect(ORDER).toHaveLength(20);
      const unique = new Set(ORDER);
      expect(unique.size).toBe(20);
    });

    it("every id in ORDER exists in GAME_CONTENT with prompt and title", () => {
      const allQuestions = GAME_CONTENT.rooms.flatMap((r) => r.questions);
      expect(allQuestions).toHaveLength(20);

      for (const id of ORDER) {
        const found = allQuestions.find((q) => q.id === id);
        expect(found).toBeDefined();
        expect(found?.title.length).toBeGreaterThan(0);
        expect(found?.prompt.length).toBeGreaterThan(0);
        expect(found?.wrongFeedback.length).toBeGreaterThan(0);
      }
    });

    it("every id in ORDER has an entry in MASTER_ANSWER_KEY and an answer matcher", () => {
      for (const id of ORDER) {
        expect(MASTER_ANSWER_KEY[id]).toBeDefined();
        expect(typeof MASTER_ANSWER_KEY[id]).toBe("string");
        expect(typeof matchAnswer(id, MASTER_ANSWER_KEY[id])).toBe("boolean");
      }
    });
  });

  describe("Task 5.2: Independent Puzzle Recomputations in Code", () => {
    it("1.1: binary sequence 01010011 01011010 decodes to SZ", () => {
      const binParts = "01010011 01011010".split(" ");
      const decoded = binParts.map((b) => String.fromCharCode(parseInt(b, 2))).join("");
      expect(decoded).toBe("SZ");
      expect(decoded).toBe(MASTER_ANSWER_KEY["1.1"]);
    });

    it("1.3: rule (first * last) + middle on Process 314 gives 13", () => {
      const pId = "314";
      const first = parseInt(pId[0], 10);
      const middle = parseInt(pId[1], 10);
      const last = parseInt(pId[2], 10);
      const sig = first * last + middle;
      expect(sig).toBe(13);
      expect(sig.toString()).toBe(MASTER_ANSWER_KEY["1.3"]);
    });

    it("2.2: XOR chain on 1010, 1100, 0011 produces 0101", () => {
      const a = parseInt("1010", 2);
      const c = parseInt("1100", 2);
      const f = parseInt("0011", 2);
      const xorResult = a ^ c ^ f;
      const bin4 = xorResult.toString(2).padStart(4, "0");
      expect(bin4).toBe("0101");
      expect(bin4).toBe(MASTER_ANSWER_KEY["2.2"]);
    });

    it("2.3: XOR fragment 0101 with signature 13 (1101) produces decimal 8", () => {
      const frag = parseInt("0101", 2);
      const sig = 13; // binary 1101
      const decimalResult = frag ^ sig;
      expect(decimalResult).toBe(8);
      expect(decimalResult.toString()).toBe(MASTER_ANSWER_KEY["2.3"]);
    });

    it("3.1: Caesar shift backwards by 8 on KWZZCXB decodes to CORRUPT", () => {
      const ciphertext = "KWZZCXB";
      const shift = 8;
      const decoded = ciphertext
        .split("")
        .map((ch) => {
          const code = ch.charCodeAt(0) - 65;
          const unshifted = (code - shift + 26) % 26;
          return String.fromCharCode(unshifted + 65);
        })
        .join("");
      expect(decoded).toBe("CORRUPT");
      expect(decoded).toBe(MASTER_ANSWER_KEY["3.1"]);
    });

    it("3.2: alternating-sum script on [4,7,2,9,5,8,3] produces -10", () => {
      const data = [4, 7, 2, 9, 5, 8, 3];
      let result = 0;
      for (let i = 0; i < data.length; i++) {
        if (i % 2 === 0) {
          result += data[i];
        } else {
          result -= data[i];
        }
      }
      expect(result).toBe(-10);
      expect(result.toString()).toBe(MASTER_ANSWER_KEY["3.2"]);
    });

    it("3.3: Caesar shift backwards by 7 on YLZAVYL decodes to RESTORE", () => {
      const ciphertext = "YLZAVYL";
      const shift = 7;
      const decoded = ciphertext
        .split("")
        .map((ch) => {
          const code = ch.charCodeAt(0) - 65;
          const unshifted = (code - shift + 26) % 26;
          return String.fromCharCode(unshifted + 65);
        })
        .join("");
      expect(decoded).toBe("RESTORE");
      expect(decoded).toBe(MASTER_ANSWER_KEY["3.3"]);
    });

    it("4.1: Chronological sort of timestamp fragments produces TRUTH", () => {
      const records = [
        { time: "23:17:42", letter: "U" },
        { time: "23:12:08", letter: "T" },
        { time: "23:19:55", letter: "H" },
        { time: "23:14:31", letter: "R" },
        { time: "23:18:16", letter: "T" },
      ];
      records.sort((a, b) => a.time.localeCompare(b.time));
      const word = records.map((r) => r.letter).join("");
      expect(word).toBe("TRUTH");
      expect(word).toBe(MASTER_ANSWER_KEY["4.1"]);
    });

    it("4.2: Count of successful events after 23:00 equals 2", () => {
      const accessLog = [
        { record: "A", time: "22:58:31", status: "SUCCESS" },
        { record: "B", time: "23:02:14", status: "FAILED" },
        { record: "C", time: "23:05:42", status: "SUCCESS" },
        { record: "D", time: "23:08:19", status: "SUCCESS" },
        { record: "E", time: "23:10:01", status: "FAILED" },
      ];
      const count = accessLog.filter(
        (e) => e.time > "23:00:00" && e.status === "SUCCESS"
      ).length;
      expect(count).toBe(2);
      expect(count.toString()).toBe(MASTER_ANSWER_KEY["4.2"]);
    });

    it("4.3: Caesar shift backwards by 5 (length of TRUTH) on FQNAJ decodes to ALIVE", () => {
      const ciphertext = "FQNAJ";
      const shift = "TRUTH".length;
      const decoded = ciphertext
        .split("")
        .map((ch) => {
          const code = ch.charCodeAt(0) - 65;
          const unshifted = (code - shift + 26) % 26;
          return String.fromCharCode(unshifted + 65);
        })
        .join("");
      expect(decoded).toBe("ALIVE");
      expect(decoded).toBe(MASTER_ANSWER_KEY["4.3"]);
    });

    it("5.1: Hexadecimal 54 48 45 59 20 4C 49 45 44 decodes to THEY LIED", () => {
      const hexBytes = "54 48 45 59 20 4C 49 45 44".split(" ");
      const decoded = hexBytes
        .map((b) => String.fromCharCode(parseInt(b, 16)))
        .join("");
      expect(decoded).toBe("THEY LIED");
      expect(decoded).toBe(MASTER_ANSWER_KEY["5.1"]);
    });
  });

  describe("Task 5.1: Per-Question Answer Matchers Validation", () => {
    // 1.1
    it("1.1 matches SZ and rejects incorrect answers", () => {
      expect(checkAnswer("1.1", "SZ").correct).toBe(true);
      expect(checkAnswer("1.1", " sz ").correct).toBe(true);
      expect(checkAnswer("1.1", "S").correct).toBe(false);
      expect(checkAnswer("1.1", "SZZ").correct).toBe(false);
      expect(checkAnswer("1.1", "SUBJECT ZERO").correct).toBe(false);
    });

    // 1.2
    it("1.2 matches 314 and rejects incorrect answers", () => {
      expect(checkAnswer("1.2", "314").correct).toBe(true);
      expect(checkAnswer("1.2", "  314  ").correct).toBe(true);
      expect(checkAnswer("1.2", "428").correct).toBe(false);
      expect(checkAnswer("1.2", "721").correct).toBe(false);
      expect(checkAnswer("1.2", "31").correct).toBe(false);
    });

    // 1.3
    it("1.3 matches 13 and rejects incorrect answers", () => {
      expect(checkAnswer("1.3", "13").correct).toBe(true);
      expect(checkAnswer("1.3", " 13 ").correct).toBe(true);
      expect(checkAnswer("1.3", "12").correct).toBe(false);
      expect(checkAnswer("1.3", "14").correct).toBe(false);
      expect(checkAnswer("1.3", "314").correct).toBe(false);
    });

    // 1.4
    it("1.4 matches SZ-314-13 with flexible spacing and rejects bad answers", () => {
      expect(checkAnswer("1.4", "SZ-314-13").correct).toBe(true);
      expect(checkAnswer("1.4", "SZ - 314 - 13").correct).toBe(true);
      expect(checkAnswer("1.4", "sz-314-13").correct).toBe(true);
      expect(checkAnswer("1.4", "SZ-314").correct).toBe(false);
      expect(checkAnswer("1.4", "SZ 314 13").correct).toBe(false);
      expect(checkAnswer("1.4", "SZ-314-14").correct).toBe(false);
    });

    // 2.1
    it("2.1 matches ACF with flexible delimiters and rejects partial/superset", () => {
      expect(checkAnswer("2.1", "ACF").correct).toBe(true);
      expect(checkAnswer("2.1", "A C F").correct).toBe(true);
      expect(checkAnswer("2.1", "A, C, F").correct).toBe(true);
      expect(checkAnswer("2.1", "a,c,f").correct).toBe(true);
      expect(checkAnswer("2.1", "AC").correct).toBe(false);
      expect(checkAnswer("2.1", "ACFD").correct).toBe(false);
      expect(checkAnswer("2.1", "CFA").correct).toBe(false);
      expect(checkAnswer("2.1", "B").correct).toBe(false);
    });

    // 2.2
    it("2.2 matches 0101 and rejects incorrect answers", () => {
      expect(checkAnswer("2.2", "0101").correct).toBe(true);
      expect(checkAnswer("2.2", " 0101 ").correct).toBe(true);
      expect(checkAnswer("2.2", "01 01").correct).toBe(true);
      expect(checkAnswer("2.2", "1010").correct).toBe(false);
      expect(checkAnswer("2.2", "010").correct).toBe(false);
      expect(checkAnswer("2.2", "01011").correct).toBe(false);
    });

    // 2.3
    it("2.3 matches 8 and rejects incorrect answers", () => {
      expect(checkAnswer("2.3", "8").correct).toBe(true);
      expect(checkAnswer("2.3", " 8 ").correct).toBe(true);
      expect(checkAnswer("2.3", "1000").correct).toBe(false);
      expect(checkAnswer("2.3", "7").correct).toBe(false);
      expect(checkAnswer("2.3", "9").correct).toBe(false);
    });

    // 2.4
    it("2.4 matches 8 and rejects incorrect answers", () => {
      expect(checkAnswer("2.4", "8").correct).toBe(true);
      expect(checkAnswer("2.4", " 8 ").correct).toBe(true);
      expect(checkAnswer("2.4", "0").correct).toBe(false);
      expect(checkAnswer("2.4", "13").correct).toBe(false);
      expect(checkAnswer("2.4", "88").correct).toBe(false);
    });

    // 3.1
    it("3.1 matches CORRUPT and rejects incorrect answers", () => {
      expect(checkAnswer("3.1", "CORRUPT").correct).toBe(true);
      expect(checkAnswer("3.1", " corrupt ").correct).toBe(true);
      expect(checkAnswer("3.1", "KWZZCXB").correct).toBe(false);
      expect(checkAnswer("3.1", "CORRUPTED").correct).toBe(false);
      expect(checkAnswer("3.1", "ERROR").correct).toBe(false);
    });

    // 3.2
    it("3.2 matches -10 and variants and rejects incorrect answers", () => {
      expect(checkAnswer("3.2", "-10").correct).toBe(true);
      expect(checkAnswer("3.2", "- 10").correct).toBe(true);
      expect(checkAnswer("3.2", "−10").correct).toBe(true); // Unicode minus U+2212
      expect(checkAnswer("3.2", "− 10").correct).toBe(true);
      expect(checkAnswer("3.2", "10").correct).toBe(false);
      expect(checkAnswer("3.2", "-11").correct).toBe(false);
      expect(checkAnswer("3.2", "-9").correct).toBe(false);
    });

    // 3.3
    it("3.3 matches RESTORE and rejects incorrect answers", () => {
      expect(checkAnswer("3.3", "RESTORE").correct).toBe(true);
      expect(checkAnswer("3.3", " restore ").correct).toBe(true);
      expect(checkAnswer("3.3", "RESTORATION").correct).toBe(false);
      expect(checkAnswer("3.3", "YLZAVYL").correct).toBe(false);
      expect(checkAnswer("3.3", "RESTART").correct).toBe(false);
    });

    // 3.4
    it("3.4 matches -10-RESTORE with leading minus and rejects incorrect answers", () => {
      expect(checkAnswer("3.4", "-10-RESTORE").correct).toBe(true);
      expect(checkAnswer("3.4", "-10 - RESTORE").correct).toBe(true);
      expect(checkAnswer("3.4", "- 10 - RESTORE").correct).toBe(true);
      expect(checkAnswer("3.4", "−10-restore").correct).toBe(true);
      expect(checkAnswer("3.4", "10-RESTORE").correct).toBe(false);
      expect(checkAnswer("3.4", "-10 RESTORE").correct).toBe(false);
      expect(checkAnswer("3.4", "-10-RESTORE-FINAL").correct).toBe(false);
    });

    // 4.1
    it("4.1 matches TRUTH and rejects incorrect answers", () => {
      expect(checkAnswer("4.1", "TRUTH").correct).toBe(true);
      expect(checkAnswer("4.1", " truth ").correct).toBe(true);
      expect(checkAnswer("4.1", "TURTH").correct).toBe(false);
      expect(checkAnswer("4.1", "TRUE").correct).toBe(false);
      expect(checkAnswer("4.1", "TRUST").correct).toBe(false);
    });

    // 4.2
    it("4.2 matches 2 and rejects incorrect answers", () => {
      expect(checkAnswer("4.2", "2").correct).toBe(true);
      expect(checkAnswer("4.2", " 2 ").correct).toBe(true);
      expect(checkAnswer("4.2", "3").correct).toBe(false);
      expect(checkAnswer("4.2", "1").correct).toBe(false);
      expect(checkAnswer("4.2", "0").correct).toBe(false);
    });

    // 4.3
    it("4.3 matches ALIVE and rejects incorrect answers", () => {
      expect(checkAnswer("4.3", "ALIVE").correct).toBe(true);
      expect(checkAnswer("4.3", " alive ").correct).toBe(true);
      expect(checkAnswer("4.3", "FQNAJ").correct).toBe(false);
      expect(checkAnswer("4.3", "DEAD").correct).toBe(false);
      expect(checkAnswer("4.3", "LIVE").correct).toBe(false);
    });

    // 4.4
    it("4.4 matches TRUTH-2-ALIVE and rejects incorrect answers", () => {
      expect(checkAnswer("4.4", "TRUTH-2-ALIVE").correct).toBe(true);
      expect(checkAnswer("4.4", "TRUTH - 2 - ALIVE").correct).toBe(true);
      expect(checkAnswer("4.4", "truth-2-alive").correct).toBe(true);
      expect(checkAnswer("4.4", "TRUTH-2").correct).toBe(false);
      expect(checkAnswer("4.4", "TRUTH-ALIVE").correct).toBe(false);
      expect(checkAnswer("4.4", "TRUTH-3-ALIVE").correct).toBe(false);
    });

    // 5.1
    it("5.1 matches THEY LIED and rejects incorrect answers", () => {
      expect(checkAnswer("5.1", "THEY LIED").correct).toBe(true);
      expect(checkAnswer("5.1", " they lied ").correct).toBe(true);
      expect(checkAnswer("5.1", "HACKED").correct).toBe(false);
      expect(checkAnswer("5.1", "THEY LIE").correct).toBe(false);
      expect(checkAnswer("5.1", "THEYLIED").correct).toBe(false);
    });

    // 5.2
    it("5.2 matches B (single letter) and rejects incorrect answers", () => {
      expect(checkAnswer("5.2", "B").correct).toBe(true);
      expect(checkAnswer("5.2", " b ").correct).toBe(true);
      expect(checkAnswer("5.2", "A").correct).toBe(false);
      expect(checkAnswer("5.2", "C").correct).toBe(false);
      expect(checkAnswer("5.2", "D").correct).toBe(false);
      expect(checkAnswer("5.2", "BB").correct).toBe(false);
    });

    // 5.3
    it("5.3 matches event sequence with conclusion B and rejects wrong ordering/answers", () => {
      expect(
        checkAnswer("5.3", "SHUTDOWN -> AUTHENTICATION -> DATA TRANSFER; B").correct
      ).toBe(true);
      expect(
        checkAnswer("5.3", "SHUTDOWN → AUTHENTICATION → DATA TRANSFER; B").correct
      ).toBe(true);
      expect(
        checkAnswer("5.3", "SHUTDOWN => AUTHENTICATION => DATA TRANSFER, B").correct
      ).toBe(true);
      expect(
        checkAnswer("5.3", "SHUTDOWN -> AUTHENTICATION -> DATA TRANSFER , b").correct
      ).toBe(true);

      // Wrong sequence
      expect(
        checkAnswer("5.3", "AUTHENTICATION -> SHUTDOWN -> DATA TRANSFER; B").correct
      ).toBe(false);
      // Wrong conclusion letter
      expect(
        checkAnswer("5.3", "SHUTDOWN -> AUTHENTICATION -> DATA TRANSFER; A").correct
      ).toBe(false);
      // Missing conclusion
      expect(
        checkAnswer("5.3", "SHUTDOWN -> AUTHENTICATION -> DATA TRANSFER").correct
      ).toBe(false);
    });

    // 5.4
    it("5.4 matches THEY LIED; C with multiple delimiter styles and rejects incorrect answers", () => {
      expect(checkAnswer("5.4", "THEY LIED; C").correct).toBe(true);
      expect(checkAnswer("5.4", "THEY LIED, C").correct).toBe(true);
      expect(checkAnswer("5.4", "THEY LIED - C").correct).toBe(true);
      expect(checkAnswer("5.4", "they lied ; c").correct).toBe(true);

      // Wrong conclusion
      expect(checkAnswer("5.4", "THEY LIED; A").correct).toBe(false);
      expect(checkAnswer("5.4", "THEY LIED; B").correct).toBe(false);
      // Missing keyword
      expect(checkAnswer("5.4", "C").correct).toBe(false);
      // Wrong keyword
      expect(checkAnswer("5.4", "HACKED; C").correct).toBe(false);
    });
  });

  describe("Task 5.4: Answer Leak Prevention", () => {
    it("getCurrentQuestion and getUnlockedStory never include answer/feedback properties", () => {
      const forbiddenKeys = [
        "answer",
        "expectedAnswer",
        "correctAnswer",
        "solution",
        "wrongFeedback",
      ];

      for (let progress = 0; progress < 20; progress++) {
        const currentQ = getCurrentQuestion(progress);
        expect(currentQ).toBeDefined();

        for (const forbidden of forbiddenKeys) {
          expect(currentQ).not.toHaveProperty(forbidden);
        }
      }

      for (let progress = 0; progress <= 20; progress++) {
        const story = getUnlockedStory(progress);
        expect(story).toBeDefined();

        for (const forbidden of forbiddenKeys) {
          expect(story).not.toHaveProperty(forbidden);
        }

        for (const room of story.rooms) {
          for (const forbidden of forbiddenKeys) {
            expect(room).not.toHaveProperty(forbidden);
          }
        }
      }
    });

    it("future rooms and solutions are never leaked in getUnlockedStory", () => {
      // Secret keys from future rooms
      const compoundAnswers = [
        "SZ-314-13",
        "CORRUPT",
        "-10-RESTORE",
        "TRUTH-2-ALIVE",
        "THEY LIED",
      ];

      // At progress 0 (Room 1 start), none of the compound answers or later room secrets should exist in story
      const story0 = JSON.stringify(getUnlockedStory(0));
      for (const secret of compoundAnswers) {
        expect(story0).not.toContain(secret);
      }

      // At progress 4 (Room 2 start), Room 3+ secrets should not exist in story
      const story4 = JSON.stringify(getUnlockedStory(4));
      expect(story4).not.toContain("CORRUPT");
      expect(story4).not.toContain("-10-RESTORE");
      expect(story4).not.toContain("TRUTH-2-ALIVE");
      expect(story4).not.toContain("THEY LIED");

      // At progress 8 (Room 3 start), Room 4+ secrets should not exist in story
      const story8 = JSON.stringify(getUnlockedStory(8));
      expect(story8).not.toContain("TRUTH-2-ALIVE");
      expect(story8).not.toContain("THEY LIED");

      // At progress 12 (Room 4 start), Room 5 secrets should not exist in story
      const story12 = JSON.stringify(getUnlockedStory(12));
      expect(story12).not.toContain("THEY LIED");
    });

    it("getUnlockedStory at progress 0 only contains prologue and Room 1 entrance", () => {
      const story = getUnlockedStory(0);
      expect(story.prologue).toBeDefined();
      expect(story.rooms).toHaveLength(1);
      expect(story.rooms[0].id).toBe(1);
      expect(story.rooms[0].isCompleted).toBe(false);
      expect(story.rooms[0].discoveryFile).toBeUndefined();
      expect(story.reveals).toHaveLength(0);
      expect(story.finalCinematic).toBeUndefined();
    });

    it("getUnlockedStory at progress 20 contains all 5 rooms completed and final cinematic", () => {
      const story = getUnlockedStory(20);
      expect(story.rooms).toHaveLength(5);
      expect(story.rooms.every((r) => r.isCompleted)).toBe(true);
      expect(story.finalCinematic).toBeDefined();
      expect(story.finalCinematic?.narratorText).toContain("INVESTIGATION COMPLETE");
    });
  });
});
