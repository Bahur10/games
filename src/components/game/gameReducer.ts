import { STARTING_LIVES, pointsForCorrectAnswer } from "@/lib/config";

export type GamePhase = "ready" | "playing" | "feedback" | "finished";

export interface GameState {
  phase: GamePhase;
  /** Index of the current question within the run. */
  index: number;
  lives: number;
  score: number;
  correctCount: number;
  /** Option the student picked (null = timeout / not answered yet). */
  selectedIndex: number | null;
  /** True when the last question ended because the timer reached zero. */
  timedOut: boolean;
  /** Whether the last answer was correct (null before the first answer). */
  lastCorrect: boolean | null;
  /** Points earned by the last answer (for the "+150" pop-up). */
  lastPoints: number;
}

export const initialGameState: GameState = {
  phase: "ready",
  index: 0,
  lives: STARTING_LIVES,
  score: 0,
  correctCount: 0,
  selectedIndex: null,
  timedOut: false,
  lastCorrect: null,
  lastPoints: 0,
};

export type GameAction =
  | { type: "START" }
  | { type: "ANSWER"; optionIndex: number; correctIndex: number; secondsLeft: number }
  | { type: "TIMEOUT" }
  | { type: "NEXT"; totalQuestions: number }
  | { type: "RESET" };

/**
 * Pure state machine for one run. Keeping every transition here (instead of
 * scattered setState calls) makes the game logic easy to test and free of
 * stale-closure bugs with the countdown timer.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return { ...initialGameState, phase: "playing" };

    case "RESET":
      return initialGameState;

    case "ANSWER": {
      if (state.phase !== "playing") return state;
      const isCorrect = action.optionIndex === action.correctIndex;
      const points = isCorrect ? pointsForCorrectAnswer(action.secondsLeft) : 0;
      return {
        ...state,
        phase: "feedback",
        selectedIndex: action.optionIndex,
        timedOut: false,
        lastCorrect: isCorrect,
        lastPoints: points,
        score: state.score + points,
        correctCount: state.correctCount + (isCorrect ? 1 : 0),
        lives: isCorrect ? state.lives : Math.max(0, state.lives - 1),
      };
    }

    case "TIMEOUT": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        phase: "feedback",
        selectedIndex: null,
        timedOut: true,
        lastCorrect: false,
        lastPoints: 0,
        lives: Math.max(0, state.lives - 1),
      };
    }

    case "NEXT": {
      if (state.phase !== "feedback") return state;
      const isLastQuestion = state.index >= action.totalQuestions - 1;
      if (state.lives <= 0 || isLastQuestion) {
        return { ...state, phase: "finished" };
      }
      return {
        ...state,
        phase: "playing",
        index: state.index + 1,
        selectedIndex: null,
        timedOut: false,
        lastCorrect: null,
        lastPoints: 0,
      };
    }

    default:
      return state;
  }
}
