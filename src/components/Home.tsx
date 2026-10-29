import { Pencil, Play, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { KINDS, newQuiz, parseQuizData, type QuizData } from "../lib/quiz";
import { sampleQuiz } from "../lib/sample";
import type { BeforeExport } from "../lib/storage";
import type { View } from "../QuizApp";
import { DataBackup } from "./DataBackup";
import { field, ghost, primary } from "./ui";

interface Props {
  data: QuizData;
  onChange: (d: QuizData) => void;
  go: (v: View) => void;
  beforeExport?: BeforeExport;
}

export function Home({ data, onChange, go, beforeExport }: Props) {
  const [title, setTitle] = useState("");

  function create(e: React.FormEvent) {
    e.preventDefault();
    const quiz = newQuiz(title.trim().slice(0, 60) || "Quiz night");
    onChange({ ...data, quizzes: [quiz, ...data.quizzes] });
    setTitle("");
    go({ name: "edit", id: quiz.id });
  }

  function sample() {
    const quiz = sampleQuiz();
    onChange({ ...data, quizzes: [quiz, ...data.quizzes] });
    go({ name: "host", id: quiz.id, round: 0 });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <section aria-labelledby="new-h" className="flex flex-col gap-3">
        <h2 id="new-h" className="text-2xl font-extrabold">
          Quiz Tracker
        </h2>
        <p className="text-slate-700">
          Build any quiz or party game, host it on one screen, keep one scoreboard.
        </p>
        <form onSubmit={create} className="flex gap-2">
          <label htmlFor="quiz-title" className="sr-only">
            Quiz name
          </label>
          <input
            id="quiz-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz name: Friday pub quiz"
            className={`${field} min-w-0 flex-1`}
          />
          <button type="submit" className={primary}>
            <Plus size={16} aria-hidden="true" />
            New quiz
          </button>
        </form>
        <button type="button" onClick={sample} className={`${ghost} self-start`}>
          <Sparkles size={16} aria-hidden="true" />
          Try the sample quiz (one of every round)
        </button>
      </section>

      {data.quizzes.length > 0 && (
        <section aria-labelledby="mine-h" className="flex flex-col gap-2">
          <h2 id="mine-h" className="text-lg font-extrabold">
            Your quizzes
          </h2>
          <ul className="flex flex-col gap-2">
            {data.quizzes.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{q.title}</p>
                  <p className="text-sm text-slate-600">
                    {q.rounds.length} rounds · {q.teams.length} teams
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => go({ name: "host", id: q.id, round: 0 })}
                  disabled={!q.rounds.length}
                  className={primary}
                >
                  <Play size={16} aria-hidden="true" />
                  Host
                </button>
                <button
                  type="button"
                  onClick={() => go({ name: "edit", id: q.id })}
                  className={ghost}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => go({ name: "scores", id: q.id })}
                  className={ghost}
                  aria-label={`Scores for ${q.title}`}
                >
                  <Trophy size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirm(`Delete ${q.title}?`) &&
                    onChange({ ...data, quizzes: data.quizzes.filter((x) => x.id !== q.id) })
                  }
                  aria-label={`Delete ${q.title}`}
                  className="grid size-11 place-items-center rounded-xl text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="kinds-h" className="flex flex-col gap-2">
        <h2 id="kinds-h" className="text-lg font-extrabold">
          Rounds you can build
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((k) => (
            <li key={k.kind} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="font-bold">{k.label}</p>
              <p className="text-sm text-slate-700">{k.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <DataBackup
        filename="quiz-tracker.json"
        data={data}
        parse={parseQuizData}
        onRestore={onChange}
        beforeExport={beforeExport}
      />
    </div>
  );
}
