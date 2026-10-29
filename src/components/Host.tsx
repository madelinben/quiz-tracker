import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Sparkles, Trophy } from "lucide-react";
import { useRef } from "react";
import { kindLabel, type PlayState, problems, type Quiz } from "../lib/quiz";
import type { View } from "../QuizApp";
import { RoundHost } from "./RoundHost";
import { stage } from "./ui";

interface Props {
  quiz: Quiz;
  round: number;
  onChange: (q: Quiz) => void;
  go: (v: View) => void;
}

/** The screen the room watches: dark, big type, one round at a time, scores underneath */
export function Host({ quiz, round: index, onChange, go }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const round = quiz.rounds[index];
  if (!round) return null;
  const issues = problems(round);
  const scores = quiz.scores[round.id] ?? [];
  const toRound = (i: number) => go({ name: "host", id: quiz.id, round: i });
  const setPlay = (play: PlayState) =>
    onChange({ ...quiz, play: { ...quiz.play, [round.id]: play } });

  return (
    <div ref={root} className="flex min-h-full flex-col bg-slate-950 text-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
        <button
          type="button"
          onClick={() => go({ name: "edit", id: quiz.id })}
          className={stage}
          aria-label="Back to editing"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Round</span>
          <select
            value={index}
            onChange={(e) => toRound(Number(e.target.value))}
            className="min-h-12 w-full rounded-xl bg-white/10 px-3 font-bold text-white ring-1 ring-white/25 focus-visible:outline-2 focus-visible:outline-amber-300 [&>option]:text-slate-900"
          >
            {quiz.rounds.map((r, i) => (
              <option key={r.id} value={i}>
                Round {i + 1}: {r.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => toRound(index - 1)}
          disabled={index === 0}
          className={stage}
          aria-label="Previous round"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => toRound(index + 1)}
          disabled={index === quiz.rounds.length - 1}
          className={stage}
          aria-label="Next round"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => root.current?.requestFullscreen?.().catch(() => {})}
          className={stage}
          aria-label="Full screen"
        >
          <Maximize size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go({ name: "scores", id: quiz.id })} className={stage}>
          <Trophy size={18} aria-hidden="true" />
          Scores
        </button>
      </div>

      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-8">
        <header id="round-top" className="scroll-mt-4">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-300">
            <Sparkles size={14} aria-hidden="true" />
            Round {index + 1} · {kindLabel(round.kind)}
          </p>
          <h2 className="text-3xl font-black sm:text-5xl">{round.title}</h2>
        </header>
        {issues.length ? (
          <p className="rounded-xl bg-amber-400/15 p-4 text-amber-100">
            Not ready: {issues.join(", ")}.{" "}
            <button
              type="button"
              onClick={() => go({ name: "edit", id: quiz.id })}
              className="font-bold underline"
            >
              Edit the round
            </button>
          </p>
        ) : (
          <RoundHost
            key={round.id}
            round={round}
            teams={quiz.teams}
            play={quiz.play[round.id] ?? {}}
            onPlay={setPlay}
          />
        )}
      </main>

      <section
        aria-labelledby="round-scores"
        className="sticky bottom-0 border-t border-white/10 bg-slate-900/95 p-3 backdrop-blur"
      >
        <h3
          id="round-scores"
          className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-300"
        >
          Points this round
        </h3>
        <div className="flex gap-2 overflow-x-auto">
          {quiz.teams.map((team, t) => (
            <label
              key={team}
              className="flex shrink-0 flex-col gap-1 text-xs font-semibold text-slate-200"
            >
              <span className="max-w-28 truncate">
                {team}
                {quiz.jokers[t] === round.id && " · joker ×2"}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step={0.5}
                min={-999}
                max={999}
                value={scores[t] ?? 0}
                onChange={(e) =>
                  onChange({
                    ...quiz,
                    scores: {
                      ...quiz.scores,
                      [round.id]: quiz.teams.map((_, j) =>
                        j === t
                          ? Math.max(-999, Math.min(999, Number(e.target.value) || 0))
                          : (scores[j] ?? 0)
                      ),
                    },
                  })
                }
                className="min-h-11 w-24 rounded-lg bg-white px-2 text-lg font-bold tabular-nums text-slate-900 focus-visible:outline-2 focus-visible:outline-amber-300"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
