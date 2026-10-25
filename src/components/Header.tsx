import Link from "next/link";
import { Gamepad2, GraduationCap, ShieldCheck, Trophy } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-500/25">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg">
            Lecture <span className="text-rose-400">Survivor</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/game"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3"
          >
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Play</span>
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Professor</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
