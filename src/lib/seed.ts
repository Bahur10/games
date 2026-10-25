import type { Question } from "./types";

/**
 * Sample lecture questions used to seed DEMO MODE (localStorage).
 * They mirror the seed rows in `supabase/schema.sql` — the professor can
 * delete/replace them from the /admin dashboard.
 */
export const SEED_QUESTIONS: Question[] = [
  {
    id: "seed-1",
    question_text: "In a relational database, what uniquely identifies each row in a table?",
    options: ["Foreign Key", "Primary Key", "Index", "Schema"],
    correct_option_index: 1,
    explanation:
      "A primary key uniquely identifies every row in a table and cannot contain NULL values.",
    created_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "seed-2",
    question_text: "Which SQL statement is used to retrieve data from a database?",
    options: ["UPDATE", "INSERT", "SELECT", "DELETE"],
    correct_option_index: 2,
    explanation:
      "SELECT is the Data Query Language statement used to read rows from one or more tables.",
    created_at: "2025-01-01T00:00:01.000Z",
  },
  {
    id: "seed-3",
    question_text: "What does the HTTP status code 404 mean?",
    options: ["Server Error", "Not Found", "Unauthorized", "Moved Permanently"],
    correct_option_index: 1,
    explanation: "404 Not Found means the server could not find the requested resource.",
    created_at: "2025-01-01T00:00:02.000Z",
  },
  {
    id: "seed-4",
    question_text:
      "Which normal form requires that each column contains only atomic (indivisible) values?",
    options: [
      "First Normal Form (1NF)",
      "Second Normal Form (2NF)",
      "Third Normal Form (3NF)",
      "Boyce-Codd Normal Form",
    ],
    correct_option_index: 0,
    explanation: "1NF requires atomic values in every column and no repeating groups.",
    created_at: "2025-01-01T00:00:03.000Z",
  },
  {
    id: "seed-5",
    question_text: "In the client-server model, who initiates the communication?",
    options: ["The server", "The database", "The router", "The client"],
    correct_option_index: 3,
    explanation: "The client always initiates a request; the server listens and responds.",
    created_at: "2025-01-01T00:00:04.000Z",
  },
  {
    id: "seed-6",
    question_text: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correct_option_index: 1,
    explanation: "Binary search halves the search space on every step, giving O(log n) time.",
    created_at: "2025-01-01T00:00:05.000Z",
  },
  {
    id: "seed-7",
    question_text: "Which data structure follows the LIFO (Last-In, First-Out) principle?",
    options: ["Queue", "Linked List", "Stack", "Graph"],
    correct_option_index: 2,
    explanation:
      "A stack pushes and pops from the same end, so the last element in is the first one out.",
    created_at: "2025-01-01T00:00:06.000Z",
  },
  {
    id: "seed-8",
    question_text: "What does JSON stand for?",
    options: [
      "Java Standard Object Network",
      "JavaScript Object Notation",
      "Joined Strings Over Network",
      "Java Serialized Object Names",
    ],
    correct_option_index: 1,
    explanation:
      "JSON is JavaScript Object Notation, a lightweight text format for data interchange.",
    created_at: "2025-01-01T00:00:07.000Z",
  },
  {
    id: "seed-9",
    question_text: "In an Entity-Relationship (ER) diagram, what does a diamond shape represent?",
    options: ["An entity", "An attribute", "A primary key", "A relationship"],
    correct_option_index: 3,
    explanation:
      "Diamonds represent relationships between entities; rectangles are entities and ovals are attributes.",
    created_at: "2025-01-01T00:00:08.000Z",
  },
  {
    id: "seed-10",
    question_text: "Which SQL clause is used to filter the results of a GROUP BY?",
    options: ["WHERE", "ORDER BY", "HAVING", "LIMIT"],
    correct_option_index: 2,
    explanation:
      "HAVING filters groups after aggregation, while WHERE filters rows before grouping.",
    created_at: "2025-01-01T00:00:09.000Z",
  },
];
