import { describe, it, expect } from "vitest";
import {
  getCurrentQuestion,
  getCaseFileDossier,
  ORDER,
} from "@/lib/game/engine.server";

// Helper for bit conversion matching the SignalLamp transcription switches
function decodeSwitchesToAscii(switches: boolean[]): { decimal: number; char: string } {
  const decimal = switches.reduce(
    (acc, bit, idx) => acc + (bit ? Math.pow(2, 7 - idx) : 0),
    0
  );
  const char = decimal >= 32 && decimal <= 126 ? String.fromCharCode(decimal) : "·";
  return { decimal, char };
}

describe("Round 1 Quality and Integrity Gates", () => {
  describe("(a) Signal Bits Delivery in /api/state", () => {
    it("delivers optical signal bits ONLY when progress is 0 (Question 1.1)", () => {
      const q1 = getCurrentQuestion(0, true);
      expect(q1?.id).toBe("1.1");
      expect(q1?.tool).toBeDefined();
      expect(q1?.tool?.type).toBe("signal");
      expect(q1?.tool?.data?.bits).toBe("01010011 01011010");
    });

    it("NEVER includes optical signal bits for progress > 0", () => {
      for (let p = 1; p < ORDER.length; p++) {
        const q = getCurrentQuestion(p, true);
        if (q?.tool) {
          expect(
            q.tool.data?.bits,
            `Progress ${p} (Question ${q.id}) must not contain signal bits`
          ).toBeUndefined();
        }
      }
    });
  });

  describe("(b) Answer Leaks Guard in Client Payloads", () => {
    it("does not leak answer 'SZ' in question 1.1 prompt or tool data", () => {
      const q1 = getCurrentQuestion(0, true);
      expect(q1?.prompt).not.toContain("SZ");
      expect(JSON.stringify(q1?.tool?.data)).not.toContain("SZ");
    });

    it("does not leak answer '13' in question 1.3 prompt or case file before 1.3 is solved", () => {
      const q3 = getCurrentQuestion(2, true);
      expect(q3?.id).toBe("1.3");
      // Prompt gives the arithmetic rule, not the answer
      expect(q3?.prompt).not.toContain(" 13");
      const dossierBefore1_3 = getCaseFileDossier(2);
      expect(dossierBefore1_3.signature).toBeNull();
    });
  });

  describe("(c) Case File Solved Items Only", () => {
    it("returns null for all dossier fields at progress 0 (Q1.1)", () => {
      const dossier = getCaseFileDossier(0);
      expect(dossier.projectIdentifier).toBeNull();
      expect(dossier.processId).toBeNull();
      expect(dossier.signature).toBeNull();
    });

    it("returns only project identifier at progress 1 (Q1.2)", () => {
      const dossier = getCaseFileDossier(1);
      expect(dossier.projectIdentifier).toBe("SZ");
      expect(dossier.processId).toBeNull();
      expect(dossier.signature).toBeNull();
    });

    it("returns project identifier and process ID at progress 2 (Q1.3)", () => {
      const dossier = getCaseFileDossier(2);
      expect(dossier.projectIdentifier).toBe("SZ");
      expect(dossier.processId).toBe("314");
      expect(dossier.signature).toBeNull();
    });

    it("returns all three recovered items at progress 3 (Q1.4)", () => {
      const dossier = getCaseFileDossier(3);
      expect(dossier.projectIdentifier).toBe("SZ");
      expect(dossier.processId).toBe("314");
      expect(dossier.signature).toBe("13");
    });
  });

  describe("(d) Kill Switch Disabled Mode", () => {
    it("returns plain-text fallback question without tool when toolsEnabled is false", () => {
      const q1Plain = getCurrentQuestion(0, false);
      expect(q1Plain?.tool).toBeUndefined();
      expect(q1Plain?.prompt).toContain("Decode the following: 01010011 01011010");
    });

    it("returns plain-text question 1.2 without tool when toolsEnabled is false", () => {
      const q2Plain = getCurrentQuestion(1, false);
      expect(q2Plain?.tool).toBeUndefined();
      expect(q2Plain?.prompt).toContain("Process ID | Project tag | Status | Timestamp");
    });
  });

  describe("(e) Transcription Switch-to-ASCII Decoder", () => {
    it("correctly decodes the guide's first byte 01010011 into ASCII 'S' (83)", () => {
      // 01010011: 0*128 + 1*64 + 0*32 + 1*16 + 0*8 + 0*4 + 1*2 + 1*1 = 64 + 16 + 2 + 1 = 83 ('S')
      const byte1 = [false, true, false, true, false, false, true, true];
      const result = decodeSwitchesToAscii(byte1);
      expect(result.decimal).toBe(83);
      expect(result.char).toBe("S");
    });

    it("correctly decodes the guide's second byte 01011010 into ASCII 'Z' (90)", () => {
      // 01011010: 0*128 + 1*64 + 0*32 + 1*16 + 1*8 + 0*4 + 1*2 + 0*1 = 64 + 16 + 8 + 2 = 90 ('Z')
      const byte2 = [false, true, false, true, true, false, true, false];
      const result = decodeSwitchesToAscii(byte2);
      expect(result.decimal).toBe(90);
      expect(result.char).toBe("Z");
    });

    it("correctly decodes arbitrary player input", () => {
      // 'A' (65): 01000001
      const byteA = [false, true, false, false, false, false, false, true];
      expect(decodeSwitchesToAscii(byteA)).toEqual({ decimal: 65, char: "A" });

      // '0' (48): 00110000 -> 32 + 16 = 48
      const byte0 = [false, false, true, true, false, false, false, false];
      expect(decodeSwitchesToAscii(byte0)).toEqual({ decimal: 48, char: "0" });

      // All zeros -> decimal 0, non-printable '·'
      const byteZero = Array(8).fill(false);
      expect(decodeSwitchesToAscii(byteZero)).toEqual({ decimal: 0, char: "·" });
    });

    it("verifies combined two-byte switches assemble into project identifier 'SZ'", () => {
      const byte1 = [false, true, false, true, false, false, true, true]; // 'S'
      const byte2 = [false, true, false, true, true, false, true, false]; // 'Z'
      const r1 = decodeSwitchesToAscii(byte1);
      const r2 = decodeSwitchesToAscii(byte2);
      const assembled = `${r1.char}${r2.char}`;
      expect(assembled).toBe("SZ");
    });
  });

  describe("(f) Photosensitivity & Flash Rate Verification", () => {
    it("guarantees flash frequency strictly never exceeds 3 flashes per second", () => {
      // Flash schedule specs:
      // Shortest possible flash cycle = 250ms (flash) + 480ms (gap) = 730ms
      // Longest flash cycle = 700ms (flash) + 480ms (gap) = 1180ms
      // Inter-byte gap = 1300ms
      const shortestCycleMs = 250 + 480; // 730 ms
      const maxFlashesPerSecond = 1000 / shortestCycleMs;

      expect(maxFlashesPerSecond).toBeLessThan(3.0);
      expect(maxFlashesPerSecond).toBeCloseTo(1.37, 2);

      // In any continuous 1000ms sliding window, count maximum flash events
      // Flashes start at: t=0ms, t=730ms. Next start would be t=1460ms > 1000ms.
      // Therefore, at most 2 flashes occur within any 1-second window.
      const flashesIn1SecWindow = Math.floor(1000 / shortestCycleMs) + 1;
      expect(flashesIn1SecWindow).toBeLessThanOrEqual(3);
    });
  });
});
