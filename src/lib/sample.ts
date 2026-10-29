import { newQuiz, type Quiz, type Round } from "./quiz.ts";

/** Any round without its id (distributes over the union so each kind keeps its fields) */
type Draft<T extends Round = Round> = T extends Round ? Omit<T, "id"> : never;

const r = (round: Draft): Round => ({ ...round, id: crypto.randomUUID() });

/** A ready-to-play quiz with one round of every kind: shows what's possible, edit freely */
export function sampleQuiz(): Quiz {
  return {
    ...newQuiz("Sample quiz night"),
    teams: ["Quizteama Aguilera", "Les Quizerables", "Universally Challenged"],
    rounds: [
      r({
        kind: "questions",
        title: "General knowledge",
        questions: [
          { prompt: "What is the capital of Australia?", answer: "Canberra" },
          {
            prompt: "Which planet has the most moons?",
            answer: "Saturn",
            choices: ["Jupiter", "Saturn", "Uranus", "Neptune"],
          },
          {
            prompt: "A marathon is 26.2 miles.",
            answer: "True",
            choices: ["True", "False"],
          },
          {
            prompt: "Closest wins: how tall is Ben Nevis, in metres?",
            answer: "1,345 m",
          },
        ],
      }),
      r({
        kind: "list",
        title: "Name them all",
        prompt: "The planets of the Solar System, largest first",
        ranked: true,
        answers: ["Jupiter", "Saturn", "Uranus", "Neptune", "Earth", "Venus", "Mars", "Mercury"],
      }),
      r({ kind: "alphabet", title: "A to Z", topic: "Countries of the world" }),
      r({
        kind: "categories",
        title: "Categories",
        categories: ["A sport", "Something in a kitchen", "A band", "A city", "An animal"],
      }),
      r({
        kind: "connect",
        title: "Connections wall",
        groups: [
          { name: "Ways to cook an egg", items: ["Poached", "Scrambled", "Fried", "Boiled"] },
          {
            name: "Lake District lakes",
            items: ["Windermere", "Ullswater", "Coniston", "Buttermere"],
          },
          { name: "___ball", items: ["Net", "Hand", "Dodge", "Basket"] },
          { name: "Card games", items: ["Snap", "Rummy", "Bridge", "Patience"] },
        ],
      }),
      r({
        kind: "clues",
        title: "Who am I?",
        items: [
          {
            answer: "Mount Everest",
            clues: [
              "Climbers call my top the death zone",
              "My height grows a few millimetres a year",
              "Hillary and Tenzing stood on me in 1953",
              "I'm the highest mountain on Earth",
            ],
          },
        ],
      }),
      r({
        kind: "imposter",
        title: "Imposter",
        mystery: false,
        words: ["Beach", "Library", "Airport", "Cinema", "Gym", "Zoo", "Wedding", "Campsite"],
      }),
      r({
        kind: "bingo",
        title: "Pub quiz bingo",
        cells: [
          "Someone says 'it's on the tip of my tongue'",
          "A team changes their answer",
          "Phone hidden under the table",
          "Spelling dispute",
          "Somebody hums the answer",
          "Round of drinks",
          "A tie-break",
          "Quizmaster mispronounces a name",
          "Someone says 'I knew that!'",
          "An answer is 'Paris'",
          "Picture round argument",
          "Someone checks the rules",
          "Wrong team name read out",
          "Answer is a year",
          "Sports question nobody knows",
          "Crisps opened",
          "Team high-five",
          "'Can you repeat the question?'",
          "Pen runs out",
          "Joker played",
          "Music round dancing",
          "Somebody guesses 'Henry VIII'",
          "Last-minute answer swap",
          "Debate over half marks",
          "Score check",
          "A team blames autocorrect",
        ],
      }),
      r({
        kind: "auction",
        title: "Fantasy dinner party",
        budget: 20,
        squad: 3,
        lots: [
          "A historical figure",
          "A chef",
          "A comedian",
          "A sports legend",
          "A musician",
          "A scientist",
          "An explorer",
          "A film star",
          "A fictional detective",
          "A world leader",
        ],
      }),
    ],
  };
}
