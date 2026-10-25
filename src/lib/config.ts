/** Game rules — tweak the challenge here. */

/** Seconds the student has to answer each question. */
export const QUESTION_TIME_SECONDS = 10;

/** Hearts the student starts with. */
export const STARTING_LIVES = 3;

/** Maximum number of questions in a single run. */
export const QUESTIONS_PER_RUN = 10;

/** Points for a correct answer, before the time bonus. */
export const BASE_POINTS = 100;

/** Extra points per remaining second (rounded down) on a correct answer. */
export const TIME_BONUS_PER_SECOND = 10;

export function pointsForCorrectAnswer(secondsLeft: number): number {
  return BASE_POINTS + Math.max(0, Math.floor(secondsLeft)) * TIME_BONUS_PER_SECOND;
}
