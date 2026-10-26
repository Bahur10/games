/**
 * Data-access layer.
 *
 * Every screen talks to these functions only — never to Supabase or
 * localStorage directly. When the Supabase env vars are set, queries go to
 * Postgres; otherwise the app runs in DEMO MODE backed by localStorage,
 * seeded with sample questions so it works with zero setup.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { SEED_QUESTIONS } from "./seed";
import { normalizeText } from "./utils";
import type {
  Question,
  QuestionInput,
  ScoreInput,
  Student,
  StudentInput,
  StudentScore,
} from "./types";

// ─── Demo-mode storage helpers ─────────────────────────────────────────────
const QUESTIONS_KEY = "lecture-survivor:questions:v1";
const SCORES_KEY = "lecture-survivor:scores:v1";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / unavailable (private mode) — fail silently.
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getLocalQuestions(): Question[] {
  const stored = readLocal<Question[] | null>(QUESTIONS_KEY, null);
  if (stored === null) {
    writeLocal(QUESTIONS_KEY, SEED_QUESTIONS);
    return [...SEED_QUESTIONS];
  }
  return stored;
}

function getLocalScores(): StudentScore[] {
  return readLocal<StudentScore[]>(SCORES_KEY, []);
}

function sortByScoreDesc(scores: StudentScore[]): StudentScore[] {
  return [...scores].sort(
    (a, b) => b.score - a.score || a.completed_at.localeCompare(b.completed_at),
  );
}

/** Unwrap a Supabase response or throw a readable Error. */
function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned from the database.");
  return result.data;
}

// ─── Questions ─────────────────────────────────────────────────────────────
export async function fetchQuestions(): Promise<Question[]> {
  if (!isSupabaseConfigured || !supabase) return getLocalQuestions();
  const data = unwrap(
    await supabase.from("questions").select("*").order("created_at", { ascending: true }),
  );
  // `options` is jsonb — Supabase returns it already parsed as an array.
  return data as Question[];
}

export async function createQuestion(input: QuestionInput): Promise<Question> {
  if (!isSupabaseConfigured || !supabase) {
    const question: Question = {
      ...input,
      id: newId(),
      created_at: new Date().toISOString(),
    };
    writeLocal(QUESTIONS_KEY, [...getLocalQuestions(), question]);
    return question;
  }
  const rows = unwrap(
    await supabase.from("questions").insert(input).select("*"),
  ) as Question[];
  return rows[0];
}

export async function updateQuestion(id: string, input: QuestionInput): Promise<Question> {
  if (!isSupabaseConfigured || !supabase) {
    const questions = getLocalQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error("Question not found.");
    const updated: Question = { ...questions[index], ...input };
    questions[index] = updated;
    writeLocal(QUESTIONS_KEY, questions);
    return updated;
  }
  const rows = unwrap(
    await supabase.from("questions").update(input).eq("id", id).select("*"),
  ) as Question[];
  if (rows.length === 0) throw new Error("Question not found or not permitted.");
  return rows[0];
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    writeLocal(
      QUESTIONS_KEY,
      getLocalQuestions().filter((q) => q.id !== id),
    );
    return;
  }
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Demo mode only: restore the 10 sample questions. */
export async function resetDemoQuestions(): Promise<Question[]> {
  writeLocal(QUESTIONS_KEY, SEED_QUESTIONS);
  return [...SEED_QUESTIONS];
}

// ─── Scores ────────────────────────────────────────────────────────────────
export async function fetchScores(limit = 200): Promise<StudentScore[]> {
  if (!isSupabaseConfigured || !supabase) {
    return sortByScoreDesc(getLocalScores()).slice(0, limit);
  }
  const data = unwrap(
    await supabase
      .from("student_scores")
      .select("*")
      .order("score", { ascending: false })
      .order("completed_at", { ascending: true })
      .limit(limit),
  );
  return data as StudentScore[];
}

export async function submitScore(input: ScoreInput): Promise<StudentScore> {
  if (!isSupabaseConfigured || !supabase) {
    const score: StudentScore = {
      ...input,
      id: newId(),
      completed_at: new Date().toISOString(),
    };
    writeLocal(SCORES_KEY, [...getLocalScores(), score]);
    return score;
  }
  const rows = unwrap(
    await supabase.from("student_scores").insert(input).select("*"),
  ) as StudentScore[];
  return rows[0];
}

