"use client";

import { useEffect, useState } from "react";
import { getProfessorUsername, getStudentSession } from "./session";
import type { StudentSession } from "./types";

/**
 * Reads the student session on the client only.
 * `loading` stays true until the first client render completes, which is
 * what prevents React hydration mismatches (server HTML vs. localStorage).
 */
export function useStudentSession(): { session: StudentSession | null; loading: boolean } {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getStudentSession());
    setLoading(false);
  }, []);

  return { session, loading };
}

/** Same pattern for the professor; Supabase session lookup is async. */
export function useProfessor(): { username: string | null; loading: boolean } {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfessorUsername()
      .then((value) => {
        if (!cancelled) setUsername(value);
      })
      .catch(() => {
        if (!cancelled) setUsername(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { username, loading };
}
