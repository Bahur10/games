-- ═══════════════════════════════════════════════════════════════════════════
--  Lecture Survivor — Supabase Database Schema
-- ═══════════════════════════════════════════════════════════════════════════
--  How to run:
--    1. Open your Supabase project → SQL Editor → "New query"
--    2. Paste this whole file and click "Run"
--    3. Create the professor account: Authentication → Users → "Add user"
--       (email + password). That account is the only one allowed to
--       add / edit / delete questions from the /admin dashboard.
--
--  This script is safe to run more than once (tables, policies and the
--  seed questions are only created when missing).
-- ═══════════════════════════════════════════════════════════════════════════

-- pgcrypto gives us gen_random_uuid() for primary keys.
create extension if not exists "pgcrypto";

-- ─── 1) Questions ──────────────────────────────────────────────────────────
create table if not exists public.questions (
  id                   uuid primary key default gen_random_uuid(),
  question_text        text not null check (char_length(trim(question_text)) > 0),
  -- Exactly 4 answer options, stored as a JSON array of strings,
  -- e.g. '["Paris", "London", "Berlin", "Madrid"]'::jsonb
  options              jsonb not null
                         check (
                           jsonb_typeof(options) = 'array'
                           and jsonb_array_length(options) = 4
                         ),
  -- 0-based index of the correct option (0 = first option … 3 = fourth)
  correct_option_index int not null check (correct_option_index between 0 and 3),
  -- Short explanation shown to the student after a wrong answer / timeout
  explanation          text not null default '',
  created_at           timestamptz not null default now()
);

-- ─── 2) Student scores ─────────────────────────────────────────────────────
--  Note: `student_id` (رقم القيد) and `correct_answers` were added on top of
--  the requested columns so the professor can identify students in results.
create table if not exists public.student_scores (
  id              uuid primary key default gen_random_uuid(),
  student_name    text not null check (char_length(trim(student_name)) > 0),
  student_id      text,
  score           int not null default 0 check (score >= 0),
  lives_left      int not null default 0 check (lives_left between 0 and 3),
  correct_answers int not null default 0 check (correct_answers >= 0),
  completed_at    timestamptz not null default now()
);

-- ─── 3) Indexes (leaderboard + chronological listing) ──────────────────────
create index if not exists idx_questions_created_at
  on public.questions (created_at asc);

create index if not exists idx_student_scores_score
  on public.student_scores (score desc, completed_at asc);

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security (RLS)
--  • Students use the public "anon" key: they may READ questions, SUBMIT a
--    score and READ the leaderboard — nothing else.
--  • The professor signs in through Supabase Auth ("authenticated" role)
--    and may manage questions and delete scores.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.questions      enable row level security;
alter table public.student_scores enable row level security;

-- Drop old versions of the policies so re-running this file never fails.
drop policy if exists "Questions are viewable by everyone"  on public.questions;
drop policy if exists "Professors can insert questions"     on public.questions;
drop policy if exists "Professors can update questions"     on public.questions;
drop policy if exists "Professors can delete questions"     on public.questions;
drop policy if exists "Scores are viewable by everyone"     on public.student_scores;
drop policy if exists "Anyone can submit a score"           on public.student_scores;
drop policy if exists "Professors can delete scores"        on public.student_scores;

-- Questions policies
create policy "Questions are viewable by everyone"
  on public.questions for select
  using (true);

create policy "Professors can insert questions"
  on public.questions for insert
  to authenticated
  with check (true);

create policy "Professors can update questions"
  on public.questions for update
  to authenticated
  using (true)
  with check (true);

create policy "Professors can delete questions"
  on public.questions for delete
  to authenticated
  using (true);

-- Scores policies
create policy "Scores are viewable by everyone"
  on public.student_scores for select
  using (true);

create policy "Anyone can submit a score"
  on public.student_scores for insert
  with check (true);

create policy "Professors can delete scores"
  on public.student_scores for delete
  to authenticated
  using (true);

-- ═══════════════════════════════════════════════════════════════════════════
--  Seed: 10 sample lecture questions (inserted only if the table is empty).
--  Replace them with your own lecture questions from the /admin dashboard.
-- ═══════════════════════════════════════════════════════════════════════════
with seed (question_text, options, correct_option_index, explanation) as (
  values
    (
      'In a relational database, what uniquely identifies each row in a table?',
      '["Foreign Key", "Primary Key", "Index", "Schema"]'::jsonb,
      1,
      'A primary key uniquely identifies every row in a table and cannot contain NULL values.'
    ),
    (
      'Which SQL statement is used to retrieve data from a database?',
      '["UPDATE", "INSERT", "SELECT", "DELETE"]'::jsonb,
      2,
      'SELECT is the Data Query Language statement used to read rows from one or more tables.'
    ),
    (
      'What does the HTTP status code 404 mean?',
      '["Server Error", "Not Found", "Unauthorized", "Moved Permanently"]'::jsonb,
      1,
      '404 Not Found means the server could not find the requested resource.'
    ),
    (
      'Which normal form requires that each column contains only atomic (indivisible) values?',
      '["First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form"]'::jsonb,
      0,
      '1NF requires atomic values in every column and no repeating groups.'
    ),
    (
      'In the client-server model, who initiates the communication?',
      '["The server", "The database", "The router", "The client"]'::jsonb,
      3,
      'The client always initiates a request; the server listens and responds.'
    ),
    (
      'What is the time complexity of binary search on a sorted array?',
      '["O(n)", "O(log n)", "O(n log n)", "O(1)"]'::jsonb,
      1,
      'Binary search halves the search space on every step, giving O(log n) time.'
    ),
    (
      'Which data structure follows the LIFO (Last-In, First-Out) principle?',
      '["Queue", "Linked List", "Stack", "Graph"]'::jsonb,
      2,
      'A stack pushes and pops from the same end, so the last element in is the first one out.'
    ),
    (
      'What does JSON stand for?',
      '["Java Standard Object Network", "JavaScript Object Notation", "Joined Strings Over Network", "Java Serialized Object Names"]'::jsonb,
      1,
      'JSON is JavaScript Object Notation, a lightweight text format for data interchange.'
    ),
    (
      'In an Entity-Relationship (ER) diagram, what does a diamond shape represent?',
      '["An entity", "An attribute", "A primary key", "A relationship"]'::jsonb,
      3,
      'Diamonds represent relationships between entities; rectangles are entities and ovals are attributes.'
    ),
    (
      'Which SQL clause is used to filter the results of a GROUP BY?',
      '["WHERE", "ORDER BY", "HAVING", "LIMIT"]'::jsonb,
      2,
      'HAVING filters groups after aggregation, while WHERE filters rows before grouping.'
    )
)
insert into public.questions (question_text, options, correct_option_index, explanation)
select question_text, options, correct_option_index, explanation
from seed
where not exists (select 1 from public.questions);

-- ═══════════════════════════════════════════════════════════════════════════
--  Security note (optional hardening):
--  Because students read the `questions` table directly, a technical
--  student could inspect the network response and see
--  `correct_option_index`. For a classroom challenge this is usually fine.
--  If you need graded/exam-level integrity, hide the answer behind an RPC
--  function that checks the answer server-side instead.
-- ═══════════════════════════════════════════════════════════════════════════
