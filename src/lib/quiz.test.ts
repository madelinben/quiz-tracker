import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bingoCard,
  bingoLines,
  cluePoints,
  deal,
  FREE,
  matchGroup,
  purses,
  rollLetter,
  saleProblem,
  seeded,
} from "./games.ts";
import { KINDS, newQuiz, newRound, placings, problems, totals } from "./quiz.ts";
import { sampleQuiz } from "./sample.ts";

test("every kind makes a round; the sample quiz has one of each and is ready to play", () => {
  for (const { kind } of KINDS) assert.equal(newRound(kind).kind, kind);
  const sample = sampleQuiz();
  assert.deepEqual(
    sample.rounds.map((r) => r.kind),
    KINDS.map((k) => k.kind)
  );
  for (const r of sample.rounds) assert.deepEqual(problems(r), [], r.title);
});

test("totals double the joker round; tied teams share a place", () => {
  const q = { ...newQuiz(), rounds: [newRound("questions"), newRound("list")] };
  const [a, b] = q.rounds;
  assert.ok(a && b);
  const quiz = {
    ...q,
    teams: ["X", "Y", "Z"],
    scores: { [a.id]: [5, 8, 2], [b.id]: [4, 1, 3] },
    jokers: { 0: a.id },
  };
  assert.deepEqual(totals(quiz), [14, 9, 5]);
  const tied = { ...quiz, jokers: {}, scores: { [a.id]: [5, 5, 1] } };
  assert.deepEqual(
    placings(tied).map((p) => p.place),
    [1, 1, 3]
  );
});

test("bingo: same seed same card, free centre, lines counted", () => {
  const cells = Array.from({ length: 30 }, (_, i) => `c${i}`);
  assert.deepEqual(bingoCard(cells, 7), bingoCard(cells, 7));
  assert.notDeepEqual(bingoCard(cells, 7), bingoCard(cells, 8));
  assert.equal(bingoCard(cells, 7)[12], FREE);
  assert.equal(bingoLines(new Set([10, 11, 13, 14])), 1);
  assert.equal(bingoLines(new Set([0, 6, 18, 24, 2, 7, 17, 22])), 2);
  assert.equal(bingoLines(new Set([0, 1, 2])), 0);
});

test("connections: only a whole group matches", () => {
  const groups = [
    { name: "A", items: ["a1", "a2", "a3", "a4"] },
    { name: "B", items: ["b1", "b2", "b3", "b4"] },
  ];
  assert.equal(matchGroup(groups, ["b4", "b2", "b1", "b3"]), 1);
  assert.equal(matchGroup(groups, ["a1", "a2", "a3", "b1"]), null);
});

test("imposter: classic has no word, mystery gets a different one", () => {
  const random = seeded(3);
  const classic = deal(5, ["Beach", "Zoo", "Gym"], false, random);
  assert.ok(classic.imposter >= 0 && classic.imposter < 5);
  assert.equal(classic.decoy, null);
  const mystery = deal(5, ["Beach", "Zoo", "Gym"], true, random);
  assert.ok(mystery.decoy && mystery.decoy !== mystery.word);
});

test("auction: purses, reserve for empty slots, full squads", () => {
  const sales = [
    { lot: "x", buyer: 0, price: 15 },
    { lot: "y", buyer: 1, price: 3 },
  ];
  assert.deepEqual(purses(2, 20, sales), [5, 17]);
  // Player 0 has 5 left and 2 more slots to fill after this one: max 3
  assert.equal(
    saleProblem({ lot: "z", buyer: 0, price: 4 }, 20, 4, sales)?.startsWith("Max bid 3"),
    true
  );
  assert.equal(saleProblem({ lot: "z", buyer: 0, price: 3 }, 20, 4, sales), null);
  assert.equal(saleProblem({ lot: "z", buyer: 1, price: 1 }, 20, 1, sales), "Squad already full");
});

test("letters don't repeat until all are used; clue points never drop below 1", () => {
  const used = [..."ABCDEFGHIJKLMNOPRST"];
  assert.equal(rollLetter(used), "W");
  assert.equal(cluePoints(4, 1), 4);
  assert.equal(cluePoints(4, 4), 1);
  assert.equal(cluePoints(4, 9), 1);
});
