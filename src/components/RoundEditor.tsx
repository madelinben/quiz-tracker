import { Download, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { WORD_PACKS } from "../lib/packs";
import { assertNever, type Clued, lines, type Question, type Round } from "../lib/quiz";
import { fetchTrivia, TRIVIA_CATEGORIES } from "../lib/trivia";
import { area, field, ghost, label } from "./ui";

/** Textarea of one item per line; keeps the raw text so blank lines survive while typing */
function LinesField({
  title,
  hint,
  value,
  onChange,
  rows = 6,
}: {
  title: string;
  hint?: string;
  value: readonly string[];
  onChange: (items: string[]) => void;
  rows?: number;
}) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <label className={label}>
      <span>
        {title} <span className="font-normal text-slate-600">({value.length})</span>
      </span>
      <textarea
        value={text}
        rows={rows}
        onChange={(e) => {
          setText(e.target.value);
          onChange(lines(e.target.value).map((l) => l.slice(0, 120)));
        }}
        className={area}
      />
      {hint && <span className="text-xs font-normal text-slate-600">{hint}</span>}
    </label>
  );
}

interface Props<R extends Round> {
  round: R;
  onChange: (r: Round) => void;
}

export function RoundEditor({ round, onChange }: Props<Round>) {
  switch (round.kind) {
    case "questions":
      return <QuestionsEditor round={round} onChange={onChange} />;
    case "list":
      return (
        <>
          <label className={label}>
            Prompt
            <input
              value={round.prompt}
              onChange={(e) => onChange({ ...round, prompt: e.target.value.slice(0, 200) })}
              placeholder="Name the 10 highest mountains in the UK"
              className={field}
            />
          </label>
          <LinesField
            title="Answers, one per line"
            value={round.answers}
            onChange={(answers) => onChange({ ...round, answers })}
          />
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={round.ranked}
              onChange={(e) => onChange({ ...round, ranked: e.target.checked })}
              className="size-5 accent-indigo-700"
            />
            Ranked: lower down the list scores more (Pointless style)
          </label>
        </>
      );
    case "alphabet":
      return (
        <label className={label}>
          Topic
          <input
            value={round.topic}
            onChange={(e) => onChange({ ...round, topic: e.target.value.slice(0, 80) })}
            placeholder="Football clubs, bands, things in a kitchen"
            className={field}
          />
        </label>
      );
    case "categories":
      return (
        <LinesField
          title="Categories, one per line"
          hint="On the night, roll a letter: every answer must start with it."
          value={round.categories}
          onChange={(categories) => onChange({ ...round, categories })}
        />
      );
    case "connect":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {round.groups.map((g, gi) => (
            <fieldset key={`group-${gi + 1}`} className="flex flex-col gap-1.5">
              <legend className="mb-1 text-sm font-semibold">Group {gi + 1}</legend>
              <input
                aria-label={`Group ${gi + 1} connection`}
                value={g.name}
                placeholder="The connection"
                onChange={(e) =>
                  onChange({
                    ...round,
                    groups: round.groups.map((x, j) =>
                      j === gi ? { ...x, name: e.target.value.slice(0, 60) } : x
                    ),
                  })
                }
                className={`${field} font-semibold`}
              />
              {g.items.map((item, ii) => (
                <input
                  key={`tile-${ii + 1}`}
                  aria-label={`Group ${gi + 1} tile ${ii + 1}`}
                  value={item}
                  onChange={(e) =>
                    onChange({
                      ...round,
                      groups: round.groups.map((x, j) =>
                        j === gi
                          ? {
                              ...x,
                              items: x.items.map((y, k) =>
                                k === ii ? e.target.value.slice(0, 30) : y
                              ),
                            }
                          : x
                      ),
                    })
                  }
                  className={field}
                />
              ))}
            </fieldset>
          ))}
        </div>
      );
    case "clues":
      return <CluesEditor round={round} onChange={onChange} />;
    case "imposter":
      return <ImposterEditor round={round} onChange={onChange} />;
    case "bingo":
      return (
        <LinesField
          title="Cells, one per line"
          hint="24 or more. Anything works: songs, film clichés, things spotted on a walk, quiz-night moments."
          value={round.cells}
          rows={8}
          onChange={(cells) => onChange({ ...round, cells })}
        />
      );
    case "auction":
      return (
        <>
          <LinesField
            title="Up for auction, one per line"
            hint="Players, foods, holiday spots, superpowers: anything people can build a team from."
            value={round.lots}
            onChange={(lots) => onChange({ ...round, lots })}
          />
          <div className="flex gap-3">
            <label className={label}>
              Budget each
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                value={round.budget}
                onChange={(e) =>
                  onChange({
                    ...round,
                    budget: Math.max(1, Math.min(10000, Number(e.target.value) || 1)),
                  })
                }
                className={`${field} w-28`}
              />
            </label>
            <label className={label}>
              Team size
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={round.squad}
                onChange={(e) =>
                  onChange({
                    ...round,
                    squad: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                  })
                }
                className={`${field} w-28`}
              />
            </label>
          </div>
        </>
      );
    default:
      return assertNever(round);
  }
}

