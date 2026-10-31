// 5-dot pagination navigation bar for Nusa Dynamic Island
import { h } from "./dom";
import type { IslandViewName } from "../core/layout";

export interface DotsActions {
  setView(view: IslandViewName): void;
}

const DOT_VIEWS: { view: IslandViewName; title: string; icon: string }[] = [
  { view: "music", title: "Música", icon: "🎵" },
  { view: "pomodoro", title: "Pomodoro", icon: "⏱️" },
  { view: "water", title: "Água", icon: "💧" },
  { view: "shelf", title: "Shelf", icon: "📁" },
  { view: "tasks", title: "Tarefas", icon: "📝" },
];

export function buildNusaDots(activeView: IslandViewName, actions: DotsActions): HTMLElement {
  const container = h("div", { class: "nusa-dots-container" });

  for (const item of DOT_VIEWS) {
    const isCurrent = activeView === item.view || (item.view === "music" && activeView === "lyrics");
    const dot = h("button", {
      class: `nusa-dot ${isCurrent ? "active" : ""}`,
      title: item.title,
      type: "button",
    });

    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      actions.setView(item.view);
    });

    container.appendChild(dot);
  }

  return container;
}
