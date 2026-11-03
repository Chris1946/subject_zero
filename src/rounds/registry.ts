import { RoundDefinition } from "./types";
import { round1Definition } from "./round1";
import { round2Definition } from "./round2";
import { round3Definition } from "./round3";
import { round4Definition } from "./round4";

export const ROUND_REGISTRY: Record<number, RoundDefinition> = {
  1: round1Definition,
  2: round2Definition,
  3: round3Definition,
  4: round4Definition,
};

export function getRoundDefinition(roundNumber: number): RoundDefinition | undefined {
  return ROUND_REGISTRY[roundNumber];
}

