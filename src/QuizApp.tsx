import { useEffect, useRef, useState } from "react";
import { BingoCardView } from "./components/BingoCardView";
import { Editor } from "./components/Editor";
import { Home } from "./components/Home";
import { Host } from "./components/Host";
import { Scoreboard } from "./components/Scoreboard";
import { EMPTY, parseQuizData, type Quiz, type QuizData } from "./lib/quiz";
import { CARD_PREFIX } from "./lib/share";
import { type BeforeExport, load, save } from "./lib/storage";

const KEY = "quiz-tracker";

export type View =
  | { name: "home" }
  | { name: "edit"; id: string }
  | { name: "host"; id: string; round: number }
  | { name: "scores"; id: string };

export function QuizApp({ beforeExport }: { beforeExport?: BeforeExport }) {
  const [data, setData] = useState<QuizData>(EMPTY);
  const [view, setView] = useState<View>({ name: "home" });
  const [card, setCard] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Load after mount: localStorage and the URL hash only exist in the browser.
  useEffect(() => {
    setData(parseQuizData(load<unknown>(KEY, null)) ?? EMPTY);
    const hash = window.location.hash;
    if (hash.startsWith(CARD_PREFIX)) setCard(hash.slice(CARD_PREFIX.length));
    setReady(true);
  }, []);

  const update = (next: QuizData) => {
    setData(next);
    save(KEY, next);
  };
  const saveQuiz = (quiz: Quiz) =>
    update({
      ...data,
      quizzes: data.quizzes.map((q) =>
        q.id === quiz.id ? { ...quiz, updatedAt: new Date().toISOString() } : q
      ),
    });
  const go = (next: View) => {
    setView(next);
    scroller.current?.scrollTo(0, 0);
  };

  if (!ready) return <div className="h-full animate-pulse bg-slate-100" />;
  if (card) return <BingoCardView code={card} />;

  const quiz = "id" in view ? data.quizzes.find((q) => q.id === view.id) : undefined;

  return (
    <div ref={scroller} className="h-full overflow-y-auto bg-slate-50 text-slate-900">
      {view.name === "home" || !quiz ? (
        <Home data={data} onChange={update} go={go} beforeExport={beforeExport} />
      ) : view.name === "edit" ? (
        <Editor quiz={quiz} onChange={saveQuiz} go={go} />
      ) : view.name === "host" ? (
        <Host quiz={quiz} round={view.round} onChange={saveQuiz} go={go} />
      ) : (
        <Scoreboard quiz={quiz} onChange={saveQuiz} go={go} />
      )}
    </div>
  );
}
