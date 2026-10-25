"use client";

import { Check, Loader2, Pencil, Trash2 } from "lucide-react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D"];

interface QuestionsTableProps {
  questions: Question[];
  deletingId: string | null;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

export default function QuestionsTable({
  questions,
  deletingId,
  onEdit,
  onDelete,
}: QuestionsTableProps) {
  if (questions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        No questions yet. Add your first lecture question with the form above. 📚
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-left text-xs tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Question & options</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">Explanation</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question, index) => (
            <tr
              key={question.id}
              className={cn(
                "border-t border-slate-800/80 align-top",
                index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/10",
              )}
            >
              <td className="px-4 py-3 font-bold text-slate-400 tabular-nums">{index + 1}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-white">{question.question_text}</p>
                <ul className="mt-2 space-y-1">
                  {question.options.map((option, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-1.5 text-[13px]",
                        i === question.correct_option_index
                          ? "font-semibold text-emerald-300"
                          : "text-slate-400",
                      )}
                    >
                      <span className="font-bold">{OPTION_LETTERS[i]}.</span>
                      {option}
                      {i === question.correct_option_index && <Check className="h-3.5 w-3.5" />}
                    </li>
                  ))}
                </ul>
                {/* Explanation inline on small screens (column hidden there) */}
                {question.explanation && (
                  <p className="mt-2 text-[13px] text-slate-500 italic lg:hidden">
                    💡 {question.explanation}
                  </p>
                )}
              </td>
              <td className="hidden max-w-xs px-4 py-3 text-slate-400 lg:table-cell">
                {question.explanation || <span className="text-slate-600">—</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(question)}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-indigo-300"
                    aria-label={`Edit question ${index + 1}`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(question)}
                    disabled={deletingId === question.id}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300 disabled:opacity-60"
                    aria-label={`Delete question ${index + 1}`}
                  >
                    {deletingId === question.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}{" "}
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
