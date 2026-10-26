"use client";

import { useState, type FormEvent } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import type { StudentInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-white placeholder:text-slate-500 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40";

interface BulkAddStudentsProps {
  saving: boolean;
  /** Returns true when at least one student was added (textarea is then cleared). */
  onBulkAdd: (inputs: StudentInput[], invalidLines: number) => Promise<boolean>;
}

/** Heuristic: an ID-like token contains a digit and no spaces. */
function looksLikeId(part: string): boolean {
  return /\d/.test(part) && !part.includes(" ");
}

/**
 * Parse pasted lines into students. Accepts "Full Name, Student ID" per line
 * (comma, tab or semicolon separated); "Student ID, Full Name" also works.
 */
function parseLines(text: string): { inputs: StudentInput[]; invalid: number } {
  const inputs: StudentInput[] = [];
  let invalid = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line
      .split(/[,\t;]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) {
      invalid++;
      continue;
    }
    let fullName: string;
    let studentId: string;
    if (looksLikeId(parts[0]) && !looksLikeId(parts[parts.length - 1])) {
      studentId = parts[0];
      fullName = parts.slice(1).join(" ");
    } else {
      studentId = parts[parts.length - 1];
      fullName = parts.slice(0, -1).join(" ");
    }
    if (fullName.length < 3 || studentId.length < 2) {
      invalid++;
      continue;
    }
    inputs.push({ full_name: fullName, student_id: studentId });
  }

  return { inputs, invalid };
}

export default function BulkAddStudents({ saving, onBulkAdd }: BulkAddStudentsProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { inputs, invalid } = parseLines(text);
    if (inputs.length === 0) {
      setError("No valid lines found. Use one student per line: Full Name, Student ID");
      return;
    }
    setError(null);
    const addedAny = await onBulkAdd(inputs, invalid);
    if (addedAny) setText("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:p-6"
      noValidate
    >
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-white">
        <ClipboardList className="h-5 w-5 text-indigo-400" />
        Add many students at once
      </h2>
      <p className="mb-3 text-sm text-slate-400">
        Paste your class list — one student per line, as{" "}
        <code className="rounded bg-black/30 px-1">Full Name, Student ID</code> (the reverse
        order also works). Duplicates are skipped automatically.
      </p>

      <textarea
        rows={5}
        aria-label="Paste students, one per line: Full Name, Student ID"
        placeholder={"Sara Ahmed, 2201045\nOmar Khalil, 2201046\nLayla Nasser, 2201047"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={cn(inputClass, "resize-y font-mono text-sm")}
      />

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-400/50 bg-indigo-500/15 px-5 py-3 font-bold text-indigo-200 transition hover:bg-indigo-500/25 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ClipboardList className="h-5 w-5" />
        )}
        {saving ? "Adding…" : "Add all listed students"}
      </button>
    </form>
  );
}
