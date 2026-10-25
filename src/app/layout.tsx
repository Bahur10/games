import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lecture Survivor — Survive the Lecture Quiz",
  description:
    "An interactive survival quiz game for university students: 3 lives, 10 seconds per question. How long can you survive?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
        {/* Decorative background glow */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(244,63,94,0.10),transparent_50%)]"
        />
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
          <footer className="border-t border-slate-800/70 py-5 text-center text-sm text-slate-500">
            Lecture Survivor — answer fast, protect your hearts, top the leaderboard.
          </footer>
        </div>
      </body>
    </html>
  );
}
