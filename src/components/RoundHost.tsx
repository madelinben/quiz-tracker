import { Check, Copy, Dices, Eye, EyeOff, Megaphone, RotateCcw, Share2, Undo2 } from "lucide-react";
import { useState } from "react";
import {
  cluePoints,
  deal,
  listPoints,
  matchGroup,
  purses,
  rollLetter,
  saleProblem,
  seeded,
  seedOf,
  shuffle,
} from "../lib/games";
import { assertNever, type PlayState, type Round } from "../lib/quiz";
import { CARD_PREFIX, encodeCard } from "../lib/share";
import { stage } from "./ui";

interface Props<R extends Round> {
  round: R;
  teams: readonly string[];
  play: PlayState;
  onPlay: (p: PlayState) => void;
}

type Of<K extends Round["kind"]> = Props<Extract<Round, { kind: K }>>;

const big = "text-2xl font-bold sm:text-4xl";
const tile =
  "flex min-h-16 items-center justify-center rounded-xl p-2 text-center font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 motion-reduce:transition-none";

/** Back to the round heading when the content changes */
const toTop = () => document.getElementById("round-top")?.scrollIntoView({ block: "start" });

/** Toggle an index in a list of shown indexes */
const flip = (list: readonly number[], i: number) =>
  list.includes(i) ? list.filter((x) => x !== i) : [...list, i];

export function RoundHost(props: Props<Round>) {
  const { round } = props;
  switch (round.kind) {
    case "questions":
      return <Questions {...props} round={round} />;
    case "list":
      return <ListBoard {...props} round={round} />;
    case "alphabet":
      return <Alphabet {...props} round={round} />;
    case "categories":
      return <Categories {...props} round={round} />;
    case "connect":
      return <Connect {...props} round={round} />;
    case "clues":
      return <Clues {...props} round={round} />;
    case "imposter":
      return <Imposter {...props} round={round} />;
    case "bingo":
      return <Bingo {...props} round={round} />;
    case "auction":
      return <Auction {...props} round={round} />;
    default:
      return assertNever(round);
  }
}

