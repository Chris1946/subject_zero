import "server-only";
import { GAME_CONTENT } from "./content.server";
import { matchAnswer } from "./answers.server";

export const ORDER = [
  "1.1", "1.2", "1.3", "1.4",
  "2.1", "2.2", "2.3", "2.4",
  "3.1", "3.2", "3.3", "3.4",
  "4.1", "4.2", "4.3", "4.4",
  "5.1", "5.2", "5.3", "5.4",
] as const;

export type QuestionId = (typeof ORDER)[number];

export interface QuestionTool {
  type: string;
  data: Record<string, unknown>;
}

export interface CurrentQuestionView {
  id: string;
  title: string;
  prompt: string;
  answerFormatHint?: string;
  room: {
    id: number;
    location: string;
    connectionStatus: string;
  };
  index: number;
  total: number;
  tool?: QuestionTool;
}

export interface UnlockedRoomStory {
  id: number;
  location: string;
  connectionStatus: string;
  entranceImageKey: string;
  entranceMessage: string;
  entrySidebarMessage: string;
  isCompleted: boolean;
  discoveryFile?: string;
  afterDiscoverySidebarMessage?: string;
  transitionToNextRoom?: string;
}

export interface QuestionReveal {
  questionId: string;
  reveal: string;
}

export interface UnlockedStoryView {
  prologue: {
    connectionStatus: string;
    briefing: string;
    sidebarMessages: string[];
    transitionToRound1: string;
  };
  rooms: UnlockedRoomStory[];
  reveals: QuestionReveal[];
  finalCinematic?: {
    narratorText: string;
    overlayLines: string[];
  };
}

export interface CaseFileDossier {
  projectIdentifier: string | null;
  processId: string | null;
  signature: string | null;
}

/**
 * Returns the case file dossier based strictly on questions verified as solved.
 * Guaranteed: Never returns an unsolved answer.
 */
export function getCaseFileDossier(progress: number): CaseFileDossier {
  return {
    projectIdentifier: progress >= 1 ? "SZ" : null,
    processId: progress >= 2 ? "314" : null,
    signature: progress >= 3 ? "13" : null,
  };
}

/**
 * Returns the active question for the team based on current progress.
 * Returns null if the team has finished all 20 questions or progress is invalid.
 * GUARANTEE: Never includes answers or wrongFeedback.
 */
