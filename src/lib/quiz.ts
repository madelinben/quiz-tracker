export interface Question {
  prompt: string;
  answer: string;
  /** Picture round: any image URL */
  image?: string;
  /** Multiple choice or true/false; empty = open answer */
  choices?: string[];
}

export interface Group {
  name: string;
  items: string[];
}

export interface Clued {
  answer: string;
  /** Hardest first: each clue revealed costs a point */
  clues: string[];
}

interface Base {
  id: string;
  title: string;
}

/** Every format is one of these. Add a kind here and the compiler lists every switch to update. */
export type Round =
  | (Base & { kind: "questions"; questions: Question[] })
  | (Base & { kind: "list"; prompt: string; answers: string[]; ranked: boolean })
  | (Base & { kind: "alphabet"; topic: string })
  | (Base & { kind: "categories"; categories: string[] })
  | (Base & { kind: "connect"; groups: Group[] })
  | (Base & { kind: "clues"; items: Clued[] })
  | (Base & { kind: "imposter"; words: string[]; mystery: boolean })
  | (Base & { kind: "bingo"; cells: string[] })
  | (Base & { kind: "auction"; lots: string[]; budget: number; squad: number });

export type Kind = Round["kind"];

export interface Sale {
  lot: string;
  /** Player or team index */
  buyer: number;
  price: number;
}

/** Host progress for a round: what has been revealed, called or sold */
export interface PlayState {
  revealed?: number[];
  /** Connect: group indexes found, in order */
  found?: number[];
  /** Bingo: cells called; Categories: letters rolled */
  called?: string[];
  sales?: Sale[];
  /** Imposter: seat of the imposter, the words dealt, who speaks first, whether revealed */
  deal?: {
    imposter: number;
    word: string;
    decoy: string | null;
    starter: number;
    unmasked: boolean;
  };
}

export interface Quiz {
  version: 1;
  id: string;
  title: string;
  /** Teams or players: scores, auction bidders and imposter seats all use this list */
  teams: string[];
  rounds: Round[];
  /** roundId → points per team */
  scores: Record<string, number[]>;
  /** team index → the round they play their joker on (points doubled) */
  jokers: Record<number, string>;
  play: Record<string, PlayState>;
  updatedAt: string;
}

export const KINDS: readonly { kind: Kind; label: string; blurb: string }[] = [
  {
    kind: "questions",
    label: "Questions",
    blurb: "Pub quiz, picture, multiple choice, true or false, music, closest wins",
  },
  {
    kind: "list",
    label: "Top 10 / name them all",
    blurb: "One prompt, many answers revealed on a board. Ranked for top 10s or Pointless",
  },
  { kind: "alphabet", label: "A to Z", blurb: "An answer for every letter on one topic" },
  {
    kind: "categories",
    label: "Categories",
    blurb: "Roll a letter, everyone answers each category with it",
  },
  { kind: "connect", label: "Connections wall", blurb: "16 tiles hiding four groups of four" },
  {
    kind: "clues",
    label: "Who am I?",
    blurb: "Clues from hard to easy: guess early for more points",
  },
  {
    kind: "imposter",
    label: "Imposter",
    blurb: "Everyone gets the word but one. Pass the phone, then find the imposter",
  },
  { kind: "bingo", label: "Bingo", blurb: "Any topic: a different card per player by link" },
  {
    kind: "auction",
    label: "Auction draft",
    blurb: "Everyone has a budget and bids to build the best team",
  },
];

export const kindLabel = (kind: Kind) => KINDS.find((k) => k.kind === kind)?.label ?? kind;

export function assertNever(x: never): never {
  throw new Error(`Unhandled round: ${JSON.stringify(x)}`);
}

export function newRound(kind: Kind): Round {
  const base = { id: crypto.randomUUID(), title: kindLabel(kind) };
  switch (kind) {
    case "questions":
      return { ...base, kind, questions: [] };
    case "list":
      return { ...base, kind, prompt: "", answers: [], ranked: false };
    case "alphabet":
      return { ...base, kind, topic: "" };
    case "categories":
      return { ...base, kind, categories: [] };
    case "connect":
      return {
        ...base,
        kind,
        groups: Array.from({ length: 4 }, () => ({ name: "", items: ["", "", "", ""] })),
      };
    case "clues":
      return { ...base, kind, items: [] };
    case "imposter":
      return { ...base, kind, words: [], mystery: false };
    case "bingo":
      return { ...base, kind, cells: [] };
    case "auction":
      return { ...base, kind, lots: [], budget: 20, squad: 5 };
    default:
      return assertNever(kind);
  }
}

/** What stops a round being played; empty when ready */
export function problems(round: Round): string[] {
  switch (round.kind) {
    case "questions":
      return round.questions.length ? [] : ["Add a question"];
    case "list":
      return round.prompt && round.answers.length ? [] : ["Add a prompt and answers"];
    case "alphabet":
      return round.topic ? [] : ["Add a topic"];
    case "categories":
      return round.categories.length ? [] : ["Add categories"];
    case "connect": {
      const items = round.groups.flatMap((g) => g.items.map((i) => i.trim().toLowerCase()));
      if (items.some((i) => !i)) return ["Fill all 16 tiles"];
      return new Set(items).size === 16 ? [] : ["Every tile must be different"];
    }
    case "clues":
      return round.items.length ? [] : ["Add an answer with clues"];
    case "imposter":
      return round.words.length >= 2 ? [] : ["Add at least two words"];
    case "bingo":
      return round.cells.length >= 24 ? [] : [`Add ${24 - round.cells.length} more cells (24+)`];
    case "auction":
      return round.lots.length ? [] : ["Add things to bid for"];
    default:
      return assertNever(round);
  }
}

export function newQuiz(title = "Quiz night"): Quiz {
  return {
    version: 1,
    id: crypto.randomUUID(),
    title,
    teams: ["Team 1", "Team 2"],
    rounds: [],
    scores: {},
    jokers: {},
    play: {},
    updatedAt: new Date().toISOString(),
  };
}

/** Points per team: every round, the joker round doubled */
export function totals(quiz: Quiz): number[] {
  return quiz.teams.map((_, t) =>
    quiz.rounds.reduce((sum, r) => {
      const points = quiz.scores[r.id]?.[t] ?? 0;
      return sum + (quiz.jokers[t] === r.id ? points * 2 : points);
    }, 0)
  );
}

/** Team indexes, best first; ties share a place */
export function placings(quiz: Quiz): { team: number; total: number; place: number }[] {
  const t = totals(quiz);
  const order = t.map((total, team) => ({ team, total })).sort((a, b) => b.total - a.total);
  return order.map((o) => ({ ...o, place: order.findIndex((x) => x.total === o.total) + 1 }));
}

/** Split pasted text into lines, trimmed, blanks dropped */
export const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export interface QuizData {
  version: 1;
  quizzes: Quiz[];
}

export const EMPTY: QuizData = { version: 1, quizzes: [] };

export function parseQuizData(raw: unknown): QuizData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Partial<QuizData>;
  return d.version === 1 && Array.isArray(d.quizzes) ? { version: 1, quizzes: d.quizzes } : null;
}
