"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  DoorOpen,
  Heart,
  ListChecks,
  Loader2,
  Play,
  Star,
  Timer,
} from "lucide-react";

import { QUESTION_TIME_SECONDS, QUESTIONS_PER_RUN, STARTING_LIVES } from "@/lib/config";
import { fetchQuestions, fetchScores, submitScore } from "@/lib/data";
import { useStudentSession } from "@/lib/hooks";
import type { Question, StudentScore } from "@/lib/types";
import { shuffled, withShuffledOptions } from "@/lib/utils";

import { gameReducer, initialGameState } from "@/components/game/gameReducer";
import FeedbackPanel from "@/components/game/FeedbackPanel";
import Hearts from "@/components/game/Hearts";
import QuestionCard from "@/components/game/QuestionCard";
import ResultScreen from "@/components/game/ResultScreen";
import TimerBar from "@/components/game/TimerBar";
import ModeBanner from "@/components/ModeBanner";

type LoadState = "loading" | "ready" | "empty" | "error";

/** Pick a shuffled subset of questions (with shuffled options) for one run. */
function prepareRun(allQuestions: Question[]): Question[] {
  return shuffled(allQuestions)
    .slice(0, QUESTIONS_PER_RUN)
    .map(withShuffledOptions);
}

export default function GamePage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useStudentSession();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [runQuestions, setRunQuestions] = useState<Question[]>([]);
  const [runId, setRunId] = useState(0);

  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const secondsLeftRef = useRef(QUESTION_TIME_SECONDS);

  const [leaderboard, setLeaderboard] = useState<StudentScore[]>([]);
  const [myScoreId, setMyScoreId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const submittedRunRef = useRef(-1);

  // ── Guard: students must log in first ────────────────────────────────────
  useEffect(() => {
    if (!sessionLoading && !session) router.replace("/");
  }, [sessionLoading, session, router]);

  // ── Load questions once ──────────────────────────────────────────────────
  useEffect(() => {
    if (sessionLoading || !session) return;
    let cancelled = false;
    fetchQuestions()
      .then((questions) => {
        if (cancelled) return;
        setAllQuestions(questions);
        setRunQuestions(prepareRun(questions));
        setLoadState(questions.length > 0 ? "ready" : "empty");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load questions.");
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, session]);

  // ── Countdown timer (runs only while a question is open) ─────────────────
  useEffect(() => {
    if (state.phase !== "playing") return;

    setSecondsLeft(QUESTION_TIME_SECONDS);
    secondsLeftRef.current = QUESTION_TIME_SECONDS;
    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const remaining = QUESTION_TIME_SECONDS - (Date.now() - startedAt) / 1000;
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        secondsLeftRef.current = 0;
        setSecondsLeft(0);
        dispatch({ type: "TIMEOUT" });
      } else {
        secondsLeftRef.current = remaining;
        setSecondsLeft(remaining);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [state.phase, state.index, runId]);

  // ── Correct answers auto-advance; wrong ones wait (read the explanation) ─
  useEffect(() => {
    if (state.phase !== "feedback" || !state.lastCorrect) return;
    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "NEXT", totalQuestions: runQuestions.length });
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [state.phase, state.lastCorrect, runQuestions.length]);

  // ── Save the score exactly once per finished run ─────────────────────────
  useEffect(() => {
    if (state.phase !== "finished" || !session) return;
    if (submittedRunRef.current === runId) return;
    submittedRunRef.current = runId;

    (async () => {
      try {
        const saved = await submitScore({
          student_name: session.name,
          student_id: session.studentId,
          score: state.score,
          lives_left: state.lives,
          correct_answers: state.correctCount,
        });
        setMyScoreId(saved.id);
        setSaveError(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Could not save your score.");
      }
      try {
        setLeaderboard(await fetchScores(50));
      } catch {
        setLeaderboard([]);
      }
    })();
  }, [state.phase, state.score, state.lives, state.correctCount, session, runId]);

  const startRun = useCallback(() => {
    setRunQuestions(prepareRun(allQuestions));
    setRunId((id) => id + 1);
    setMyScoreId(null);
    dispatch({ type: "START" });
  }, [allQuestions]);

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      const question = runQuestions[state.index];
      if (!question) return;
      dispatch({
        type: "ANSWER",
        optionIndex,
        correctIndex: question.correct_option_index,
        secondsLeft: secondsLeftRef.current,
      });
    },
    [runQuestions, state.index],
  );

  // ── Render guards ────────────────────────────────────────────────────────
  if (sessionLoading || !session || loadState === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p>Loading the challenge…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
        <h2 className="mt-3 text-xl font-bold text-white">Could not load questions</h2>
        <p className="mt-2 text-sm text-rose-200/80">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white transition hover:bg-rose-500"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loadState === "empty") {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <ListChecks className="mx-auto h-10 w-10 text-slate-500" />
        <h2 className="mt-3 text-xl font-bold text-white">No questions yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Your professor has not added any lecture questions. Check back after the next lecture!
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-slate-800 px-5 py-2.5 font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const totalQuestions = runQuestions.length;
  const currentQuestion = runQuestions[state.index];
  const isLastQuestion = state.index >= totalQuestions - 1;
  const nextLabel =
    state.lives <= 0 ? "See your result" : isLastQuestion ? "Finish challenge" : "Next question";

  return (
    <div className="mx-auto max-w-3xl">
      <ModeBanner />

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Survivor</p>
          <p className="font-bold text-white">
            {session.name}{" "}
            <span className="text-sm font-medium text-slate-500">· ID {session.studentId}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Hearts lives={state.lives} />
          <div
            key={state.score}
            className="animate-score-pop flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1.5 font-bold text-amber-300 tabular-nums"
          >
            <Star className="h-4 w-4 fill-amber-300" />
            {state.score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── Ready screen ────────────────────────────────────────────────── */}
      {state.phase === "ready" && (
        <div className="animate-fade-up rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center shadow-2xl sm:p-10">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to survive the lecture? 🎓
          </h1>
          <p className="mx-auto mt-3 max-w-md text-slate-400">
            Answer the lecture questions before time runs out. One mistake costs you a heart —
            lose all {STARTING_LIVES} and it&apos;s game over.
          </p>

          <div className="mx-auto mt-7 grid max-w-lg gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-400" />
              <p className="mt-2 font-semibold text-white">{STARTING_LIVES} lives</p>
              <p className="text-sm text-slate-500">Wrong answer or timeout = −1 heart</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <Timer className="h-6 w-6 text-emerald-400" />
              <p className="mt-2 font-semibold text-white">{QUESTION_TIME_SECONDS} seconds</p>
              <p className="text-sm text-slate-500">Per question — faster answers earn bonus points</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <ListChecks className="h-6 w-6 text-indigo-400" />
              <p className="mt-2 font-semibold text-white">{totalQuestions} questions</p>
              <p className="text-sm text-slate-500">Straight from your professor&apos;s lecture</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startRun}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-rose-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-95"
          >
            <Play className="h-6 w-6 fill-white" />
            Start the challenge
          </button>
        </div>
      )}

      {/* ── Playing / feedback ──────────────────────────────────────────── */}
      {(state.phase === "playing" || state.phase === "feedback") && currentQuestion && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-300">
              Question {state.index + 1}{" "}
              <span className="text-slate-500">of {totalQuestions}</span>
            </span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800 sm:w-48">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((state.index + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <TimerBar secondsLeft={state.phase === "playing" ? secondsLeft : 0} />

          <div className="mt-6">
            <QuestionCard
              key={`${runId}-${state.index}`}
              question={currentQuestion}
              selectedIndex={state.selectedIndex}
              revealed={state.phase === "feedback"}
              onAnswer={handleAnswer}
            />
          </div>

          {state.phase === "feedback" && (
            <FeedbackPanel
              correct={state.lastCorrect === true}
              timedOut={state.timedOut}
              points={state.lastPoints}
              explanation={currentQuestion.explanation}
              nextLabel={nextLabel}
              onNext={() => dispatch({ type: "NEXT", totalQuestions })}
            />
          )}

          <div className="mt-6 text-right">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-300"
            >
              <DoorOpen className="h-4 w-4" />
              Quit challenge
            </Link>
          </div>
        </div>
      )}

      {/* ── Finished ────────────────────────────────────────────────────── */}
      {state.phase === "finished" && (
        <>
          {saveError && (
            <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm text-amber-200">
              Your score could not be saved ({saveError}), but your result is below.
            </p>
          )}
          <ResultScreen
            studentName={session.name}
            score={state.score}
            correctCount={state.correctCount}
            totalQuestions={Math.min(state.index + 1, totalQuestions)}
            livesLeft={state.lives}
            leaderboard={leaderboard}
            myScoreId={myScoreId}
            onPlayAgain={startRun}
          />
        </>
      )}
    </div>
  );
}
