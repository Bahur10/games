"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D"];

interface QuestionCardProps {
  question: Question;
  /** null while the student can still answer. */
  selectedIndex: number | null;
  /** When true, reveal correct/wrong colours and disable the buttons. */
  revealed: boolean;
  onAnswer: (optionIndex: number) => void;
}

export default function QuestionCard({
  question,
  selectedIndex,
  revealed,
  onAnswer,
}: QuestionCardProps) {
  return (
    <div className="animate-fade-up">
      <h2 className="text-xl leading-snug font-bold text-white sm:text-2xl">
        {question.question_text}
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct_option_index;
          const isSelected = i === selectedIndex;

          return (
            <button
              key={`${question.id}-${i}`}
              type="button"
              disabled={revealed}
              onClick={() => onAnswer(i)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-medium transition-all duration-150",
                !revealed &&
                  "border-slate-700 bg-slate-800/70 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-500/15 active:translate-y-0",
                revealed && isCorrect &&
                  "animate-pop-in border-emerald-400 bg-emerald-500/20 text-emerald-100",
                revealed && isSelected && !isCorrect &&
                  "animate-shake border-rose-500 bg-rose-500/20 text-rose-100",
                revealed && !isCorrect && !isSelected && "border-slate-800 bg-slate-900/60 text-slate-500",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                  revealed && isCorrect
                    ? "bg-emerald-500 text-white"
                    : revealed && isSelected
                      ? "bg-rose-500 text-white"
                      : "bg-slate-700 text-slate-200 group-hover:bg-indigo-500 group-hover:text-white",
                )}
              >
                {OPTION_LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
              {revealed && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
              {revealed && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0 text-rose-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
