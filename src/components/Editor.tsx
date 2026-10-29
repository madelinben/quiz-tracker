import { ArrowDown, ArrowLeft, ArrowUp, Play, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  KINDS,
  type Kind,
  kindLabel,
  lines,
  newRound,
  problems,
  type Quiz,
  type Round,
} from "../lib/quiz";
import type { View } from "../QuizApp";
import { RoundEditor } from "./RoundEditor";
import { area, field, ghost, label, primary } from "./ui";

interface Props {
  quiz: Quiz;
  onChange: (q: Quiz) => void;
  go: (v: View) => void;
}

export function Editor({ quiz, onChange, go }: Props) {
  const [kind, setKind] = useState<Kind>("questions");
  const [teamsText, setTeamsText] = useState(quiz.teams.join("\n"));

  const setRound = (round: Round) =>
    onChange({ ...quiz, rounds: quiz.rounds.map((r) => (r.id === round.id ? round : r)) });
  const move = (i: number, by: number) => {
    const rounds = [...quiz.rounds];
    const [r] = rounds.splice(i, 1);
    if (r) rounds.splice(i + by, 0, r);
    onChange({ ...quiz, rounds });
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => go({ name: "home" })} className={ghost}>
          <ArrowLeft size={16} aria-hidden="true" />
          Quizzes
        </button>
        <button
          type="button"
          onClick={() => go({ name: "host", id: quiz.id, round: 0 })}
          disabled={!quiz.rounds.length}
          className={primary}
        >
          <Play size={16} aria-hidden="true" />
          Host
        </button>
      </div>

      <h2 className="sr-only">Edit {quiz.title}</h2>
      <label className={label}>
        Quiz name
        <input
          value={quiz.title}
          onChange={(e) => onChange({ ...quiz, title: e.target.value.slice(0, 60) })}
          className={field}
        />
      </label>
      <label className={label}>
        Teams or players, one per line
        <textarea
          value={teamsText}
          rows={4}
          onChange={(e) => {
            setTeamsText(e.target.value);
            const teams = lines(e.target.value)
              .slice(0, 30)
              .map((t) => t.slice(0, 40));
            if (teams.length) onChange({ ...quiz, teams });
          }}
          className={area}
        />
        <span className="text-xs font-normal text-slate-600">
          Scores, auction bidders, imposter seats and bingo cards all use this list.
        </span>
      </label>

      <section aria-labelledby="rounds-h" className="flex flex-col gap-3">
        <h3 id="rounds-h" className="text-lg font-extrabold">
          Rounds
        </h3>
        {quiz.rounds.map((r, i) => {
          const issues = problems(r);
          return (
            <details
              key={r.id}
              open={issues.length > 0}
              className="rounded-2xl bg-white ring-1 ring-slate-200"
            >
              <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 py-2">
                <span className="text-sm tabular-nums text-slate-500">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{r.title}</span>
                  <span className="text-xs text-slate-600">{kindLabel(r.kind)}</span>
                </span>
                {issues.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                    <TriangleAlert size={14} aria-hidden="true" />
                    {issues[0]}
                  </span>
                )}
              </summary>
              <div className="flex flex-col gap-3 border-t border-slate-100 p-4">
                <label className={label}>
                  Round title
                  <input
                    value={r.title}
                    onChange={(e) => setRound({ ...r, title: e.target.value.slice(0, 60) })}
                    className={field}
                  />
                </label>
                <RoundEditor round={r} onChange={setRound} />
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className={ghost}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                    Earlier
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === quiz.rounds.length - 1}
                    className={ghost}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirm(`Delete ${r.title}?`) &&
                      onChange({ ...quiz, rounds: quiz.rounds.filter((x) => x.id !== r.id) })
                    }
                    className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete round
                  </button>
                </div>
              </div>
            </details>
          );
        })}

        <div className="flex gap-2">
          <label htmlFor="round-kind" className="sr-only">
            Kind of round
          </label>
          <select
            id="round-kind"
            value={kind}
            onChange={(e) =>
              setKind(KINDS.find((k) => k.kind === e.target.value)?.kind ?? "questions")
            }
            className={`${field} min-w-0 flex-1`}
          >
            {KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}: {k.blurb}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange({ ...quiz, rounds: [...quiz.rounds, newRound(kind)] })}
            className={primary}
          >
            <Plus size={16} aria-hidden="true" />
            Add round
          </button>
        </div>
      </section>
    </div>
  );
}
