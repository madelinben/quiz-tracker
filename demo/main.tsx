import { createRoot } from "react-dom/client";
import { QuizApp } from "../src";
import "./demo.css";

createRoot(document.getElementById("root") as HTMLElement).render(<QuizApp />);
