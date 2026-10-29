import { shuffle } from "./games.ts";
import type { Question } from "./quiz.ts";

/** Open Trivia DB categories (CC BY-SA 4.0, free, no key) */
export const TRIVIA_CATEGORIES: readonly { id: number; name: string }[] = [
  { id: 0, name: "Any" },
  { id: 9, name: "General knowledge" },
  { id: 22, name: "Geography" },
  { id: 23, name: "History" },
  { id: 21, name: "Sport" },
  { id: 11, name: "Film" },
  { id: 12, name: "Music" },
  { id: 14, name: "Television" },
  { id: 17, name: "Science and nature" },
  { id: 27, name: "Animals" },
  { id: 10, name: "Books" },
  { id: 15, name: "Video games" },
  { id: 25, name: "Art" },
  { id: 20, name: "Mythology" },
];

interface TriviaResult {
  type: "multiple" | "boolean";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

/** Open Trivia DB sends HTML entities; the parser decodes them without running anything */
const plain = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").documentElement.textContent ?? "";

export function toQuestion(r: TriviaResult, random = Math.random): Question {
  return {
    prompt: plain(r.question),
    answer: plain(r.correct_answer),
    choices:
      r.type === "boolean"
        ? ["True", "False"]
        : shuffle([r.correct_answer, ...r.incorrect_answers], random).map(plain),
  };
}

export async function fetchTrivia(
  amount: number,
  category: number,
  difficulty: "" | "easy" | "medium" | "hard"
): Promise<Question[]> {
  const params = new URLSearchParams({ amount: String(amount) });
  if (category) params.set("category", String(category));
  if (difficulty) params.set("difficulty", difficulty);
  const res = await fetch(`https://opentdb.com/api.php?${params}`);
  if (!res.ok) throw new Error(`Open Trivia DB ${res.status}`);
  const body: { response_code: number; results: TriviaResult[] } = await res.json();
  if (body.response_code !== 0) throw new Error("Not enough questions for that mix: try Any");
  return body.results.map((r) => toQuestion(r));
}
