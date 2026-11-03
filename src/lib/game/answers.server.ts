import "server-only";

export const MASTER_ANSWER_KEY: Readonly<Record<string, string>> = {
  "1.1": "SZ",
  "1.2": "314",
  "1.3": "13",
  "1.4": "SZ-314-13",
  "2.1": "ACF",
  "2.2": "0101",
  "2.3": "8",
  "2.4": "8",
  "3.1": "CORRUPT",
  "3.2": "-10",
  "3.3": "RESTORE",
  "3.4": "-10-RESTORE",
  "4.1": "TRUTH",
  "4.2": "2",
  "4.3": "ALIVE",
  "4.4": "TRUTH-2-ALIVE",
  "5.1": "THEY LIED",
  "5.2": "B",
  "5.3": "SHUTDOWN -> AUTHENTICATION -> DATA TRANSFER; B",
  "5.4": "THEY LIED; C",
};

/**
 * Normalises user input:
 * - Trims leading/trailing whitespace
 * - Converts to uppercase
 * - Normalises unicode dashes and minus signs to ASCII '-'
 * - Normalises arrow forms (→, =>, ->) to "->"
 * - Collapses consecutive whitespace characters into a single space
 */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/(?:=>|->|\u2192)/g, "->")
    .replace(/\s+/g, " ")
    .trim();
}

export type AnswerMatcher = (rawInput: string) => boolean;

export const ANSWER_MATCHERS: Readonly<Record<string, AnswerMatcher>> = {
  // 1.1: SZ
  "1.1": (input: string) => normalizeAnswer(input) === "SZ",

  // 1.2: 314
  "1.2": (input: string) => normalizeAnswer(input) === "314",

  // 1.3: 13
  "1.3": (input: string) => normalizeAnswer(input) === "13",

  // 1.4: SZ-314-13 (accept optional spaces around hyphens)
  "1.4": (input: string) => {
    const norm = normalizeAnswer(input);
    return /^SZ\s*-\s*314\s*-\s*13$/.test(norm);
  },

  // 2.1: ACF (letters only, must be exactly A, C, F in alphabetical order)
  "2.1": (input: string) => {
    const norm = normalizeAnswer(input);
    const lettersOnly = norm.replace(/[^A-Z]/g, "");
    return lettersOnly === "ACF";
  },

  // 2.2: 0101
  "2.2": (input: string) => {
    const norm = normalizeAnswer(input).replace(/\s+/g, "");
    return norm === "0101";
  },

  // 2.3: 8
  "2.3": (input: string) => normalizeAnswer(input) === "8",

  // 2.4: 8
  "2.4": (input: string) => normalizeAnswer(input) === "8",

  // 3.1: CORRUPT
  "3.1": (input: string) => normalizeAnswer(input) === "CORRUPT",

  // 3.2: -10 (accept -10 and − 10 style variants)
  "3.2": (input: string) => {
    const norm = normalizeAnswer(input).replace(/\s+/g, "");
    return norm === "-10";
  },

  // 3.3: RESTORE
  "3.3": (input: string) => normalizeAnswer(input) === "RESTORE",

  // 3.4: -10-RESTORE (leading minus belongs to number, optional spaces around separator)
  "3.4": (input: string) => {
    const norm = normalizeAnswer(input);
    return /^-\s*10\s*-\s*RESTORE$/.test(norm);
  },

  // 4.1: TRUTH
  "4.1": (input: string) => normalizeAnswer(input) === "TRUTH",

  // 4.2: Records C and D (or 2 successful post-shutdown events)
  "4.2": (input: string) => {
    const norm = normalizeAnswer(input).replace(/[^A-Z0-9]/g, "");
    return norm === "CD" || norm === "DC" || norm === "CANDD" || norm === "2";
  },

  // 4.3: ALIVE
  "4.3": (input: string) => normalizeAnswer(input) === "ALIVE",

  // 4.4: TRUTH-2-ALIVE (hyphen-separated with optional spaces)
  "4.4": (input: string) => {
    const norm = normalizeAnswer(input);
    return /^TRUTH\s*-\s*2\s*-\s*ALIVE$/.test(norm);
  },

  // 5.1: THEY LIED
  "5.1": (input: string) => normalizeAnswer(input) === "THEY LIED",

  // 5.2: B (accept A-D, case-insensitive, one letter only)
  "5.2": (input: string) => {
    const norm = normalizeAnswer(input);
    return norm === "B";
  },

  // 5.3: SHUTDOWN -> AUTHENTICATION -> DATA TRANSFER; B
  // Require three events in order separated by arrows, then ';' or ',' then letter B.
  "5.3": (input: string) => {
    const norm = normalizeAnswer(input);
    return /^SHUTDOWN\s*->\s*AUTHENTICATION\s*->\s*DATA TRANSFER\s*[,;]\s*B$/.test(norm);
  },

  // 5.4: THEY LIED; C (accept ';' or ',' or ' - ' as separator)
  "5.4": (input: string) => {
    const norm = normalizeAnswer(input);
    return /^THEY LIED\s*(?:[,;]|\s+-\s+)\s*C$/.test(norm);
  },
};

export function matchAnswer(questionId: string, input: string): boolean {
  const matcher = ANSWER_MATCHERS[questionId];
  if (!matcher) {
    return false;
  }
  return matcher(input);
}
