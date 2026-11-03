/**
 * Game content and logic module placeholder for Subject Zero.
 * Room configurations, questions, and progression logic will be implemented in subsequent steps.
 */

export interface QuestionDefinition {
  id: string; // e.g., '1.1'
  title: string;
  prompt: string;
  room: number;
}

export const GAME_ROOM_COUNT = 5;
export const QUESTIONS_PER_ROOM = 4;
export const TOTAL_QUESTIONS = GAME_ROOM_COUNT * QUESTIONS_PER_ROOM;
