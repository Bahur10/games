"use client";

import { useState, type FormEvent } from "react";
import { Loader2, PencilLine, UserPlus, X } from "lucide-react";
import type { Student, StudentInput } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-white placeholder:text-slate-500 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40";

interface StudentFormProps {
  /** Student being edited, or null when adding a new one. */
  editing: Student | null;
  /** Current roster, used to catch duplicate Student IDs before saving. */
  students: Student[];
  saving: boolean;
  onSubmit: (input: StudentInput) => Promise<void> | void;
  onCancelEdit: () => void;
}

/**
 * Add / edit student form.
 * The parent re-mounts this component with a different `key` whenever the
 * edited student changes, so local state always starts from `editing`.
 */
export default function StudentForm({
  editing,
  students,
  saving,
  onSubmit,
  onCancelEdit,
}: StudentFormProps) {
  const [fullName, setFullName] = useState(editing?.full_name ?? "");
  const [studentId, setStudentId] = useState(editing?.student_id ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = fullName.trim();
    const id = studentId.trim();

    if (name.length < 3) {
      setError("Please enter the student's full name (at least 3 characters).");
      return;
    }
    if (id.length < 2) {
      setError("Please enter the Student ID (the code برقم القيد).");
      return;
    }
    const clash = students.find(
      (s) => s.id !== editing?.id && normalizeText(s.student_id) === normalizeText(id),
    );
    if (clash) {
      setError(`Student ID "${id}" is already registered for ${clash.full_name}.`);
      return;
    }
    setError(null);
    await onSubmit({ full_name: name, student_id: id });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:p-6"
      noValidate
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          {editing ? (
            <PencilLine className="h-5 w-5 text-indigo-400" />
          ) : (
            <UserPlus className="h-5 w-5 text-indigo-400" />
          )}
          {editing ? "Edit student" : "Add a student"}
        </h2>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300" htmlFor="s-name">
            Full name
          </label>
          <input
            id="s-name"
            type="text"
            autoComplete="off"
            placeholder="e.g. Sara Ahmed"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            The student must type it exactly like this when logging in.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300" htmlFor="s-id">
            Student ID (الكود / رقم القيد)
          </label>
          <input
            id="s-id"
            type="text"
            autoComplete="off"
            placeholder="e.g. 2201045"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Unique per student — typed together with the name at login.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : editing ? (
          <PencilLine className="h-5 w-5" />
        ) : (
          <UserPlus className="h-5 w-5" />
        )}
        {saving ? "Saving…" : editing ? "Save changes" : "Add student"}
      </button>
    </form>
  );
}