export function getCurrentQuestion(
  progress: number,
  toolsEnabled = true
): CurrentQuestionView | null {
  if (progress < 0 || progress >= ORDER.length) {
    return null;
  }

  const questionId = ORDER[progress];
  const roomIndex = Math.floor(progress / 4);
  const room = GAME_CONTENT.rooms[roomIndex];

  if (!room) {
    return null;
  }

  const question = room.questions.find((q) => q.id === questionId);
  if (!question) {
    return null;
  }

  let prompt = question.prompt;
  let tool: QuestionTool | undefined = undefined;

  // Round 1 Dynamic Tool Delivery
  if (questionId === "1.1") {
    if (toolsEnabled) {
      // Replaced wording: Optical indicator flashes sequence to transcribe
      prompt =
        "TERMINAL 01: PROJECT IDENTIFICATION The monitoring terminal contains a binary sequence. The project database requires the sequence to be converted into ASCII text before its records can be accessed. An optical indicator on the terminal display flashes the binary sequence (a long flash represents 1, a short flash represents 0); transcribe the transmission and convert the signal into ASCII characters. Enter the two-letter project identifier.";
      tool = {
        type: "signal",
        data: {
          bits: "01010011 01011010",
        },
      };
    } else {
      // Kill-switch off or plain text mode: print binary directly
      prompt =
        "TERMINAL 01: PROJECT IDENTIFICATION The monitoring terminal contains a binary sequence. The project database requires the sequence to be converted into ASCII text before its records can be accessed. Decode the following: 01010011 01011010 Enter the two-letter project identifier.";
    }
  } else if (questionId === "1.2") {
    if (toolsEnabled) {
      // Tool for 1.2: Sortable Process log table
      tool = {
        type: "table",
        data: {
          rows: [
            { processId: "314", projectTag: "SZ", status: "SUCCESS", timestamp: "23:07:48" },
            { processId: "428", projectTag: "SZ", status: "FAILED", timestamp: "23:09:12" },
            { processId: "721", projectTag: "SZ", status: "SUCCESS", timestamp: "23:12:31" },
          ],
        },
      };
    }
  } else if (questionId === "2.1") {
    if (toolsEnabled) {
      // Tool for 2.1: Network Session Filter with Spotlight
      tool = {
        type: "network_session_filter",
        data: {
          targetPid: 314,
          targetPort: 443,
          sessions: [
            { session: "A", processId: 314, port: 443, data: "1010" },
            { session: "B", processId: 721, port: 22, data: "0111" },
            { session: "C", processId: 314, port: 443, data: "1100" },
            { session: "D", processId: 830, port: 443, data: "0011" },
            { session: "E", processId: 428, port: 22, data: "1110" },
            { session: "F", processId: 314, port: 443, data: "0011" },
          ],
        },
      };
    }
  } else if (questionId === "2.2") {
    if (toolsEnabled) {
      // Tool for 2.2: Data Reconstruction (3-way bitwise XOR)
      tool = {
        type: "data_reconstruction",
        data: {
          sessions: [
            { session: "A", data: "1010" },
            { session: "C", data: "1100" },
            { session: "F", data: "0011" },
          ],
        },
      };
    }
  } else if (questionId === "2.3") {
    if (toolsEnabled) {
      // Tool for 2.3: Vault Dials (4-bit binary XOR calculator & direct submitter)
      tool = {
        type: "vault_dials",
        data: {},
      };
    }
  } else if (questionId === "3.1") {
    if (toolsEnabled) {
      // Tool for 3.1: Interactive Caesar Cipher Wheel
      tool = {
        type: "cipher",
        data: {
          ciphertext: "KWZZCXB",
          defaultShift: 0,
        },
      };
    }
  } else if (questionId === "3.2") {
    if (toolsEnabled) {
      // Tool for 3.2: Step-by-step Script Recovery Tracker
      tool = {
        type: "script_recovery",
        data: {
          dataList: [4, 7, 2, 9, 5, 8, 3],
          initialResult: 0,
        },
      };
    }
  } else if (questionId === "3.3") {
    if (toolsEnabled) {
      // Tool for 3.3: Caesar Cipher Manual Wheel Reference
      tool = {
        type: "command_recovery",
        data: {
          ciphertext: "YLZAVYL",
          defaultShift: -7,
        },
      };
    }
  } else if (questionId === "4.1") {
    if (toolsEnabled) {
      // Tool for 4.1: Timestamp Reconstruction Cards
      tool = {
        type: "timestamp_reconstruction",
        data: {
          items: [
            { timestamp: "23:17:42", letter: "U" },
            { timestamp: "23:12:08", letter: "T" },
            { timestamp: "23:19:55", letter: "H" },
            { timestamp: "23:14:31", letter: "R" },
            { timestamp: "23:18:16", letter: "T" },
          ],
        },
      };
    }
  } else if (questionId === "4.2") {
    if (toolsEnabled) {
      // Tool for 4.2: Access Record Analysis & Timeline Selection
      tool = {
        type: "access_records",
        data: {
          shutdownTime: "23:00",
          records: [
            { id: "A", timestamp: "22:58:31", status: "SUCCESS" },
            { id: "B", timestamp: "23:02:14", status: "FAILED" },
            { id: "C", timestamp: "23:05:42", status: "SUCCESS" },
            { id: "D", timestamp: "23:08:19", status: "SUCCESS" },
            { id: "E", timestamp: "23:10:01", status: "FAILED" },
          ],
        },
      };
    }
  } else if (questionId === "4.3") {
    if (toolsEnabled) {
      // Tool for 4.3: Caesar Cipher Keyword Recovery Wheel
      tool = {
        type: "keyword_recovery",
        data: {
          ciphertext: "FQNAJ",
          defaultShift: 0,
        },
      };
    }
  }

  return {
    id: question.id,
    title: question.title,
    prompt,
    ...(question.answerFormatHint ? { answerFormatHint: question.answerFormatHint } : {}),
    room: {
      id: room.id,
      location: room.location,
      connectionStatus: room.connectionStatus,
    },
    index: progress,
    total: ORDER.length,
    ...(tool ? { tool } : {}),
  };
}

