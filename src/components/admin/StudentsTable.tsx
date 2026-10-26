"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { Student } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

interface StudentsTableProps {
  students: Student[];
  deletingId: string | null;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export default function StudentsTable({
  students,
  deletingId,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  if (students.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        No students registered yet. While this list is empty, <strong>any</strong> student can
        join with any name + ID. Add your class roster above to restrict access to your
        students only. 🎓
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-left text-xs tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Full name</th>
            <th className="px-4 py-3 font-semibold">Student ID</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">Registered</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr
              key={student.id}
              className={cn(
                "border-t border-slate-800/80",
                index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/10",
              )}
            >
              <td className="px-4 py-3 font-bold text-slate-400 tabular-nums">{index + 1}</td>
              <td className="px-4 py-3 font-semibold text-white">{student.full_name}</td>
              <td className="px-4 py-3">
                <code className="rounded-lg bg-slate-800 px-2 py-1 text-[13px] font-semibold text-sky-300">
                  {student.student_id}
                </code>
              </td>
              <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                {formatDateTime(student.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(student)}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-indigo-300"
                    aria-label={`Edit ${student.full_name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(student)}
                    disabled={deletingId === student.id}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300 disabled:opacity-60"
                    aria-label={`Remove ${student.full_name} from the roster`}
                  >
                    {deletingId === student.id ? (
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
