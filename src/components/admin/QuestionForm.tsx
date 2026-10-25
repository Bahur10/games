"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, PencilLine, PlusCircle, X } from "lucide-react";
import type { Question, QuestionInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D"];

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-white placeholder:text-slate-500 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40";

interface QuestionFormProps {
  /** Question being edited, or null when adding a new one. */
  editing: Question | null;
  saving: boolean;
  onSubmit: (input: QuestionInput) => Promise<void> | void;
  onCancelEdit: () => void;
}

/**
 * Add / edit question form.
 * The parent re-mounts this component with a different `key` whenever the
 * edited question changes, so local state always starts from `editing`.
 */
export default function QuestionForm({ editing, saving, onSubmit, onCancelEdit }: QuestionFormProps) {
  const [questionText, setQuestionText] = useState(editing?.question_text ?? "");
  const [options, setOptions] = useState<string[]>(
    editing ? [...editing.options] : ["", "", "", ""],
  );
  const [correctIndex, setCorrectIndex] = useState(editing?.correct_option_index ?? 0);
  const [explanation, setExplanation] = useState(editing?.explanation ?? "");
  const [error, setError] = useState<string | null>(null);

  function setOption(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedOptions = options.map((o) => o.trim());

    if (questionText.trim().length < 5) {
      setError("Please write a clear question (at least 5 characters).");
      return;
    }
    if (trimmedOptions.some((o) => o.length === 0)) {
      setError("All four options must be filled in.");
      return;
    }
    if (new Set(trimmedOptions.map((o) => o.toLowerCase())).size !== 4) {
      setError("The four options must all be different.");
      return;
    }
    setError(null);
    await onSubmit({
      question_text: questionText.trim(),
      options: trimmedOptions,
      correct_option_index: correctIndex,
      explanation: explanation.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:p-6"
      noValidate
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          {editing ? <PencilLine className="h-5 w-5 text-indigo-400" /> : <PlusCircle className="h-5 w-5 text-indigo-400" />}
          {editing ? "Edit question" : "Add a new question"}
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

      <label className="mb-1.5 block text-sm font-medium text-slate-300" htmlFor="q-text">
        Question text
      </label>
      <textarea
        id="q-text"
        rows={2}
        placeholder="e.g. What does a primary key guarantee in a relational table?"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        className={cn(inputClass, "resize-y")}
      />

      <p className="mt-4 mb-2 text-sm font-medium text-slate-300">
        Answer options <span className="text-slate-500">(mark the correct one)</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option, i) => {
          const isCorrect = correctIndex === i;
          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border-2 p-2 transition",
                isCorrect ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-800 bg-slate-950/40",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    isCorrect ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-200",
                  )}
                >
                  {OPTION_LETTERS[i]}
                </span>
                <input
                  type="text"
                  aria-label={`Option ${OPTION_LETTERS[i]}`}
                  placeholder={`Option ${OPTION_LETTERS[i]}`}
                  value={option}
                  onChange={(e) => setOption(i, e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-slate-600 outline-none"
                />
              </div>
              <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 pl-9 text-xs font-medium text-slate-400 select-none">
                <input
                  type="radio"
                  name="correct-option"
                  checked={isCorrect}
                  onChange={() => setCorrectIndex(i)}
                  className="h-3.5 w-3.5 accent-emerald-500"
                />
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Correct answer
                  </span>
                ) : (
                  "Mark as correct"
                )}
              </label>
            </div>
          );
        })}
      </div>

      <label className="mt-4 mb-1.5 block text-sm font-medium text-slate-300" htmlFor="q-explanation">
        Explanation <span className="text-slate-500">(shown after a wrong answer or timeout)</span>
      </label>
      <textarea
        id="q-explanation"
        rows={2}
        placeholder="e.g. A primary key uniquely identifies each row and can never be NULL."
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className={cn(inputClass, "resize-y")}
      />

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
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : editing ? <PencilLine className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
        {saving ? "Saving…" : editing ? "Save changes" : "Add question"}
      </button>
    </form>
  );
}
