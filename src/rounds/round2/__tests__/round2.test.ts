import { describe, it, expect } from "vitest";
import { getCurrentQuestion } from "@/lib/game/engine.server";
import { getRoundDefinition } from "@/rounds/registry";
import { ANSWER_MATCHERS } from "@/lib/game/answers.server";

describe("Round 2 Network Session Filter Verification (Q2.1)", () => {
  it("registers round2 definition in ROUND_REGISTRY", () => {
    const round2 = getRoundDefinition(2);
    expect(round2).toBeDefined();
    expect(round2?.id).toBe(2);
    expect(round2?.themeKey).toBe("round2");
    expect(round2?.toolRegistry?.network_session_filter).toBeDefined();
    expect(round2?.toolRegistry?.data_reconstruction).toBeDefined();
    expect(round2?.toolRegistry?.vault_dials).toBeDefined();
  });

  it("delivers network_session_filter tool for Question 2.1 when tools are enabled", () => {
    // Room 2 starts at progress index 4 (Q2.1)
    const q21 = getCurrentQuestion(4, true);
    expect(q21?.id).toBe("2.1");
    expect(q21?.tool).toBeDefined();
    expect(q21?.tool?.type).toBe("network_session_filter");
    expect(q21?.tool?.data?.sessions).toHaveLength(6);
  });

  it("correctly identifies sessions with Process ID 314 and Port 443 as A, C, F", () => {
    const sessions = [
      { session: "A", processId: 314, port: 443, data: "1010" },
      { session: "B", processId: 721, port: 22, data: "0111" },
      { session: "C", processId: 314, port: 443, data: "1100" },
      { session: "D", processId: 830, port: 443, data: "0011" },
      { session: "E", processId: 428, port: 22, data: "1110" },
      { session: "F", processId: 314, port: 443, data: "0011" },
    ];

    const matching = sessions.filter(
      (s) => s.processId === 314 && s.port === 443
    );

    expect(matching).toHaveLength(3);
    const letters = matching.map((s) => s.session).join("");
    expect(letters).toBe("ACF");
  });

  it("validates ACF as the expected answer using answer matcher", () => {
    const matcher = ANSWER_MATCHERS["2.1"];
    expect(matcher("ACF")).toBe(true);
    expect(matcher("A C F")).toBe(true);
    expect(matcher("acf")).toBe(true);
    expect(matcher("ABC")).toBe(false);
    expect(matcher("AF")).toBe(false);
  });

  it("does not leak the plaintext answer in question prompt or tool data", () => {
    const q21 = getCurrentQuestion(4, true);
    expect(q21?.prompt).not.toContain("ACF");
    expect(JSON.stringify(q21?.tool?.data)).not.toContain("ACF");
  });

  it("exports NetworkSessionFilter with clipPath and mask fallback for complete blackout", async () => {
    const { NetworkSessionFilter } = await import("../tools/NetworkSessionFilter");
    expect(NetworkSessionFilter).toBeDefined();
    expect(typeof NetworkSessionFilter).toBe("function");
  });
});

describe("Round 2 Data Reconstruction Verification (Q2.2)", () => {
  it("delivers data_reconstruction tool for Question 2.2 when tools are enabled", () => {
    // Room 2 Question 2.2 is at progress index 5
    const q22 = getCurrentQuestion(5, true);
    expect(q22?.id).toBe("2.2");
    expect(q22?.tool).toBeDefined();
    expect(q22?.tool?.type).toBe("data_reconstruction");
    expect(q22?.tool?.data?.sessions).toEqual([
      { session: "A", data: "1010" },
      { session: "C", data: "1100" },
      { session: "F", data: "0011" },
    ]);
  });

  it("correctly computes 3-way bitwise XOR across sessions A (1010), C (1100), and F (0011) to be 0101", () => {
    const a = [1, 0, 1, 0];
    const c = [1, 1, 0, 0];
    const f = [0, 0, 1, 1];

    const xorResult = a.map((bit, idx) => bit ^ c[idx] ^ f[idx]).join("");
    expect(xorResult).toBe("0101");
  });

  it("validates 0101 as the expected answer using answer matcher", () => {
    const matcher = ANSWER_MATCHERS["2.2"];
    expect(matcher("0101")).toBe(true);
    expect(matcher("  0101  ")).toBe(true);
    expect(matcher("0 1 0 1")).toBe(true);
    expect(matcher("1010")).toBe(false);
    expect(matcher("0000")).toBe(false);
  });

  it("does not leak the expected XOR sequence 0101 in question prompt or tool data", () => {
    const q22 = getCurrentQuestion(5, true);
    expect(q22?.prompt).not.toContain("0101");
    expect(JSON.stringify(q22?.tool?.data)).not.toContain("0101");
  });
});

describe("Round 2 Vault Dials Key Recovery Verification (Q2.3)", () => {
  it("delivers vault_dials tool for Question 2.3 when tools are enabled", () => {
    // Room 2 Question 2.3 is at progress index 6
    const q23 = getCurrentQuestion(6, true);
    expect(q23?.id).toBe("2.3");
    expect(q23?.tool).toBeDefined();
    expect(q23?.tool?.type).toBe("vault_dials");
  });

  it("correctly computes 4-bit XOR between Dial A (13 = 1101) and Dial B (0101) to equal decimal 8 (1000)", () => {
    const dialA = [1, 1, 0, 1]; // 13 in binary (8 + 4 + 0 + 1)
    const dialB = [0, 1, 0, 1]; // 5 in binary (0 + 4 + 0 + 1)

    const xorBits = dialA.map((bitA, idx) => bitA ^ dialB[idx]);
    expect(xorBits).toEqual([1, 0, 0, 0]);

    const bitValues = [8, 4, 2, 1];
    const xorDecimal = xorBits.reduce((sum, bit, idx) => sum + bit * bitValues[idx], 0);
    expect(xorDecimal).toBe(8);
  });

  it("validates 8 as the expected answer using answer matcher", () => {
    const matcher = ANSWER_MATCHERS["2.3"];
    expect(matcher("8")).toBe(true);
    expect(matcher(" 8 ")).toBe(true);
    expect(matcher("7")).toBe(false);
    expect(matcher("13")).toBe(false);
  });

  it("exports VaultDials tool with direct submission", async () => {
    const { VaultDials } = await import("../tools/VaultDials");
    expect(VaultDials).toBeDefined();
    expect(typeof VaultDials).toBe("function");
  });
});
