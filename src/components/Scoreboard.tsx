import { ArrowLeft, Crown, Play, RotateCcw } from "lucide-react";
import { placings, type Quiz } from "../lib/quiz";
import type { View } from "../QuizApp";
import { field, ghost, primary } from "./ui";

interface Props {
  quiz: Quiz;
  onChange: (q: Quiz) => void;
  go: (v: View) => void;
}

/** Totals with jokers, round by round; jokers are picked here before the round starts */
export function Scoreboard({ quiz, onChange, go }: Props) {
  const rows = placings(quiz);
  const cell = "px-2 py-2 text-right tabular-nums";

  function reset() {
    if (confirm("Clear every score, joker and reveal? Rounds and teams are kept."))
      onChange({ ...quiz, scores: {}, jokers: {}, play: {} });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => go({ name: "home" })} className={ghost}>
          <ArrowLeft size={16} aria-hidden="true" />
          Quizzes
        </button>
        <button
          type="button"
          onClick={() => go({ name: "host", id: quiz.id, round: 0 })}
          disabled={!quiz.rounds.length}
          className={`${primary} ml-auto`}
        >
          <Play size={16} aria-hidden="true" />
          Host
        </button>
      </div>
      <h2 className="text-2xl font-extrabold">{quiz.title}: scores</h2>

      <ol className="flex flex-col gap-2">
        {rows.map((r) => (
          <li
            key={quiz.teams[r.team]}
            className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${r.place === 1 ? "bg-amber-100 ring-amber-300" : "bg-white ring-slate-200"}`}
          >
            <span className="w-8 text-center text-xl font-black tabular-nums">
              {r.place === 1 ? (
                <Crown size={22} className="mx-auto text-amber-700" aria-label="1st" />
              ) : (
                r.place
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-lg font-bold">{quiz.teams[r.team]}</span>
            <span className="text-2xl font-black tabular-nums">{r.total}</span>
          </li>
        ))}
      </ol>

      {quiz.rounds.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <caption className="sr-only">Points per round. A joker doubles that round.</caption>
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="sticky left-0 bg-slate-50 px-3 py-2 text-left">
                  Round
                </th>
                {quiz.teams.map((t) => (
                  <th key={t} scope="col" className={`${cell} max-w-24 truncate`}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quiz.rounds.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <th
                    scope="row"
                    className="sticky left-0 bg-white px-3 py-2 text-left font-semibold"
                  >
                    {i + 1}. {r.title}
                  </th>
                  {quiz.teams.map((t, ti) => (
                    <td key={t} className={cell}>
                      {quiz.scores[r.id]?.[ti] ?? 0}
                      {quiz.jokers[ti] === r.id && (
                        <span className="ml-1 rounded bg-indigo-100 px-1 text-xs font-bold text-indigo-800">
                          ×2
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {quiz.rounds.length > 1 && (
        <section aria-labelledby="jokers-h" className="flex flex-col gap-2">
          <h3 id="jokers-h" className="text-lg font-extrabold">
            Jokers
          </h3>
          <p className="text-sm text-slate-700">
            Each team doubles one round. Pick before it starts.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {quiz.teams.map((t, ti) => (
              <label key={t} className="flex flex-col gap-1 text-sm font-semibold">
                {t}
                <select
                  value={quiz.jokers[ti] ?? ""}
                  onChange={(e) => {
                    const { [ti]: _, ...rest } = quiz.jokers;
                    onChange({
                      ...quiz,
                      jokers: e.target.value ? { ...rest, [ti]: e.target.value } : rest,
                    });
                  }}
                  className={field}
                >
                  <option value="">No joker yet</option>
                  {quiz.rounds.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      {i + 1}. {r.title}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center justify-center gap-1 self-start rounded-xl px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Reset for a new night
      </button>
    </div>
  );
}
