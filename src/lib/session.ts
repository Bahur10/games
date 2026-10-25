/**
 * Session handling.
 *
 * • Students have no password — their name + student ID are kept in
 *   localStorage so a page refresh mid-game doesn't kick them out.
 * • Professors authenticate with Supabase Auth in production. In demo mode
 *   a single built-in credential pair is accepted instead.
 *
 * IMPORTANT (hydration): these helpers touch `window`, so only call them
 * from event handlers or useEffect — never during render.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import type { StudentSession } from "./types";

const STUDENT_KEY = "lecture-survivor:student";
const DEMO_ADMIN_KEY = "lecture-survivor:demo-admin";

export const DEMO_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "professor@example.com";
export const DEMO_ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? "admin123";

// ─── Student session ───────────────────────────────────────────────────────
export function saveStudentSession(session: StudentSession): void {
  try {
    window.localStorage.setItem(STUDENT_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors
  }
}

export function getStudentSession(): StudentSession | null {
  try {
    const raw = window.localStorage.getItem(STUDENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudentSession>;
    if (typeof parsed.name === "string" && typeof parsed.studentId === "string") {
      return { name: parsed.name, studentId: parsed.studentId };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearStudentSession(): void {
  try {
    window.localStorage.removeItem(STUDENT_KEY);
  } catch {
    // ignore storage errors
  }
}

// ─── Professor session ─────────────────────────────────────────────────────
/** Returns the signed-in professor's email, or null. */
export async function getProfessorEmail(): Promise<string | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.email ?? null;
  }
  try {
    return window.localStorage.getItem(DEMO_ADMIN_KEY);
  } catch {
    return null;
  }
}

/** Throws an Error with a user-friendly message when login fails. */
export async function loginProfessor(email: string, password: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return;
  }
  // Demo mode: single hard-coded (but env-overridable) credential pair.
  if (email.trim().toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase() && password === DEMO_ADMIN_PASSWORD) {
    try {
      window.localStorage.setItem(DEMO_ADMIN_KEY, DEMO_ADMIN_EMAIL);
    } catch {
      // ignore storage errors
    }
    return;
  }
  throw new Error("Invalid email or password.");
}

export async function logoutProfessor(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  try {
    window.localStorage.removeItem(DEMO_ADMIN_KEY);
  } catch {
    // ignore storage errors
  }
}
