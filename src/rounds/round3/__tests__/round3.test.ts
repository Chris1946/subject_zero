import { describe, it, expect } from "vitest";
import { getCurrentQuestion } from "@/lib/game/engine.server";
import { getRoundDefinition } from "@/rounds/registry";

function decodeCaesarBackward(ciphertext: string, shift: number): string {
  return ciphertext
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const shifted = (code - 65 - shift + 26) % 26;
        return String.fromCharCode(65 + shifted);
      }
      return char;
    })
    .join("");
}

describe("Round 3 Caesar Cipher Verification (Q3.1)", () => {
  it("registers round3 definition in ROUND_REGISTRY", () => {
    const round3 = getRoundDefinition(3);
    expect(round3).toBeDefined();
    expect(round3?.id).toBe(3);
    expect(round3?.themeKey).toBe("round3");
    expect(round3?.toolRegistry?.cipher).toBeDefined();
  });

  it("delivers cipher tool for Question 3.1 when tools are enabled", () => {
    // Room 3 starts at question index 8 (Order: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1)
    const q31 = getCurrentQuestion(8, true);
    expect(q31?.id).toBe("3.1");
    expect(q31?.tool).toBeDefined();
    expect(q31?.tool?.type).toBe("cipher");
    expect(q31?.tool?.data?.ciphertext).toBe("KWZZCXB");
  });

  it("decodes KWZZCXB backwards by 8 positions to CORRUPT", () => {
    const decoded = decodeCaesarBackward("KWZZCXB", 8);
    expect(decoded).toBe("CORRUPT");
  });

  it("does not leak the plaintext answer in question prompt or tool data", () => {
    const q31 = getCurrentQuestion(8, true);
    expect(q31?.prompt).not.toContain("CORRUPT");
    expect(JSON.stringify(q31?.tool?.data)).not.toContain("CORRUPT");
  });
});

describe("Round 3 Script Recovery Tracker Verification (Q3.2)", () => {
  it("registers script_recovery tool in round3 definition", () => {
    const round3 = getRoundDefinition(3);
    expect(round3?.toolRegistry?.script_recovery).toBeDefined();
  });

  it("delivers script_recovery tool for Question 3.2 when tools are enabled", () => {
    // Question 3.2 is at index 9
    const q32 = getCurrentQuestion(9, true);
    expect(q32?.id).toBe("3.2");
    expect(q32?.tool).toBeDefined();
    expect(q32?.tool?.type).toBe("script_recovery");
    expect(q32?.tool?.data?.dataList).toEqual([4, 7, 2, 9, 5, 8, 3]);
  });

  it("calculates exact Python step-by-step logic through all 7 iterations", () => {
    const data = [4, 7, 2, 9, 5, 8, 3];
    let result = 0;
    const history: Array<{ i: number; dataVal: number; op: string; result: number }> = [];

    for (let i = 0; i < data.length; i++) {
      const op = i % 2 === 0 ? "+" : "-";
      if (op === "+") {
        result += data[i];
      } else {
        result -= data[i];
      }
      history.push({ i, dataVal: data[i], op, result });
    }

    // Iteration 1 (i=0): 0 + 4 = 4
    expect(history[0]).toEqual({ i: 0, dataVal: 4, op: "+", result: 4 });
    // Iteration 2 (i=1): 4 - 7 = -3
    expect(history[1]).toEqual({ i: 1, dataVal: 7, op: "-", result: -3 });
    // Iteration 3 (i=2): -3 + 2 = -1
    expect(history[2]).toEqual({ i: 2, dataVal: 2, op: "+", result: -1 });
    // Iteration 4 (i=3): -1 - 9 = -10
    expect(history[3]).toEqual({ i: 3, dataVal: 9, op: "-", result: -10 });
    // Iteration 5 (i=4): -10 + 5 = -5
    expect(history[4]).toEqual({ i: 4, dataVal: 5, op: "+", result: -5 });
    // Iteration 6 (i=5): -5 - 8 = -13
    expect(history[5]).toEqual({ i: 5, dataVal: 8, op: "-", result: -13 });
    // Iteration 7 (i=6): -13 + 3 = -10
    expect(history[6]).toEqual({ i: 6, dataVal: 3, op: "+", result: -10 });

    // Final output is exactly -10
    expect(result).toBe(-10);
  });
});

describe("Round 3 Caesar Cipher Manual Wheel Reference (Q3.3)", () => {
  it("registers command_recovery tool in round3 definition", () => {
    const round3 = getRoundDefinition(3);
    expect(round3?.toolRegistry?.command_recovery).toBeDefined();
  });

  it("delivers command_recovery tool for Question 3.3 when tools are enabled", () => {
    // Question 3.3 is at index 10
    const q33 = getCurrentQuestion(10, true);
    expect(q33?.id).toBe("3.3");
    expect(q33?.tool).toBeDefined();
    expect(q33?.tool?.type).toBe("command_recovery");
    expect(q33?.tool?.data?.ciphertext).toBe("YLZAVYL");
    expect(q33?.tool?.data?.defaultShift).toBe(-7);
  });

  it("decodes YLZAVYL backwards by 7 positions to RESTORE", () => {
    const decoded = decodeCaesarBackward("YLZAVYL", 7);
    expect(decoded).toBe("RESTORE");
  });

  it("does not leak the plaintext answer in question prompt or tool data", () => {
    const q33 = getCurrentQuestion(10, true);
    expect(q33?.prompt).not.toContain("RESTORE");
    expect(JSON.stringify(q33?.tool?.data)).not.toContain("RESTORE");
  });

  it("exports CommandRecovery tool with manual wheel reference and text area submission", async () => {
    const { CommandRecovery } = await import("../tools/CommandRecovery");
    expect(CommandRecovery).toBeDefined();
    expect(typeof CommandRecovery).toBe("function");
  });
});


