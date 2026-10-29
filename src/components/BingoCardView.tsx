import { PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { bingoCard, bingoLines, FREE } from "../lib/games";
import { type CardLink, decodeCard } from "../lib/share";
import { load, save } from "../lib/storage";

/** A player's own card, opened from the host's link. Marks stay on this phone only. */
export function BingoCardView({ code }: { code: string }) {
  const [card, setCard] = useState<CardLink | null>(null);
  const [error, setError] = useState(false);
  const [marked, setMarked] = useState<number[]>([]);
  const key = `quiz-bingo:${code.slice(0, 32)}`;

  // Decoding is async (browser decompression); marks load with it so they match the card.
  useEffect(() => {
    decodeCard(code).then((c) => {
      if (!c) return setError(true);
      setCard(c);
      setMarked(load<number[]>(key, []));
    });
  }, [code, key]);

  if (error) {
    return (
      <p className="m-4 rounded-2xl bg-white p-6 text-slate-800 ring-1 ring-slate-200">
        That card link is broken or incomplete. Ask the host to send it again.
      </p>
    );
  }
  if (!card) return <div className="h-full animate-pulse bg-slate-100" />;

  const cells = bingoCard(card.cells, card.seed);
  const lines = bingoLines(new Set(marked));
  const toggle = (i: number) => {
    const next = marked.includes(i) ? marked.filter((x) => x !== i) : [...marked, i];
    setMarked(next);
    save(key, next);
  };

  return (
    <div className="h-full overflow-y-auto bg-indigo-950 p-3 text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        <h2 className="text-center text-xl font-black">
          {card.title}{" "}
          <span className="block text-sm font-semibold text-indigo-200">{card.player}</span>
        </h2>
        <div className="grid grid-cols-5 gap-1.5">
          {cells.map((c, i) =>
            c === FREE ? (
              <div
                key="free"
                className="grid aspect-square place-items-center rounded-lg bg-amber-300 p-1 text-center text-xs font-black text-slate-950"
              >
                {FREE}
              </div>
            ) : (
              <button
                key={c}
                type="button"
                aria-pressed={marked.includes(i)}
                onClick={() => toggle(i)}
                className={`grid aspect-square place-items-center overflow-hidden rounded-lg p-1 text-center text-[0.65rem] font-bold leading-tight break-words hyphens-auto focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-300 sm:text-xs ${marked.includes(i) ? "bg-emerald-400 text-slate-950" : "bg-white text-slate-900"}`}
              >
                {c}
              </button>
            )
          )}
        </div>
        <p
          aria-live="polite"
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-center text-lg font-black ${lines ? "bg-amber-300 text-slate-950" : "text-indigo-100"}`}
        >
          {lines > 0 && <PartyPopper size={20} aria-hidden="true" />}
          {lines === 0
            ? "Tap a square when it's called"
            : lines === 1
              ? "BINGO! Shout it out"
              : `${lines} lines!`}
        </p>
      </div>
    </div>
  );
}
