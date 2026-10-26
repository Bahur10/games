/**
 * Session handling.
 *
 * • Students have no password — their name + student ID are kept in
 *   localStorage so a page refresh mid-game doesn't kick them out.
 * • Professors sign in with a UserName + PassCode. Because Supabase Auth
 *   accounts are email-based, the UserName is mapped internally to a
 *   hidden email address ("<username>@lecture-survivor.com") and the
 *   PassCode is used as that account's password. The professor account is
 *   created once in the Supabase dashboard (Authentication → Users) with
 *   exactly that email + password, so the real name/code never appear in
 *   this codebase or in the UI. Typing a full email into the UserName
 *   field also works (it is used as-is).
 * • In demo mode (no Supabase env vars) a single built-in UserName +
 *   PassCode pair is accepted instead (see .env.example).
 *
 * IMPORTANT (hydration): these helpers touch `window`, so only call them
 * from event handlers or useEffect — never during render.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import type { StudentSession } from "./types";

const STUDENT_KEY = "lecture-survivor:student";
const DEMO_ADMIN_KEY = "lecture-survivor:demo-admin";

/** Internal domain used to map a professor UserName to a Supabase Auth email. */
const PROFESSOR_EMAIL_DOMAIN = "lecture-survivor.com";

export const DEMO_ADMIN_USERNAME =
  process.env.NEXT_PUBLIC_DEMO_ADMIN_USERNAME ?? "professor";
export const DEMO_ADMIN_PASSCODE =
  process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSCODE ?? "admin123";

/** Map a typed UserName to the Supabase Auth email for that account. */
function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  // A full email typed into the UserName field is used as-is.
  if (normalized.includes("@")) return normalized;
  return `${normalized.replace(/\s+/g, "")}@${PROFESSOR_EMAIL_DOMAIN}`;
}

/** Display name for the signed-in professor (the UserName part of the email). */
function toDisplayName(value: string): string {
  const at = value.indexOf("@");
  return at > 0 ? value.slice(0, at) : value;
}

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
/** Returns the signed-in professor's UserName, or null. */
export async function getProfessorUsername(): Promise<string | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;
    return email ? toDisplayName(email) : null;
  }
  try {
    const stored = window.localStorage.getItem(DEMO_ADMIN_KEY);
    return stored ? toDisplayName(stored) : null;
  } catch {
    return null;
  }
}

/** Throws an Error with a user-friendly message when login fails. */
export async function loginProfessor(username: string, passcode: string): Promise<void> {
  const name = username.trim();
  if (!name) throw new Error("Please enter your UserName.");
  if (!passcode) throw new Error("Please enter your PassCode.");

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(name),
      password: passcode,
    });
    if (error) {
      throw new Error(
        error.message.toLowerCase().includes("invalid login credentials")
          ? "Invalid UserName or PassCode."
          : error.message,
      );
    }
    return;
  }
  // Demo mode: single built-in (but env-overridable) credential pair.
  if (
    name.toLowerCase() === DEMO_ADMIN_USERNAME.toLowerCase() &&
    passcode === DEMO_ADMIN_PASSCODE
  ) {
    try {
      window.localStorage.setItem(DEMO_ADMIN_KEY, name);
    } catch {
      // ignore storage errors
    }
    return;
  }
  throw new Error("Invalid UserName or PassCode.");
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
