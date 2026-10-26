# 🎓 Lecture Survivor — تحدي النجاة في المحاضرة

An interactive survival-quiz web app for university students: **3 lives ❤️, 10 seconds per question ⏱️, 10 lecture questions**. Wrong answer or timeout costs a heart 💔 and shows a short explanation. A built-in **professor dashboard** manages questions and student results.

| | |
|---|---|
| **Frontend** | Next.js (App Router) + React + Tailwind CSS + Lucide Icons |
| **Database & Auth** | Supabase (PostgreSQL + Supabase Auth for the professor) |
| **Hosting** | Vercel |

---

## ✨ Features

**Student side**
- Login with **full name + student ID (رقم القيد)** — no password needed
- 3 hearts, 10-second countdown per question, "Question X of 10" progress
- Scoring: 100 points per correct answer **+ time bonus** (10 pts per second left)
- Wrong answer / timeout → lose a heart + read the explanation before continuing
- Questions **and their options are shuffled** every run
- Final result screen + **leaderboard** of the top survivors

**Professor side (`/admin`, login required)**
- Add / edit / delete questions (question text, 4 options, correct answer, explanation)
- Live table of every question with the correct answer highlighted
- Student results table (name, ID, score, correct answers, lives left, date) with delete / clear-all
- Dashboard stats: question count, attempts, average & highest score

---

## 🚀 Quick start (demo mode — no database needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the app runs immediately in **demo mode**: data is stored in the browser (`localStorage`) and seeded with 10 sample questions.

- **Student:** enter any name + ID and play.
- **Professor (demo):** UserName `professor` / PassCode `admin123`
  (override via `NEXT_PUBLIC_DEMO_ADMIN_USERNAME` / `NEXT_PUBLIC_DEMO_ADMIN_PASSCODE`)

---

## 🗄️ Connect Supabase (production)

### 1 — Create the tables (SQL)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

   It creates:
   - `questions` — `id, question_text, options (jsonb), correct_option_index, explanation, created_at`
   - `student_scores` — `id, student_name, student_id, score, lives_left, correct_answers, completed_at`
   - Row Level Security policies (students: read questions + submit/read scores; professor: full CRUD)
   - 10 seed questions (only inserted if the table is empty — safe to re-run)

### 2 — Create the professor account
The login form asks for a **UserName + PassCode**. Internally the app maps the UserName to the hidden email `<username>@lecture-survivor.com`, so create the account to match:

**Authentication → Users → Add user → Create new user**
- **Email:** `<username>@lecture-survivor.com` — e.g. for UserName `prof.name`, use `prof.name@lecture-survivor.com`
- **Password:** the PassCode the professor will type on the site
- Tick *Auto Confirm User*

The address is internal-only and never receives mail (reset the PassCode from this dashboard if forgotten). The real name/code live only in Supabase Auth — never in the code or UI. Only signed-in users can manage questions.

### 3 — Add the environment variables
Copy `.env.example` to `.env.local` and fill in your project keys
(**Project Settings → API**):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart the dev server — the demo banner disappears and all data now goes to Supabase.

### 4 — Deploy to Vercel
1. Push this repo to GitHub and **Import** it in [vercel.com](https://vercel.com).
2. Add the two env vars above in **Project → Settings → Environment Variables**.
3. Deploy. Done — no build settings to change.

---

## ⚙️ Game rules (easy to tweak)

All rules live in [`src/lib/config.ts`](src/lib/config.ts):

| Setting | Default |
|---|---|
| `QUESTION_TIME_SECONDS` | 10 |
| `STARTING_LIVES` | 3 |
| `QUESTIONS_PER_RUN` | 10 |
| `BASE_POINTS` / `TIME_BONUS_PER_SECOND` | 100 / 10 |

---

## 🧱 Project structure

```
supabase/schema.sql          ← run this in the Supabase SQL Editor
src/
  app/
    page.tsx                 ← login (student / professor)
    game/page.tsx            ← the survival game
    leaderboard/page.tsx     ← public leaderboard
    admin/page.tsx           ← professor dashboard (protected)
  components/
    Header.tsx · ModeBanner.tsx · LeaderboardTable.tsx
    game/  Hearts · TimerBar · QuestionCard · FeedbackPanel · ResultScreen · gameReducer
    admin/ QuestionForm · QuestionsTable · ResultsTable
  lib/
    config.ts    ← game rules
    types.ts     ← Question / StudentScore types
    supabase.ts  ← Supabase client (null in demo mode)
    data.ts      ← data layer: Supabase ⇄ localStorage demo mode
    session.ts   ← student & professor sessions
    hooks.ts     ← hydration-safe session hooks
    seed.ts      ← 10 sample questions for demo mode
    utils.ts     ← shuffle, formatting, classnames
```

**Code-quality notes**
- Screens never touch Supabase/localStorage directly — everything goes through `src/lib/data.ts`, with errors converted to readable messages (no null-pointer surprises).
- Game state is a pure reducer (`components/game/gameReducer.ts`), so the countdown timer can't create stale-closure bugs.
- Sessions are read only inside `useEffect` (`src/lib/hooks.ts`) — no Next.js hydration errors.

---

## 🔒 Security note

RLS is enabled on both tables: the public `anon` key can only **read** questions and **insert/read** scores; creating, editing or deleting questions requires the professor's authenticated session. Because students fetch questions directly, a technically skilled student could inspect the network response to see `correct_option_index` — fine for a classroom challenge; for graded exams, move answer-checking behind a server-side RPC.