function ImposterEditor({ round, onChange }: Props<Extract<Round, { kind: "imposter" }>>) {
  // A picked pack replaces the text: a new key remounts the textarea with it
  const [pack, setPack] = useState(0);
  return (
    <>
      <PackPicker
        onPick={(words) => {
          onChange({ ...round, words });
          setPack(pack + 1);
        }}
      />
      <LinesField
        key={pack}
        title="Secret words, one per line"
        hint="One is dealt each game. Players use the team list as seats."
        value={round.words}
        onChange={(words) => onChange({ ...round, words })}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={round.mystery}
          onChange={(e) => onChange({ ...round, mystery: e.target.checked })}
          className="size-5 accent-indigo-700"
        />
        Mystery mode: the imposter gets a different word and doesn't know
      </label>
    </>
  );
}

function PackPicker({ onPick }: { onPick: (words: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="w-full text-sm font-semibold">Start from a pack</span>
      {WORD_PACKS.map((p) => (
        <button
          key={p.name}
          type="button"
          onClick={() => onPick(p.words)}
          className="min-h-9 rounded-full px-3 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-100"
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

function QuestionsEditor({ round, onChange }: Props<Extract<Round, { kind: "questions" }>>) {
  const [category, setCategory] = useState(9);
  const [difficulty, setDifficulty] = useState<"" | "easy" | "medium" | "hard">("");
  const [status, setStatus] = useState("");
  const set = (questions: Question[]) => onChange({ ...round, questions });
  const patch = (i: number, change: Partial<Question>) =>
    set(round.questions.map((q, j) => (j === i ? { ...q, ...change } : q)));

  async function importTrivia() {
    setStatus("Fetching questions…");
    try {
      const added = await fetchTrivia(10, category, difficulty);
      set([...round.questions, ...added]);
      setStatus(`Added ${added.length} questions from Open Trivia DB (CC BY-SA 4.0).`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Couldn't reach Open Trivia DB.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {round.questions.map((q, i) => (
          <li
            key={`q-${i + 1}`}
            className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
          >
            <div className="flex items-start gap-2">
              <span className="pt-3 text-sm font-bold tabular-nums text-slate-600">{i + 1}</span>
              <label className={`${label} flex-1`}>
                <span className="sr-only">Question {i + 1}</span>
                <textarea
                  value={q.prompt}
                  rows={2}
                  placeholder="Question"
                  onChange={(e) => patch(i, { prompt: e.target.value.slice(0, 400) })}
                  className={area}
                />
              </label>
              <button
                type="button"
                onClick={() => set(round.questions.filter((_, j) => j !== i))}
                aria-label={`Delete question ${i + 1}`}
                className="grid size-11 place-items-center rounded-xl text-rose-700 hover:bg-rose-50"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                aria-label={`Answer ${i + 1}`}
                value={q.answer}
                placeholder="Answer"
                onChange={(e) => patch(i, { answer: e.target.value.slice(0, 200) })}
                className={field}
              />
              <input
                aria-label={`Picture URL for question ${i + 1} (optional)`}
                value={q.image ?? ""}
                type="url"
                placeholder="Picture URL (optional)"
                onChange={(e) => patch(i, { image: e.target.value.trim() || undefined })}
                className={field}
              />
              <input
                aria-label={`Choices for question ${i + 1}, separated by | (optional)`}
                value={(q.choices ?? []).join(" | ")}
                placeholder="Choices: A | B | C | D (optional)"
                onChange={(e) => {
                  const choices = e.target.value
                    .split("|")
                    .map((c) => c.trim())
                    .filter(Boolean);
                  patch(i, { choices: choices.length ? choices : undefined });
                }}
                className={`${field} sm:col-span-2`}
              />
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => set([...round.questions, { prompt: "", answer: "" }])}
        className={`${ghost} self-start`}
      >
        <Plus size={16} aria-hidden="true" />
        Add question
      </button>
      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
        <label className={label}>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            className={field}
          >
            {TRIVIA_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(
                (["easy", "medium", "hard"] as const).find((d) => d === e.target.value) ?? ""
              )
            }
            className={field}
          >
            <option value="">Mixed</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button type="button" onClick={importTrivia} className={ghost}>
          <Download size={16} aria-hidden="true" />
          Add 10 ready-made
        </button>
        <p role="status" className="w-full text-xs text-slate-700">
          {status}
        </p>
      </div>
    </div>
  );
}

function CluesEditor({ round, onChange }: Props<Extract<Round, { kind: "clues" }>>) {
  const set = (items: Clued[]) => onChange({ ...round, items });
  return (
    <div className="flex flex-col gap-3">
      {round.items.map((item, i) => (
        <div
          key={`clue-${i + 1}`}
          className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
        >
          <div className="flex gap-2">
            <input
              aria-label={`Answer ${i + 1}`}
              value={item.answer}
              placeholder="Answer: a person, place or thing"
              onChange={(e) =>
                set(
                  round.items.map((x, j) =>
                    j === i ? { ...x, answer: e.target.value.slice(0, 80) } : x
                  )
                )
              }
              className={`${field} flex-1 font-semibold`}
            />
            <button
              type="button"
              onClick={() => set(round.items.filter((_, j) => j !== i))}
              aria-label={`Delete answer ${i + 1}`}
              className="grid size-11 place-items-center rounded-xl text-rose-700 hover:bg-rose-50"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
          <LinesField
            title="Clues, hardest first"
            value={item.clues}
            rows={4}
            onChange={(clues) => set(round.items.map((x, j) => (j === i ? { ...x, clues } : x)))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => set([...round.items, { answer: "", clues: [] }])}
        className={`${ghost} self-start`}
      >
        <Plus size={16} aria-hidden="true" />
        Add an answer
      </button>
    </div>
  );
}