function Questions({ round, play, onPlay }: Of<"questions">) {
  const [i, setI] = useState(0);
  const q = round.questions[i];
  const revealed = play.revealed ?? [];
  if (!q) return null;
  const shown = revealed.includes(i);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-slate-300">
        Question {i + 1} of {round.questions.length}
      </p>
      <p className={big}>{q.prompt}</p>
      {q.image && (
        <img
          src={q.image}
          alt={`Question ${i + 1}`}
          className="max-h-[50vh] self-start rounded-xl object-contain"
        />
      )}
      {q.choices && (
        <ol className="grid gap-2 sm:grid-cols-2">
          {q.choices.map((c, n) => (
            <li
              key={c}
              className={`rounded-xl p-4 text-xl font-bold ring-1 ${shown && c === q.answer ? "bg-emerald-500 text-slate-950 ring-emerald-300" : "bg-white/5 ring-white/20"}`}
            >
              <span className="mr-2 text-amber-300">{String.fromCharCode(65 + n)}</span>
              {c}
            </li>
          ))}
        </ol>
      )}
      <p aria-live="polite" className="min-h-10 text-2xl font-black text-emerald-300">
        {shown && `Answer: ${q.answer}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setI(i - 1);
            toTop();
          }}
          disabled={i === 0}
          className={stage}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPlay({ ...play, revealed: flip(revealed, i) })}
          className={stage}
        >
          {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          {shown ? "Hide answer" : "Reveal answer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setI(i + 1);
            toTop();
          }}
          disabled={i === round.questions.length - 1}
          className={stage}
        >
          Next question
        </button>
      </div>
    </div>
  );
}

function ListBoard({ round, play, onPlay }: Of<"list">) {
  const revealed = play.revealed ?? [];
  return (
    <div className="flex flex-col gap-4">
      <p className={big}>{round.prompt}</p>
      <p className="text-sm text-slate-300">
        {revealed.length} of {round.answers.length} found
        {round.ranked && " · lower down scores more"}
      </p>
      <ol className="grid gap-2 sm:grid-cols-2">
        {round.answers.map((a, i) => {
          const shown = revealed.includes(i);
          return (
            <li key={a}>
              <button
                type="button"
                onClick={() => onPlay({ ...play, revealed: flip(revealed, i) })}
                aria-pressed={shown}
                className={`${tile} w-full justify-between gap-3 text-xl ${shown ? "bg-amber-300 text-slate-950" : "bg-white/5 ring-1 ring-white/20 hover:bg-white/10"}`}
              >
                <span className="tabular-nums opacity-70">{i + 1}</span>
                <span className="flex-1 text-left">
                  {shown ? a : <span className="sr-only">Hidden answer {i + 1}</span>}
                </span>
                <span className="text-sm tabular-nums opacity-80">
                  {listPoints(i, round.ranked)} pt
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => onPlay({ ...play, revealed: round.answers.map((_, i) => i) })}
        className={`${stage} self-start`}
      >
        <Eye size={18} aria-hidden="true" />
        Reveal all
      </button>
    </div>
  );
}

const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

function Alphabet({ round, play, onPlay }: Of<"alphabet">) {
  const done = play.revealed ?? [];
  return (
    <div className="flex flex-col gap-4">
      <p className={big}>A to Z: {round.topic}</p>
      <p className="text-sm text-slate-300">
        Tap a letter once someone has a good answer · {done.length} of 26
      </p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-13">
        {LETTERS.map((l, i) => (
          <button
            key={l}
            type="button"
            aria-pressed={done.includes(i)}
            onClick={() => onPlay({ ...play, revealed: flip(done, i) })}
            className={`${tile} text-3xl ${done.includes(i) ? "bg-emerald-400 text-slate-950" : "bg-white/5 ring-1 ring-white/20 hover:bg-white/10"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Categories({ round, play, onPlay }: Of<"categories">) {
  const called = play.called ?? [];
  const letter = called.at(-1);
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-10">
      <div className="flex flex-col items-center gap-3">
        <p
          aria-live="polite"
          className="grid size-40 place-items-center rounded-3xl bg-amber-300 text-8xl font-black text-slate-950"
        >
          {letter ?? "?"}
        </p>
        <button
          type="button"
          onClick={() => onPlay({ ...play, called: [...called, rollLetter(called)] })}
          className={stage}
        >
          <Dices size={18} aria-hidden="true" />
          {letter ? "Roll again" : "Roll a letter"}
        </button>
        {called.length > 1 && (
          <p className="text-sm text-slate-300">Used: {called.slice(0, -1).join(" ")}</p>
        )}
      </div>
      <ol className="flex flex-1 list-decimal flex-col gap-2 pl-6 text-2xl font-bold marker:text-amber-300">
        {round.categories.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
    </div>
  );
}

const GROUP_COLOURS = ["bg-sky-300", "bg-emerald-300", "bg-amber-300", "bg-rose-300"];

function Connect({ round, play, onPlay }: Of<"connect">) {
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const found = play.found ?? [];
  const tiles = shuffle(
    round.groups.flatMap((g) => g.items),
    seeded(seedOf(round.id))
  ).filter((t) => !found.some((f) => round.groups[f]?.items.includes(t)));

  function pick(t: string) {
    const next = picked.includes(t) ? picked.filter((p) => p !== t) : [...picked, t];
    if (next.length < 4) return setPicked(next);
    const g = matchGroup(round.groups, next);
    setPicked([]);
    if (g === null || found.includes(g)) return setMessage("Not a group. Try again.");
    setMessage(`Found: ${round.groups[g]?.name ?? ""}`);
    onPlay({ ...play, found: [...found, g] });
  }

  return (
    <div className="flex flex-col gap-3">
      {found.map((g) => (
        <div
          key={round.groups[g]?.name}
          className={`grid grid-cols-4 gap-2 rounded-xl p-2 text-slate-950 ${GROUP_COLOURS[found.indexOf(g)] ?? ""}`}
        >
          {round.groups[g]?.items.map((t) => (
            <span key={t} className="text-center text-lg font-bold">
              {t}
            </span>
          ))}
          <span className="col-span-4 text-center text-sm font-black uppercase tracking-wide">
            {round.groups[g]?.name}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={picked.includes(t)}
            onClick={() => pick(t)}
            className={`${tile} text-base sm:text-xl ${picked.includes(t) ? "bg-white text-slate-950" : "bg-indigo-900 ring-1 ring-indigo-400/40 hover:bg-indigo-800"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="min-h-7 text-lg font-bold text-amber-200">
        {message}
      </p>
      {found.length < 4 && (
        <button
          type="button"
          onClick={() => onPlay({ ...play, found: [0, 1, 2, 3] })}
          className={`${stage} self-start`}
        >
          <Eye size={18} aria-hidden="true" />
          Solve the wall
        </button>
      )}
    </div>
  );
}

function Clues({ round, play, onPlay }: Of<"clues">) {
  const [i, setI] = useState(0);
  const item = round.items[i];
  const shownCounts = play.revealed ?? [];
  if (!item) return null;
  const shown = Math.max(1, shownCounts[i] ?? 1);
  const answered = shown > item.clues.length;
  const setShown = (n: number) =>
    onPlay({ ...play, revealed: round.items.map((_, j) => (j === i ? n : (shownCounts[j] ?? 1))) });
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-slate-300">
        Who or what am I? {i + 1} of {round.items.length}
        {!answered && ` · worth ${cluePoints(item.clues.length, shown)} now`}
      </p>
      <ol className="flex flex-col gap-2">
        {item.clues.slice(0, shown).map((c, n) => (
          <li key={c} className={`${big} flex gap-3`}>
            <span className="text-amber-300 tabular-nums">{n + 1}.</span>
            {c}
          </li>
        ))}
      </ol>
      <p aria-live="polite" className="min-h-10 text-3xl font-black text-emerald-300">
        {answered && `I am… ${item.answer}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setI(i - 1);
            toTop();
          }}
          disabled={i === 0}
          className={stage}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setShown(shown + 1)}
          disabled={answered}
          className={stage}
        >
          {shown < item.clues.length ? "Next clue" : "Reveal the answer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setI(i + 1);
            toTop();
          }}
          disabled={i === round.items.length - 1}
          className={stage}
        >
          Next answer
        </button>
      </div>
    </div>
  );
}

function Imposter({ round, teams, play, onPlay }: Of<"imposter">) {
  const [peeking, setPeeking] = useState(false);
  const d = play.deal;
  const seen = play.revealed ?? [];
  const seat = seen.length;

  if (teams.length < 3) {
    return <p className={big}>Imposter needs at least 3 players: add them as teams.</p>;
  }
  if (!d) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className={big}>
          {round.mystery
            ? "Everyone gets a word. One person's is different, and they don't know it."
            : "Everyone gets the secret word except the imposter."}
        </p>
        <p className="text-lg text-slate-300">
          Pass the phone round. Then take turns saying one word linked to the secret. Find the
          imposter before they work out the word.
        </p>
        <button
          type="button"
          onClick={() =>
            onPlay({ ...play, deal: deal(teams.length, round.words, round.mystery), revealed: [] })
          }
          className={stage}
        >
          <Dices size={18} aria-hidden="true" />
          Deal the words
        </button>
      </div>
    );
  }

  const again = (
    <button
      type="button"
      onClick={() => onPlay({ ...play, deal: undefined, revealed: [] })}
      className={stage}
    >
      <RotateCcw size={18} aria-hidden="true" />
      New game
    </button>
  );

  if (seat < teams.length) {
    const word = seat === d.imposter ? (d.decoy ?? "You are the imposter") : d.word;
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <p className="text-lg text-slate-300">
          Player {seat + 1} of {teams.length}
        </p>
        <p className={big}>Pass the phone to {teams[seat]}</p>
        <p
          aria-live="polite"
          className="grid min-h-32 w-full max-w-md place-items-center rounded-2xl bg-white/5 p-4 text-4xl font-black ring-1 ring-white/20"
        >
          {peeking ? word : "• • •"}
        </p>
        {peeking ? (
          <button
            type="button"
            onClick={() => {
              setPeeking(false);
              onPlay({ ...play, revealed: [...seen, seat] });
            }}
            className={stage}
          >
            <EyeOff size={18} aria-hidden="true" />
            Hide and pass on
          </button>
        ) : (
          <button type="button" onClick={() => setPeeking(true)} className={stage}>
            <Eye size={18} aria-hidden="true" />
            {teams[seat]}: show my word
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className={big}>Everyone has their word. {teams[d.starter]} goes first.</p>
      <p className="text-lg text-slate-300">
        Go round saying one word each, then vote on the imposter.
      </p>
      <p aria-live="polite" className="text-3xl font-black text-amber-300">
        {d.unmasked &&
          `${teams[d.imposter]} was the imposter. The word was ${d.word}${d.decoy ? ` (they had ${d.decoy})` : ""}.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {!d.unmasked && (
          <button
            type="button"
            onClick={() => onPlay({ ...play, deal: { ...d, unmasked: true } })}
            className={stage}
          >
            <Megaphone size={18} aria-hidden="true" />
            Reveal the imposter
          </button>
        )}
        {again}
      </div>
    </div>
  );
}

function Bingo({ round, teams, play, onPlay }: Of<"bingo">) {
  const called = play.called ?? [];
  const [copied, setCopied] = useState("");
  const left = round.cells.filter((c) => !called.includes(c));
  const canShare = typeof navigator.share === "function";

  async function share(player: string, t: number) {
    const code = await encodeCard({
      v: 1,
      title: round.title,
      cells: round.cells,
      seed: seedOf(`${round.id}:${t}`),
      player,
    });
    const url = new URL(window.location.href);
    url.hash = CARD_PREFIX + code;
    const text = `${player}, here's your ${round.title} card`;
    if (canShare) {
      await navigator.share({ title: round.title, text, url: url.toString() }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url.toString());
    setCopied(player);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <p
          aria-live="polite"
          className="min-h-24 flex-1 rounded-2xl bg-amber-300 p-4 text-3xl font-black text-slate-950"
        >
          {called.at(-1) ?? "Send everyone their card, then call the first one"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPlay({ ...play, called: [...called, shuffle(left)[0] ?? ""] })}
            disabled={!left.length}
            className={stage}
          >
            <Megaphone size={18} aria-hidden="true" />
            Call next
          </button>
          <button
            type="button"
            onClick={() => onPlay({ ...play, called: called.slice(0, -1) })}
            disabled={!called.length}
            className={stage}
            aria-label="Undo last call"
          >
            <Undo2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      {called.length > 1 && (
        <section aria-labelledby="called-h">
          <h3 id="called-h" className="mb-2 text-sm font-semibold text-slate-300">
            Called ({called.length} of {round.cells.length})
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {called.slice(0, -1).map((c) => (
              <li key={c} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="cards-h">
        <h3 id="cards-h" className="mb-2 text-sm font-semibold text-slate-300">
          Cards: everyone opens theirs on their own phone and marks it as you call
        </h3>
        <ul className="flex flex-wrap gap-2">
          {teams.map((p, t) => (
            <li key={p}>
              <button type="button" onClick={() => share(p, t)} className={stage}>
                {copied === p ? (
                  <Check size={18} aria-hidden="true" />
                ) : canShare ? (
                  <Share2 size={18} aria-hidden="true" />
                ) : (
                  <Copy size={18} aria-hidden="true" />
                )}
                {copied === p ? "Link copied" : `${p}'s card`}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Auction({ round, teams, play, onPlay }: Of<"auction">) {
  const sales = play.sales ?? [];
  const [buyer, setBuyer] = useState(0);
  const [price, setPrice] = useState(1);
  const [error, setError] = useState("");
  const lot = round.lots.find((l) => !sales.some((s) => s.lot === l));
  const purse = purses(teams.length, round.budget, sales);
  const full = teams.every((_, t) => sales.filter((s) => s.buyer === t).length >= round.squad);

  function sell() {
    if (!lot) return;
    const sale = { lot, buyer, price };
    const problem = saleProblem(sale, round.budget, round.squad, sales);
    if (problem) return setError(problem);
    setError("");
    setPrice(1);
    onPlay({ ...play, sales: [...sales, sale] });
  }

  return (
    <div className="flex flex-col gap-5">
      {lot && !full ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/15">
          <p className="text-sm font-semibold text-slate-300">
            Up for auction · {round.lots.indexOf(lot) + 1} of {round.lots.length}
          </p>
          <p className="text-4xl font-black sm:text-6xl">{lot}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Sold to
              <select
                value={buyer}
                onChange={(e) => setBuyer(Number(e.target.value))}
                className="min-h-12 rounded-xl bg-white px-3 font-bold text-slate-900"
              >
                {teams.map((t, i) => (
                  <option key={t} value={i}>
                    {t} ({purse[i]} left)
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              For
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={round.budget}
                value={price}
                onChange={(e) => setPrice(Math.floor(Number(e.target.value) || 0))}
                className="min-h-12 w-24 rounded-xl bg-white px-3 text-lg font-bold tabular-nums text-slate-900"
              />
            </label>
            <button type="button" onClick={sell} className={stage}>
              <Check size={18} aria-hidden="true" />
              Sold
            </button>
            <button
              type="button"
              onClick={() => onPlay({ ...play, sales: [...sales, { lot, buyer: -1, price: 0 }] })}
              className={stage}
            >
              No bids
            </button>
          </div>
          <p aria-live="assertive" className="min-h-6 font-semibold text-rose-300">
            {error}
          </p>
        </div>
      ) : (
        <p className={big}>
          Auction over. Everyone makes the case for their team, then vote and add points below.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t, i) => {
          const bought = sales.filter((s) => s.buyer === i);
          return (
            <li key={t} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/15">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-black">{t}</p>
                <p className="tabular-nums text-amber-300">{purse[i]} left</p>
              </div>
              <p className="text-xs text-slate-400">
                {bought.length} of {round.squad}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {bought.map((s) => (
                  <li key={s.lot} className="flex justify-between gap-2">
                    <span>{s.lot}</span>
                    <span className="tabular-nums text-slate-300">{s.price}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      {sales.length > 0 && (
        <button
          type="button"
          onClick={() => onPlay({ ...play, sales: sales.slice(0, -1) })}
          className={`${stage} self-start`}
        >
          <Undo2 size={18} aria-hidden="true" />
          Undo last sale
        </button>
      )}
    </div>
  );
}