export async function deleteScore(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    writeLocal(
      SCORES_KEY,
      getLocalScores().filter((s) => s.id !== id),
    );
    return;
  }
  const { error } = await supabase.from("student_scores").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function clearAllScores(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    writeLocal(SCORES_KEY, []);
    return;
  }
  // PostgREST requires a filter for DELETE; `neq` on a nil UUID matches all rows.
  const { error } = await supabase
    .from("student_scores")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(error.message);
}

// ─── Students (class roster) ───────────────────────────────────────────────
const STUDENTS_KEY = "lecture-survivor:students:v1";

function getLocalStudents(): Student[] {
  return readLocal<Student[]>(STUDENTS_KEY, []);
}

/** Alphabetical by name (then ID) — stable order for the admin table. */
export function sortStudents(students: Student[]): Student[] {
  return [...students].sort(
    (a, b) =>
      a.full_name.localeCompare(b.full_name) || a.student_id.localeCompare(b.student_id),
  );
}

function cleanStudentInput(input: StudentInput): StudentInput {
  return { full_name: input.full_name.trim(), student_id: input.student_id.trim() };
}

function assertIdAvailable(
  students: Student[],
  studentId: string,
  excludeId: string | null = null,
): void {
  const clash = students.find(
    (s) => s.id !== excludeId && normalizeText(s.student_id) === normalizeText(studentId),
  );
  if (clash) {
    throw new Error(`Student ID "${studentId}" is already registered for ${clash.full_name}.`);
  }
}

/** Map a Postgres unique-violation to a friendly, consistent message. */
function friendlyStudentError(message: string): Error {
  return new Error(
    message.toLowerCase().includes("duplicate key")
      ? "This Student ID is already registered."
      : message,
  );
}

export async function fetchStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured || !supabase) return sortStudents(getLocalStudents());
  const data = unwrap(
    await supabase.from("students").select("*").order("full_name", { ascending: true }),
  );
  return data as Student[];
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const clean = cleanStudentInput(input);
  if (!isSupabaseConfigured || !supabase) {
    const students = getLocalStudents();
    assertIdAvailable(students, clean.student_id);
    const student: Student = { ...clean, id: newId(), created_at: new Date().toISOString() };
    writeLocal(STUDENTS_KEY, [...students, student]);
    return student;
  }
  const { data, error } = await supabase.from("students").insert(clean).select("*");
  if (error) throw friendlyStudentError(error.message);
  return (data as Student[])[0];
}

export async function updateStudent(id: string, input: StudentInput): Promise<Student> {
  const clean = cleanStudentInput(input);
  if (!isSupabaseConfigured || !supabase) {
    const students = getLocalStudents();
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Student not found.");
    assertIdAvailable(students, clean.student_id, id);
    const updated: Student = { ...students[index], ...clean };
    students[index] = updated;
    writeLocal(STUDENTS_KEY, students);
    return updated;
  }
  const { data, error } = await supabase
    .from("students")
    .update(clean)
    .eq("id", id)
    .select("*");
  if (error) throw friendlyStudentError(error.message);
  const rows = data as Student[];
  if (rows.length === 0) throw new Error("Student not found or not permitted.");
  return rows[0];
}

export async function deleteStudent(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    writeLocal(
      STUDENTS_KEY,
      getLocalStudents().filter((s) => s.id !== id),
    );
    return;
  }
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface BulkStudentsResult {
  added: Student[];
  /** Entries skipped because the Student ID was already on the roster (or repeated). */
  skipped: number;
}

/** Add many students at once, silently skipping duplicate Student IDs. */
export async function createStudentsBulk(inputs: StudentInput[]): Promise<BulkStudentsResult> {
  const existing = await fetchStudents();
  const seen = new Set(existing.map((s) => normalizeText(s.student_id)));
  const fresh: StudentInput[] = [];
  let skipped = 0;

  for (const raw of inputs) {
    const clean = cleanStudentInput(raw);
    const key = normalizeText(clean.student_id);
    if (!clean.full_name || !clean.student_id || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    fresh.push(clean);
  }

  if (fresh.length === 0) return { added: [], skipped };

  if (!isSupabaseConfigured || !supabase) {
    const now = new Date().toISOString();
    const added: Student[] = fresh.map((s) => ({ ...s, id: newId(), created_at: now }));
    writeLocal(STUDENTS_KEY, [...getLocalStudents(), ...added]);
    return { added, skipped };
  }
  const { data, error } = await supabase.from("students").insert(fresh).select("*");
  if (error) throw friendlyStudentError(error.message);
  return { added: data as Student[], skipped };
}
