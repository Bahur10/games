"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Heart,
  IdCard,
  Loader2,
  Lock,
  LogIn,
  Play,
  ShieldCheck,
  Timer,
  Trophy,
  User,
  UserRound,
} from "lucide-react";

import ModeBanner from "@/components/ModeBanner";
import { QUESTION_TIME_SECONDS, QUESTIONS_PER_RUN, STARTING_LIVES } from "@/lib/config";
import { fetchStudents } from "@/lib/data";
import { useStudentSession } from "@/lib/hooks";
import { clearStudentSession, loginProfessor, saveStudentSession } from "@/lib/session";
import type { Student } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

type Role = "student" | "professor";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pr-4 pl-11 text-white placeholder:text-slate-500 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40";

export default function LoginPage() {
  const router = useRouter();
  const { session: existingStudent, loading: sessionLoading } = useStudentSession();

  const [role, setRole] = useState<Role>("student");

  // Student form
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentError, setStudentError] = useState<string | null>(null);
  const [checkingStudent, setCheckingStudent] = useState(false);

  // Professor form
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [professorError, setProfessorError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Allow /?role=professor deep-links (used by the /admin guard) without
  // useSearchParams, avoiding an extra Suspense boundary.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("role") === "professor") {
      setRole("professor");
    }
  }, []);

  async function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = studentName.trim();
    const id = studentId.trim();
    if (name.length < 3) {
      setStudentError("Please enter your full name (at least 3 characters).");
      return;
    }
    if (id.length < 2) {
      setStudentError("Please enter your student ID number.");
      return;
    }

    setStudentError(null);
    setCheckingStudent(true);
    try {
      // Roster gate: while the professor's roster is empty anyone may join.
      // Once students are registered, only a matching name + ID pair gets in.
      // If the roster cannot be loaded (e.g. table not created yet), we fall
      // back to open join instead of locking every student out.
      let roster: Student[] = [];
      try {
        roster = await fetchStudents();
      } catch {
        roster = [];
      }

      if (roster.length > 0) {
        const registered = roster.find(
          (s) => normalizeText(s.student_id) === normalizeText(id),
        );
        if (!registered) {
          setStudentError(
            "This Student ID is not registered. Please ask your professor to add you to the class list.",
          );
          return;
        }
        if (normalizeText(registered.full_name) !== normalizeText(name)) {
          setStudentError(
            "The name does not match the registered name for this Student ID. Type your name exactly as your professor registered it.",
          );
          return;
        }
        // Use the registered (canonical) name/ID for a clean leaderboard.
        saveStudentSession({ name: registered.full_name, studentId: registered.student_id });
      } else {
        saveStudentSession({ name, studentId: id });
      }
      router.push("/game");
    } finally {
      setCheckingStudent(false);
    }
  }

  async function handleProfessorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfessorError(null);
    setLoggingIn(true);
    try {
      await loginProfessor(username, passcode);
      router.push("/admin");
    } catch (err) {
      setProfessorError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setLoggingIn(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ModeBanner />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-xl shadow-indigo-500/30">
          <GraduationCap className="h-9 w-9 text-white" />
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Lecture <span className="text-transparent bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text">Survivor</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          The survival quiz challenge for university students. Answer lecture questions against
          the clock, protect your hearts, and climb the class leaderboard.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-medium text-rose-300">
            <Heart className="h-4 w-4 fill-rose-400 text-rose-400" /> {STARTING_LIVES} lives
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-300">
            <Timer className="h-4 w-4" /> {QUESTION_TIME_SECONDS}s per question
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-medium text-amber-300">
            <Trophy className="h-4 w-4" /> {QUESTIONS_PER_RUN} questions to glory
          </span>
        </div>
      </div>

      {/* ── Welcome back (returning student) ────────────────────────────── */}
      {!sessionLoading && existingStudent && role === "student" && (
        <div className="animate-fade-up mx-auto mt-8 flex max-w-md flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-4">
          <p className="text-sm text-indigo-200">
            Welcome back, <span className="font-bold text-white">{existingStudent.name}</span>{" "}
            <span className="text-indigo-300/70">(ID {existingStudent.studentId})</span>
          </p>
          <div className="flex gap-2">
            <Link
              href="/game"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Play className="h-4 w-4" /> Continue
            </Link>
            <button
              type="button"
              onClick={() => {
                clearStudentSession();
                window.location.reload();
              }}
              className="rounded-lg border border-slate-600 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Switch player
            </button>
          </div>
        </div>
      )}

      {/* ── Login card ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up mx-auto mt-8 max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl sm:p-8">
        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-950/80 p-1" role="tablist" aria-label="Choose your role">
          <button
            type="button"
            role="tab"
            aria-selected={role === "student"}
            onClick={() => setRole("student")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition",
              role === "student"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow"
                : "text-slate-400 hover:text-white",
            )}
          >
            <UserRound className="h-5 w-5" /> Student
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "professor"}
            onClick={() => setRole("professor")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition",
              role === "professor"
                ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow"
                : "text-slate-400 hover:text-white",
            )}
          >
            <ShieldCheck className="h-5 w-5" /> Professor
          </button>
        </div>

        {role === "student" ? (
          <form onSubmit={handleStudentSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="student-name" className="mb-1.5 block text-sm font-medium text-slate-300">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="student-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Sara Ahmed"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="student-id" className="mb-1.5 block text-sm font-medium text-slate-300">
                Student ID number (رقم القيد)
              </label>
              <div className="relative">
                <IdCard className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="student-id"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="e.g. 2201045"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {studentError && (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
                {studentError}
              </p>
            )}

            <button
              type="submit"
              disabled={checkingStudent}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {checkingStudent ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-white" />
              )}
              {checkingStudent ? "Checking…" : "Enter the challenge"}
            </button>
            <p className="text-center text-xs text-slate-500">
              Use the name and Student ID your professor registered for you — they appear on
              the leaderboard.
            </p>
          </form>
        ) : (
          <form onSubmit={handleProfessorSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="prof-username" className="mb-1.5 block text-sm font-medium text-slate-300">
                UserName
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="prof-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="prof-passcode" className="mb-1.5 block text-sm font-medium text-slate-300">
                PassCode
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="prof-passcode"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {professorError && (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
                {professorError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 py-3.5 font-bold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {loggingIn ? "Signing in…" : "Open admin dashboard"}
            </button>
            <p className="text-center text-xs text-slate-500">
              Professors manage questions and view student results from the dashboard.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
