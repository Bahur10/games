"use client";

import Link from "next/link";
import { Home, RotateCcw, Skull, Trophy } from "lucide-react";
import type { StudentScore } from "@/lib/types";
import LeaderboardTable from "@/components/LeaderboardTable";
import Hearts from "./Hearts";

interface ResultScreenProps {
  studentName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  livesLeft: number;
  leaderboard: StudentScore[];
  myScoreId: string | null;
  onPlayAgain: () => void;
}

export default function ResultScreen({
  studentName,
  score,
  correctCount,
  totalQuestions,
  livesLeft,
  leaderboard,
  myScoreId,
  onPlayAgain,
}: ResultScreenProps) {
  const survived = livesLeft > 0;

  return (
    <div className="animate-pop-in">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center shadow-2xl sm:p-10">
        <div
          className={
            survived
              ? "mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.25)]"
              : "mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.25)]"
          }
        >
          {survived ? <Trophy className="h-10 w-10" /> : <Skull className="h-10 w-10" />}
        </div>

        <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
          {survived ? "🎉 You Survived the Lecture!" : "💀 Game Over"}
        </h2>
        <p className="mt-2 text-slate-400">
          {survived
            ? `Great job, ${studentName.split(" ")[0]}! You made it to the end of the challenge.`
            : `The lecture defeated you this time, ${studentName.split(" ")[0]}. Review the explanations and try again!`}
        </p>

        <p className="mt-6 text-6xl font-black tracking-tight text-transparent tabular-nums bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text">
          {score.toLocaleString()}
        </p>
        <p className="mt-1 text-sm font-semibold tracking-widest text-slate-500 uppercase">Final score</p>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-lg font-bold text-white tabular-nums">
              {correctCount}/{totalQuestions}
            </p>
            <p className="text-xs text-slate-500">Correct</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex justify-center py-1">
              <Hearts lives={livesLeft} size="sm" />
            </div>
            <p className="text-xs text-slate-500">Lives left</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-lg font-bold text-white tabular-nums">
              {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500">Accuracy</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-95"
          >
            <RotateCcw className="h-5 w-5" />
            Play again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <Home className="h-5 w-5" />
            Home
          </Link>
        </div>
      </div>

      <h3 className="mt-10 mb-4 flex items-center gap-2 text-xl font-bold text-white">
        <Trophy className="h-5 w-5 text-amber-400" />
        Top Survivors
      </h3>
      <LeaderboardTable scores={leaderboard.slice(0, 10)} highlightId={myScoreId} />
      <p className="mt-3 text-right">
        <Link href="/leaderboard" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
          View full leaderboard →
        </Link>
      </p>
    </div>
  );
}
