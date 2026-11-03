import { describe, it, expect } from "vitest";
import { getCurrentQuestion } from "@/lib/game/engine.server";
import { getRoundDefinition } from "@/rounds/registry";

describe("Round 4 Timestamp Reconstruction Verification (Q4.1)", () => {
  it("registers round4 definition in ROUND_REGISTRY", () => {
    const round4 = getRoundDefinition(4);
    expect(round4).toBeDefined();
    expect(round4?.id).toBe(4);
    expect(round4?.themeKey).toBe("round4");
    expect(round4?.toolRegistry?.timestamp_reconstruction).toBeDefined();
  });

  it("delivers timestamp_reconstruction tool for Question 4.1 when tools are enabled", () => {
    // Question 4.1 is at progress index 12 (after rooms 1, 2, 3)
    const q41 = getCurrentQuestion(12, true);
    expect(q41?.id).toBe("4.1");
    expect(q41?.tool).toBeDefined();
    expect(q41?.tool?.type).toBe("timestamp_reconstruction");
    expect(q41?.tool?.data?.items).toHaveLength(5);
  });

  it("sorts timestamps chronologically from earliest to latest to form TRUTH", () => {
    const rawItems = [
      { timestamp: "23:17:42", letter: "U" },
      { timestamp: "23:12:08", letter: "T" },
      { timestamp: "23:19:55", letter: "H" },
      { timestamp: "23:14:31", letter: "R" },
      { timestamp: "23:18:16", letter: "T" },
    ];

    const sorted = [...rawItems].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const word = sorted.map((item) => item.letter).join("");

    expect(sorted[0].timestamp).toBe("23:12:08");
    expect(sorted[0].letter).toBe("T");
    expect(sorted[1].timestamp).toBe("23:14:31");
    expect(sorted[1].letter).toBe("R");
    expect(sorted[2].timestamp).toBe("23:17:42");
    expect(sorted[2].letter).toBe("U");
    expect(sorted[3].timestamp).toBe("23:18:16");
    expect(sorted[3].letter).toBe("T");
    expect(sorted[4].timestamp).toBe("23:19:55");
    expect(sorted[4].letter).toBe("H");

    expect(word).toBe("TRUTH");
  });

  it("does not leak the plaintext answer in question prompt or tool data", () => {
    const q41 = getCurrentQuestion(12, true);
    expect(q41?.prompt).not.toContain("TRUTH");
    expect(JSON.stringify(q41?.tool?.data)).not.toContain("TRUTH");
  });

  it("detects non-chronological sequences and prevents improper submission", () => {
    const initialItems = [
      { timestamp: "23:17:42", letter: "U" },
      { timestamp: "23:12:08", letter: "T" },
      { timestamp: "23:19:55", letter: "H" },
      { timestamp: "23:14:31", letter: "R" },
      { timestamp: "23:18:16", letter: "T" },
    ];

    const outOfOrderIndex = initialItems.findIndex((card, i) => {
      if (i === 0) return false;
      return card.timestamp < initialItems[i - 1].timestamp;
    });

    expect(outOfOrderIndex).toBe(1);
    expect(initialItems.map((c) => c.letter).join("")).toBe("UTHRT");

    // Chronologically sorted items
    const sortedItems = [...initialItems].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const sortedOrder = sortedItems.map((c) => c.letter).join("");
    expect(sortedOrder).toBe("TRUTH");
    expect(
      sortedItems.findIndex((card, i) => i > 0 && card.timestamp < sortedItems[i - 1].timestamp)
    ).toBe(-1);
  });
});

describe("Round 4 Access Record Analysis Verification (Q4.2)", () => {
  it("registers access_records tool in round4 definition", () => {
    const round4 = getRoundDefinition(4);
    expect(round4?.toolRegistry?.access_records).toBeDefined();
  });

  it("delivers access_records tool for Question 4.2 when tools are enabled", () => {
    // Question 4.2 is at progress index 13
    const q42 = getCurrentQuestion(13, true);
    expect(q42?.id).toBe("4.2");
    expect(q42?.tool).toBeDefined();
    expect(q42?.tool?.type).toBe("access_records");
    expect(q42?.tool?.data?.records).toHaveLength(5);
  });

  it("correctly identifies successful events occurring after 23:00 as C and D", () => {
    const records = [
      { id: "A", timestamp: "22:58:31", status: "SUCCESS" },
      { id: "B", timestamp: "23:02:14", status: "FAILED" },
      { id: "C", timestamp: "23:05:42", status: "SUCCESS" },
      { id: "D", timestamp: "23:08:19", status: "SUCCESS" },
      { id: "E", timestamp: "23:10:01", status: "FAILED" },
    ];

    const qualifying = records.filter(
      (r) => r.status === "SUCCESS" && r.timestamp > "23:00:00"
    );

    expect(qualifying).toHaveLength(2);
    expect(qualifying.map((r) => r.id)).toEqual(["C", "D"]);
  });
});

describe("Round 4 Caesar Cipher Keyword Recovery Verification (Q4.3)", () => {
  it("registers keyword_recovery tool in round4 definition", () => {
    const round4 = getRoundDefinition(4);
    expect(round4?.toolRegistry?.keyword_recovery).toBeDefined();
  });

  it("delivers keyword_recovery tool for Question 4.3 when tools are enabled", () => {
    // Question 4.3 is at progress index 14
    const q43 = getCurrentQuestion(14, true);
    expect(q43?.id).toBe("4.3");
    expect(q43?.tool).toBeDefined();
    expect(q43?.tool?.type).toBe("keyword_recovery");
    expect(q43?.tool?.data?.ciphertext).toBe("FQNAJ");
  });

  it("decodes FQNAJ backwards by 5 positions (length of TRUTH) to ALIVE", () => {
    const ciphertext = "FQNAJ";
    const shift = 5;
    const decoded = ciphertext
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        const shifted = (code - 65 - shift + 26) % 26;
        return String.fromCharCode(65 + shifted);
      })
      .join("");

    expect(decoded).toBe("ALIVE");
  });

  it("does not leak the plaintext answer in question prompt or tool data", () => {
    const q43 = getCurrentQuestion(14, true);
    expect(q43?.prompt).not.toContain("ALIVE");
    expect(JSON.stringify(q43?.tool?.data)).not.toContain("ALIVE");
  });
});


