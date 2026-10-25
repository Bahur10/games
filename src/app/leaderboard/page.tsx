"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Play, RefreshCw, Trophy } from "lucide-react";

import LeaderboardTable from "@/components/LeaderboardTable";
import ModeBanner from "@/components/ModeBanner";
import { fetchScores } from "@/lib/data";
import type { StudentScore } from "@/lib/types";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScores(await fetchScores(100));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <ModeBanner />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-3xl font-extrabold text-white">
          <Trophy className="h-8 w-8 text-amber-400" />
          Leaderboard
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <Link
            href="/game"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 px-3.5 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            <Play className="h-4 w-4 fill-white" /> Play now
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
          <Loader2 className="h-9 w-9 animate-spin" />
          <p>Loading top survivors…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-200">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
          <p className="mt-2">{error}</p>
        </div>
      ) : (
        <LeaderboardTable scores={scores} showDate />
      )}
    </div>
  );
}
