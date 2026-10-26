"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Eraser,
  GraduationCap,
  Info,
  ListChecks,
  Loader2,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import ModeBanner from "@/components/ModeBanner";
import BulkAddStudents from "@/components/admin/BulkAddStudents";
import QuestionForm from "@/components/admin/QuestionForm";
import QuestionsTable from "@/components/admin/QuestionsTable";
import ResultsTable from "@/components/admin/ResultsTable";
import StudentForm from "@/components/admin/StudentForm";
import StudentsTable from "@/components/admin/StudentsTable";

import {
  clearAllScores,
  createQuestion,
  createStudent,
  createStudentsBulk,
  deleteQuestion,
  deleteScore,
  deleteStudent,
  fetchQuestions,
  fetchScores,
  fetchStudents,
  resetDemoQuestions,
  sortStudents,
  updateQuestion,
  updateStudent,
} from "@/lib/data";
import { useProfessor } from "@/lib/hooks";
import { logoutProfessor } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Question, QuestionInput, Student, StudentInput, StudentScore } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "questions" | "students" | "results";

interface Notice {
  kind: "success" | "error";
  text: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { username, loading: authLoading } = useProfessor();

  const [tab, setTab] = useState<Tab>("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [editing, setEditing] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [deletingScoreId, setDeletingScoreId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const studentFormRef = useRef<HTMLDivElement>(null);

  // ── Guard: professors only ───────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !username) router.replace("/?role=professor");
  }, [authLoading, username, router]);

  const showNotice = useCallback((kind: Notice["kind"], text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [loadedQuestions, loadedScores] = await Promise.all([
        fetchQuestions(),
        fetchScores(200),
      ]);
      setQuestions(loadedQuestions);
      setScores(loadedScores);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to load data.");
    }
    // The roster loads independently: if its table does not exist yet
    // (SQL not run), the rest of the dashboard must keep working.
    try {
      setStudents(await fetchStudents());
      setStudentsError(null);
    } catch {
      setStudents([]);
      setStudentsError(
        "The students table could not be loaded. If you just updated the app, run the students section of supabase/schema.sql in the Supabase SQL Editor, then refresh.",
      );
    } finally {
      setLoadingData(false);
    }
  }, [showNotice]);

  useEffect(() => {
    if (!authLoading && username) loadData();
  }, [authLoading, username, loadData]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const attempts = scores.length;
    const average =
      attempts > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / attempts) : 0;
    const highest = attempts > 0 ? Math.max(...scores.map((s) => s.score)) : 0;
    const survivors = scores.filter((s) => s.lives_left > 0).length;
    return { attempts, average, highest, survivors };
  }, [scores]);

  // ── Question handlers ────────────────────────────────────────────────────
  async function handleQuestionSubmit(input: QuestionInput) {
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateQuestion(editing.id, input);
        setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        setEditing(null);
        showNotice("success", "Question updated successfully.");
      } else {
        const created = await createQuestion(input);
        setQuestions((prev) => [...prev, created]);
        showNotice("success", "Question added — students will see it in their next run.");
      }
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not save the question.");
    } finally {
      setSaving(false);
    }
  }

  function handleEditQuestion(question: Question) {
    setEditing(question);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleDeleteQuestion(question: Question) {
    if (!window.confirm(`Delete this question?\n\n“${question.question_text}”`)) return;
    setDeletingQuestionId(question.id);
    try {
      await deleteQuestion(question.id);
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
      if (editing?.id === question.id) setEditing(null);
      showNotice("success", "Question deleted.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not delete the question.");
    } finally {
      setDeletingQuestionId(null);
    }
  }

  async function handleResetDemo() {
    if (!window.confirm("Replace all demo questions with the 10 sample questions?")) return;
    setQuestions(await resetDemoQuestions());
    setEditing(null);
    showNotice("success", "Sample questions restored.");
  }

  // ── Student roster handlers ──────────────────────────────────────────────
  async function handleStudentSubmit(input: StudentInput) {
    setSavingStudent(true);
    try {
      if (editingStudent) {
        const updated = await updateStudent(editingStudent.id, input);
        setStudents((prev) =>
          sortStudents(prev.map((s) => (s.id === updated.id ? updated : s))),
        );
        setEditingStudent(null);
        showNotice("success", "Student updated successfully.");
      } else {
        const created = await createStudent(input);
        setStudents((prev) => sortStudents([...prev, created]));
        showNotice("success", `${created.full_name} added to the roster.`);
      }
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not save the student.");
    } finally {
      setSavingStudent(false);
    }
  }

  function handleEditStudent(student: Student) {
    setEditingStudent(student);
    studentFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleDeleteStudent(student: Student) {
    if (
      !window.confirm(
        `Remove “${student.full_name}” (${student.student_id}) from the roster?\n\nThey will no longer be able to log in. Their past results are kept.`,
      )
    )
      return;
    setDeletingStudentId(student.id);
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      if (editingStudent?.id === student.id) setEditingStudent(null);
      showNotice("success", "Student removed from the roster.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not delete the student.");
    } finally {
      setDeletingStudentId(null);
    }
  }

  async function handleBulkAdd(inputs: StudentInput[], invalidLines: number): Promise<boolean> {
    setBulkSaving(true);
    try {
      const { added, skipped } = await createStudentsBulk(inputs);
      if (added.length > 0) {
        setStudents((prev) => sortStudents([...prev, ...added]));
      }
      const skippedTotal = skipped + invalidLines;
      if (added.length === 0) {
        showNotice(
          "error",
          "No new students were added — every line was a duplicate or incomplete.",
        );
        return false;
      }
      showNotice(
        "success",
        `Added ${added.length} student${added.length > 1 ? "s" : ""} to the roster.${
          skippedTotal > 0 ? ` ${skippedTotal} line(s) skipped (duplicates or incomplete).` : ""
        }`,
      );
      return true;
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not add the students.");
      return false;
    } finally {
      setBulkSaving(false);
    }
  }

  // ── Score handlers ───────────────────────────────────────────────────────
  async function handleDeleteScore(score: StudentScore) {
    if (!window.confirm(`Delete the result of “${score.student_name}” (${score.score} pts)?`)) return;
    setDeletingScoreId(score.id);
    try {
      await deleteScore(score.id);
      setScores((prev) => prev.filter((s) => s.id !== score.id));
      showNotice("success", "Result deleted.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not delete the result.");
    } finally {
      setDeletingScoreId(null);
    }
  }

  async function handleClearScores() {
    if (!window.confirm("Delete ALL student results? This cannot be undone.")) return;
    try {
      await clearAllScores();
      setScores([]);
      showNotice("success", "All results cleared.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not clear results.");
    }
  }

  async function handleLogout() {
    await logoutProfessor();
    router.replace("/");
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (authLoading || !username) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p>Checking professor access…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ModeBanner />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold text-white">
            <ShieldCheck className="h-8 w-8 text-rose-400" />
            Professor Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Signed in as <span className="font-semibold text-slate-200">{username}</span>
            {!isSupabaseConfigured && " · demo mode"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>

      {/* Notice toast */}
      {notice && (
        <p
          className={cn(
            "animate-pop-in mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
            notice.kind === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200",
          )}
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {notice.text}
        </p>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Questions", value: questions.length, icon: ListChecks, color: "text-indigo-400" },
          { label: "Attempts", value: stats.attempts, icon: Users, color: "text-sky-400" },
          { label: "Average score", value: stats.average.toLocaleString(), icon: BarChart3, color: "text-emerald-400" },
          { label: "Highest score", value: stats.highest.toLocaleString(), icon: Trophy, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <Icon className={cn("h-6 w-6", color)} />
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-900/80 p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "questions"}
          onClick={() => setTab("questions")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-sm font-semibold transition sm:gap-2 sm:text-base",
            tab === "questions" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white",
          )}
        >
          <ListChecks className="h-5 w-5 shrink-0" /> Questions ({questions.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "students"}
          onClick={() => setTab("students")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-sm font-semibold transition sm:gap-2 sm:text-base",
            tab === "students" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white",
          )}
        >
          <GraduationCap className="h-5 w-5 shrink-0" /> Students ({students.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "results"}
          onClick={() => setTab("results")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-sm font-semibold transition sm:gap-2 sm:text-base",
            tab === "results" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white",
          )}
        >
          <Users className="h-5 w-5 shrink-0" /> Results ({scores.length})
        </button>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Loader2 className="h-9 w-9 animate-spin" />
          <p>Loading dashboard data…</p>
        </div>
      ) : tab === "questions" ? (
        <div className="animate-fade-up space-y-6">
          <div ref={formRef} className="scroll-mt-24">
            {/* `key` re-mounts the form so its fields reset for add vs. edit */}
            <QuestionForm
              key={editing?.id ?? "new-question"}
              editing={editing}
              saving={saving}
              onSubmit={handleQuestionSubmit}
              onCancelEdit={() => setEditing(null)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              Current questions{" "}
              <span className="text-sm font-medium text-slate-500">
                — each run draws up to 10 at random
              </span>
            </h2>
            {!isSupabaseConfigured && (
              <button
                type="button"
                onClick={handleResetDemo}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore sample questions
              </button>
            )}
          </div>

          <QuestionsTable
            questions={questions}
            deletingId={deletingQuestionId}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
          />
        </div>
      ) : tab === "students" ? (
        <div className="animate-fade-up space-y-6">
          {/* How roster-gated login works */}
          <div className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
            <p>
              <span className="font-semibold text-white">How student access works: </span>
              while the roster is <strong>empty</strong>, any student can join with any name +
              ID. As soon as you add students here, only a registered{" "}
              <strong>name + Student ID</strong> pair can log in — the name must be typed as
              registered (capitals and extra spaces don&apos;t matter).
            </p>
          </div>

          {studentsError ? (
            <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-center">
              <AlertTriangle className="mx-auto h-9 w-9 text-rose-400" />
              <p className="mx-auto mt-3 max-w-md text-sm text-rose-200/90">{studentsError}</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          ) : (
            <>
              <div ref={studentFormRef} className="scroll-mt-24">
                {/* `key` re-mounts the form so its fields reset for add vs. edit */}
                <StudentForm
                  key={editingStudent?.id ?? "new-student"}
                  editing={editingStudent}
                  students={students}
                  saving={savingStudent}
                  onSubmit={handleStudentSubmit}
                  onCancelEdit={() => setEditingStudent(null)}
                />
              </div>

              <BulkAddStudents saving={bulkSaving} onBulkAdd={handleBulkAdd} />

              <h2 className="text-lg font-bold text-white">
                Registered students{" "}
                <span className="text-sm font-medium text-slate-500">
                  — {students.length} total
                </span>
              </h2>

              <StudentsTable
                students={students}
                deletingId={deletingStudentId}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
              />
            </>
          )}
        </div>
      ) : (
        <div className="animate-fade-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              Student results{" "}
              <span className="text-sm font-medium text-slate-500">
                — {stats.survivors} of {stats.attempts} attempts survived 🏆
              </span>
            </h2>
            {scores.length > 0 && (
              <button
                type="button"
                onClick={handleClearScores}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear all results
              </button>
            )}
          </div>
          <ResultsTable scores={scores} deletingId={deletingScoreId} onDelete={handleDeleteScore} />
        </div>
      )}
    </div>
  );
}
