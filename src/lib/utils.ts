import type { Question } from "./types";

/** Join class names, dropping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Fisher–Yates shuffle (returns a new array, never mutates the input). */
export function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffle a question's options and remap the correct index, so the right
 * answer is not always in the position the professor typed it.
 */
export function withShuffledOptions(question: Question): Question {
  const tagged = question.options.map((text, index) => ({
    text,
    isCorrect: index === question.correct_option_index,
  }));
  const mixed = shuffled(tagged);
  return {
    ...question,
    options: mixed.map((o) => o.text),
    correct_option_index: mixed.findIndex((o) => o.isCorrect),
  };
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
