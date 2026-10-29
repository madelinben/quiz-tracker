import type { Group, Sale } from "./quiz.ts";

/** Small seeded generator (mulberry32): the same seed deals the same bingo card on every phone */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable number from text: the same round always lays out the same way */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ (c.codePointAt(0) ?? 0), 16777619);
  return h >>> 0;
}

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export const FREE = "★ Free";

/** 5x5 card, centre free, 24 cells picked from the pool by the seed */
export function bingoCard(cells: readonly string[], seed: number): string[] {
  const picked = shuffle(cells, seeded(seed)).slice(0, 24);
  return [...picked.slice(0, 12), FREE, ...picked.slice(12)];
}

const LINES = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

/** Complete rows, columns and diagonals on a marked card */
export function bingoLines(marked: ReadonlySet<number>): number {
  return LINES.filter((l) => l.every((i) => i === 12 || marked.has(i))).length;
}

/**
 * One random imposter. Classic: the imposter gets no word. Mystery: they get a different word
 * from the same list and don't know they're the imposter.
 */
export function deal(
  players: number,
  words: readonly string[],
  mystery: boolean,
  random = Math.random
) {
  const [word = "", decoy = ""] = shuffle(words, random);
  return {
    imposter: Math.floor(random() * players),
    word,
    decoy: mystery ? decoy : null,
    starter: Math.floor(random() * players),
    unmasked: false,
  };
}

/** The group these four tiles make, or null */
export function matchGroup(groups: readonly Group[], picked: readonly string[]): number | null {
  if (picked.length !== 4) return null;
  const i = groups.findIndex((g) => picked.every((p) => g.items.includes(p)));
  return i < 0 ? null : i;
}

/** Budget left per bidder after the sales so far */
export function purses(bidders: number, budget: number, sales: readonly Sale[]): number[] {
  return Array.from(
    { length: bidders },
    (_, b) => budget - sales.filter((s) => s.buyer === b).reduce((n, s) => n + s.price, 0)
  );
}

/** Why a bid can't stand, or null: must afford it and keep 1 per empty slot still to fill */
export function saleProblem(
  sale: Sale,
  budget: number,
  squad: number,
  sales: readonly Sale[]
): string | null {
  const theirs = sales.filter((s) => s.buyer === sale.buyer);
  const owned = theirs.length;
  if (owned >= squad) return "Squad already full";
  if (!Number.isInteger(sale.price) || sale.price < 1) return "Bids start at 1";
  const left = budget - theirs.reduce((n, s) => n + s.price, 0);
  const reserve = squad - owned - 1;
  return sale.price > left - reserve
    ? `Max bid ${left - reserve}: keep 1 for each of the ${reserve} empty slot${reserve === 1 ? "" : "s"}`
    : null;
}

const ALPHABET = [..."ABCDEFGHIJKLMNOPRSTW"];

/** Letters that work for categories games (no Q, U, V, X, Y, Z), none repeated until all used */
export function rollLetter(used: readonly string[], random = Math.random): string {
  const left = ALPHABET.filter((l) => !used.includes(l));
  return shuffle(left.length ? left : ALPHABET, random)[0] ?? "A";
}

/** Who am I: full marks on the first clue, one fewer per extra clue, at least 1 */
export const cluePoints = (clues: number, shown: number) => Math.max(1, clues - shown + 1);

/** Pointless-style: the lower down a ranked list, the more it scores */
export const listPoints = (index: number, ranked: boolean) => (ranked ? index + 1 : 1);