/**
 * Returns all narrative and storyline content unlocked by the team so far.
 * Guaranteed to only return rooms, discoveries, and reveals for questions/rooms already reached or completed.
 */
export function getUnlockedStory(progress: number): UnlockedStoryView {
  const currentProgress = Math.max(0, Math.min(progress, ORDER.length));

  const unlockedRooms: UnlockedRoomStory[] = [];
  const reveals: QuestionReveal[] = [];

  const highestRoomReachedIndex = Math.min(
    Math.floor(currentProgress / 4),
    GAME_CONTENT.rooms.length - 1
  );

  for (let rIdx = 0; rIdx <= highestRoomReachedIndex; rIdx++) {
    const room = GAME_CONTENT.rooms[rIdx];
    const isRoomCompleted = currentProgress >= (rIdx + 1) * 4;

    unlockedRooms.push({
      id: room.id,
      location: room.location,
      connectionStatus: room.connectionStatus,
      entranceImageKey: room.entranceImageKey,
      entranceMessage: room.entranceMessage,
      entrySidebarMessage: room.entrySidebarMessage,
      isCompleted: isRoomCompleted,
      ...(isRoomCompleted ? { discoveryFile: room.discoveryFile } : {}),
      ...(isRoomCompleted && room.afterDiscoverySidebarMessage
        ? { afterDiscoverySidebarMessage: room.afterDiscoverySidebarMessage }
        : {}),
      ...(isRoomCompleted && room.transitionToNextRoom
        ? { transitionToNextRoom: room.transitionToNextRoom }
        : {}),
    });
  }

  // Question reveals: questions 0..(currentProgress - 1)
  for (let p = 0; p < currentProgress; p++) {
    const qId = ORDER[p];
    const rIdx = Math.floor(p / 4);
    const room = GAME_CONTENT.rooms[rIdx];
    const q = room?.questions.find((question) => question.id === qId);

    if (q && q.revealAfterCorrect) {
      reveals.push({
        questionId: q.id,
        reveal: q.revealAfterCorrect,
      });
    }
  }

  const finalCinematic =
    currentProgress >= ORDER.length ? GAME_CONTENT.finalCinematic : undefined;

  return {
    prologue: GAME_CONTENT.prologue,
    rooms: unlockedRooms,
    reveals,
    ...(finalCinematic ? { finalCinematic } : {}),
  };
}

export { matchAnswer };

/**
 * Checks a submitted answer for a given question against master matchers.
 * Returns correctness, feedback message, and optional reveal text.
 */
export function checkAnswer(
  questionId: string,
  rawAnswer: string
): {
  correct: boolean;
  feedback?: string;
  reveal?: string;
  finished?: boolean;
} {
  const isCorrect = matchAnswer(questionId, rawAnswer);
  const q = GAME_CONTENT.rooms
    .flatMap((r) => r.questions)
    .find((item) => item.id === questionId);

  if (!isCorrect) {
    return {
      correct: false,
      feedback: q?.wrongFeedback ?? "INCORRECT ANSWER.",
    };
  }

  const qIdx = ORDER.indexOf(questionId as QuestionId);
  const isLastQuestion = qIdx === ORDER.length - 1;

  return {
    correct: true,
    reveal: q?.revealAfterCorrect,
    finished: isLastQuestion,
  };
}
