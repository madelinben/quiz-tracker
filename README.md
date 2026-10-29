# Quiz Tracker

Build and host any quiz or party game on one screen, with one scoreboard. Free, no sign-up, works offline once loaded.

Round types, mix as many as you like in one quiz:

| Round | Covers |
|---|---|
| **Questions** | Pub quiz, picture rounds (any image URL), multiple choice, true or false, music, closest wins. Add 10 ready-made questions from [Open Trivia DB](https://opentdb.com) (CC BY-SA 4.0) by category and difficulty |
| **Top 10 / name them all** | One prompt, answers revealed on a board. Ranked mode scores rarer answers higher (Pointless style) |
| **A to Z** | An answer for every letter on a topic |
| **Categories** | Roll a letter, answer every category with it (Scattergories style) |
| **Connections wall** | 16 tiles, four hidden groups of four, playable on screen |
| **Who am I?** | Clues from hard to easy; guessing earlier scores more |
| **Imposter** | Pass the phone: everyone sees the word except the imposter. Mystery mode gives the imposter a different word instead. Starter word packs |
| **Bingo** | Any topic. Each player opens their own card from a link (everything is in the link, nothing stored online); the host calls, players mark, lines are counted |
| **Auction draft** | Everyone has a budget and bids to build the best team, then the room votes |

- Teams or players: one list used for scores, auction bidders, imposter seats and bingo cards
- Jokers: each team doubles one round
- Host screen is dark with big type for a TV, full-screen button, per-round points underneath
- Try the sample quiz: one of every round
- Data stays in the browser (localStorage). Download a backup file and restore it on any device.

Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/quiz-tracker/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/quiz` (`QuizApp`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3111/quiz-tracker/
pnpm test         # logic unit tests
pnpm build:demo   # static site -> docs/
```

Package rules: no router/auth/app imports; Tailwind default palette only (no custom tokens); host must `@source` this folder. Peer deps: react, react-dom, lucide-react.

Host hook: `<QuizApp beforeExport={gate} />` runs `gate(label)` before a backup download or restore (e.g. an ad gate); reject to cancel.
