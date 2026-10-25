"use client";

import { Loader2, Trash2 } from "lucide-react";
import type { StudentScore } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import Hearts from "@/components/game/Hearts";

interface ResultsTableProps {
  scores: StudentScore[];
  deletingId: string | null;
  onDelete: (score: StudentScore) => void;
}

export default function ResultsTable({ scores, deletingId, onDelete }: ResultsTableProps) {
  if (scores.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        No student has completed the challenge yet. Results will appear here automatically. 🎮
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
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">Completed</th>
            <th className="px-4 py-3 text-right font-semibold">Score</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr
              key={score.id}
              className={cn(
                "border-t border-slate-800/80",
                index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/10",
              )}
            >
              <td className="px-4 py-3 font-bold text-slate-400 tabular-nums">{index + 1}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-white">{score.student_name}</p>
                <p className="text-xs text-slate-500">
                  {score.student_id ? `ID: ${score.student_id}` : "No ID"}
                  <span className="lg:hidden"> · {formatDateTime(score.completed_at)}</span>
                </p>
              </td>
              <td className="hidden px-4 py-3 text-slate-300 sm:table-cell">{score.correct_answers}</td>
              <td className="hidden px-4 py-3 md:table-cell">
                <Hearts lives={score.lives_left} size="sm" />
              </td>
              <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                {formatDateTime(score.completed_at)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-amber-300 tabular-nums">
                {score.score.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(score)}
                  disabled={deletingId === score.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300 disabled:opacity-60"
                  aria-label={`Delete result of ${score.student_name}`}
                >
                  {deletingId === score.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
