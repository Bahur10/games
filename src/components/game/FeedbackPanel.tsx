"use client";

import { ArrowRight, Clock3, Lightbulb, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackPanelProps {
  correct: boolean;
  timedOut: boolean;
  points: number;
  explanation: string;
  /** e.g. "Next question" or "See your result" on the final question/death. */
  nextLabel: string;
  onNext: () => void;
}

/** Shown after every answer: celebration + points, or the explanation. */
export default function FeedbackPanel({
  correct,
  timedOut,
  points,
  explanation,
  nextLabel,
  onNext,
}: FeedbackPanelProps) {
  return (
    <div
      className={cn(
        "animate-pop-in mt-6 rounded-2xl border-2 p-5",
        correct
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-rose-500/50 bg-rose-500/10",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("flex items-center gap-2 text-lg font-bold", correct ? "text-emerald-300" : "text-rose-300")}>
          {correct ? (
            <>
              <PartyPopper className="h-6 w-6" /> Correct! +{points} points
            </>
          ) : timedOut ? (
            <>
              <Clock3 className="h-6 w-6" /> Time&apos;s up! You lost a heart 💔
            </>
          ) : (
            <>💔 Wrong answer — you lost a heart</>
          )}
        </p>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-white transition hover:brightness-110 active:scale-95",
            correct ? "bg-emerald-600" : "bg-rose-600",
          )}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {!correct && explanation.trim().length > 0 && (
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-300">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <span className="font-semibold text-amber-300">Explanation: </span>
            {explanation}
          </span>
        </p>
      )}
    </div>
  );
}
