import { Crown, Medal } from "lucide-react";
import type { StudentScore } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import Hearts from "./game/Hearts";

const RANK_STYLES = [
  "bg-amber-400/15 text-amber-300 border-amber-400/40",
  "bg-slate-300/10 text-slate-200 border-slate-300/30",
  "bg-orange-500/10 text-orange-300 border-orange-500/30",
];

interface LeaderboardTableProps {
  scores: StudentScore[];
  /** Highlight the row belonging to the current player. */
  highlightId?: string | null;
  showDate?: boolean;
}

export default function LeaderboardTable({
  scores,
  highlightId = null,
  showDate = false,
}: LeaderboardTableProps) {
  if (scores.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        No survivors yet — be the first to conquer the lecture! 🏆
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-left text-xs tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 font-semibold">Rank</th>
            <th className="px-4 py-3 font-semibold">Student</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">Correct</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">Lives left</th>
            {showDate && <th className="hidden px-4 py-3 font-semibold lg:table-cell">Date</th>}
            <th className="px-4 py-3 text-right font-semibold">Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, i) => (
            <tr
              key={score.id}
              className={cn(
                "border-t border-slate-800/80",
                score.id === highlightId ? "bg-indigo-500/15" : i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/10",
              )}
            >
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border font-bold",
                    RANK_STYLES[i] ?? "border-slate-700 bg-slate-800 text-slate-300",
                  )}
                >
                  {i === 0 ? <Crown className="h-4 w-4" /> : i < 3 ? <Medal className="h-4 w-4" /> : i + 1}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-white">
                  {score.student_name}
                  {score.id === highlightId && (
                    <span className="ml-2 rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      YOU
                    </span>
                  )}
                </p>
                {score.student_id && <p className="text-xs text-slate-500">ID: {score.student_id}</p>}
              </td>
              <td className="hidden px-4 py-3 text-slate-300 sm:table-cell">{score.correct_answers}</td>
              <td className="hidden px-4 py-3 md:table-cell">
                <Hearts lives={score.lives_left} size="sm" />
              </td>
              {showDate && (
                <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                  {formatDateTime(score.completed_at)}
                </td>
              )}
              <td className="px-4 py-3 text-right text-base font-bold text-amber-300 tabular-nums">
                {score.score.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
