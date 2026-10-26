/** Shared domain types for Lecture Survivor. */

/** A quiz question as stored in the `questions` table. */
export interface Question {
  id: string;
  question_text: string;
  /** Exactly 4 answer options. */
  options: string[];
  /** 0-based index (0–3) of the correct option. */
  correct_option_index: number;
  /** Shown to the student after a wrong answer or a timeout. */
  explanation: string;
  created_at: string;
}

/** Payload used when the professor creates / edits a question. */
export type QuestionInput = Pick<
  Question,
  "question_text" | "options" | "correct_option_index" | "explanation"
>;

/** One finished game attempt, stored in `student_scores`. */
export interface StudentScore {
  id: string;
  student_name: string;
  student_id: string | null;
  score: number;
  lives_left: number;
  correct_answers: number;
  completed_at: string;
}

/** Payload used when a student finishes a run. */
export type ScoreInput = Pick<
  StudentScore,
  "student_name" | "student_id" | "score" | "lives_left" | "correct_answers"
>;

/** The lightweight student session kept in the browser. */
export interface StudentSession {
  name: string;
  studentId: string;
}

/** One registered student on the class roster, stored in `students`. */
export interface Student {
  id: string;
  full_name: string;
  /** رقم القيد — the code the student types together with their name to log in. */
  student_id: string;
  created_at: string;
}

/** Payload used when the professor adds / edits a roster entry. */
export type StudentInput = Pick<Student, "full_name" | "student_id">;
