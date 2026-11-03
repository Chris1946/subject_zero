import { describe, it, expect } from "vitest";
import {
  clampVolume,
  getAmbientConfigForRoom,
  getDegradationParams,
} from "../engine";

describe("Web Audio Engine Pure Helpers", () => {
  describe("clampVolume", () => {
    it("clamps values below 0 to 0", () => {
      expect(clampVolume(-0.5)).toBe(0);
      expect(clampVolume(-100)).toBe(0);
    });

    it("clamps values above 1 to 1", () => {
      expect(clampVolume(1.5)).toBe(1);
      expect(clampVolume(100)).toBe(1);
    });

    it("returns valid volumes untouched", () => {
      expect(clampVolume(0)).toBe(0);
      expect(clampVolume(0.35)).toBe(0.35);
      expect(clampVolume(0.8)).toBe(0.8);
      expect(clampVolume(1)).toBe(1);
    });

    it("handles NaN safely", () => {
      expect(clampVolume(NaN)).toBe(0);
    });
  });

  describe("getAmbientConfigForRoom", () => {
    it("configures Room 1 (Monitoring Station) with 60Hz hum", () => {
      const config = getAmbientConfigForRoom(1);
      expect(config.name).toBe("monitoring_station");
      expect(config.baseFreq).toBe(60);
      expect(config.oscType).toBe("sine");
    });

    it("configures Room 2 (Network Operations) with layered server whir", () => {
      const config = getAmbientConfigForRoom(2);
      expect(config.name).toBe("network_room");
      expect(config.baseFreq).toBe(110);
      expect(config.oscType).toBe("sawtooth");
    });

    it("configures Room 3 (AI Core) with deep sub hum and slow pulse", () => {
      const config = getAmbientConfigForRoom(3);
      expect(config.name).toBe("ai_core");
      expect(config.baseFreq).toBe(48);
      expect(config.oscType).toBe("triangle");
      expect(config.lfoRate).toBeLessThan(0.1);
    });

    it("configures Room 4 (Archive) with near-silence low frequency", () => {
      const config = getAmbientConfigForRoom(4);
      expect(config.name).toBe("archive");
      expect(config.baseFreq).toBe(35);
      expect(config.filterFreq).toBeLessThan(200);
    });

    it("configures Room 5 (Containment Chamber) with low sub drone", () => {
      const config = getAmbientConfigForRoom(5);
      expect(config.name).toBe("containment_chamber");
      expect(config.baseFreq).toBe(40);
    });

    it("falls back to facility baseline for unknown rooms", () => {
      const config = getAmbientConfigForRoom(0);
      expect(config.name).toBe("facility_baseline");
      expect(config.baseFreq).toBe(55);
    });
  });

  describe("getDegradationParams", () => {
    it("returns baseline parameters for UNSTABLE", () => {
      const p = getDegradationParams("UNSTABLE");
      expect(p.level).toBe(0);
      expect(p.filterScale).toBe(1.0);
      expect(p.dropoutChance).toBe(0);
    });

    it("returns elevated noise and filtered sound for DEGRADED", () => {
      const p = getDegradationParams("DEGRADED");
      expect(p.level).toBe(1);
      expect(p.filterScale).toBeLessThan(1.0);
      expect(p.noiseGain).toBeGreaterThan(0.005);
    });

    it("returns higher degradation for MEMORY FAILURE", () => {
      const p = getDegradationParams("MEMORY FAILURE");
      expect(p.level).toBe(2);
      expect(p.dropoutChance).toBe(0.10);
    });

    it("returns heavy degradation for CRITICAL", () => {
      const p = getDegradationParams("CRITICAL");
      expect(p.level).toBe(3);
      expect(p.filterScale).toBeLessThan(0.7);
    });

    it("returns maximum degradation for CONNECTION CRITICAL", () => {
      const p = getDegradationParams("CONNECTION CRITICAL");
      expect(p.level).toBe(4);
      expect(p.filterScale).toBeLessThan(0.5);
      expect(p.noiseGain).toBeGreaterThan(0.04);
      expect(p.dropoutChance).toBe(0.28);
    });

    it("handles case insensitivity and whitespace", () => {
      const p = getDegradationParams("  connection critical  ");
      expect(p.level).toBe(4);
    });
  });
});
