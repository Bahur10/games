import { Timer } from "lucide-react";
import { QUESTION_TIME_SECONDS } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Countdown bar + numeric seconds. Turns red and pulses under 4 seconds. */
export default function TimerBar({ secondsLeft }: { secondsLeft: number }) {
  const percent = Math.max(0, Math.min(100, (secondsLeft / QUESTION_TIME_SECONDS) * 100));
  const urgent = secondsLeft <= 4;

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold tabular-nums",
          urgent
            ? "animate-pulse border-rose-500/50 bg-rose-500/15 text-rose-300"
            : "border-slate-700 bg-slate-800/80 text-slate-200",
        )}
      >
        <Timer className="h-4 w-4" />
        {Math.ceil(secondsLeft)}s
      </div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100 ease-linear",
            urgent ? "bg-gradient-to-r from-rose-600 to-rose-400" : "bg-gradient-to-r from-emerald-500 to-lime-400",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
