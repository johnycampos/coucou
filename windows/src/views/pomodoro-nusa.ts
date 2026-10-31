// Nusa-style Pomodoro Focus Timer card (420px x 140px)
import { h } from "./dom";
import { pomodoro, type PomodoroState } from "../core/pomodoro";
import { buildNusaDots } from "./nusa-dots";
import type { IslandViewName } from "../core/layout";

export interface PomodoroNusaActions {
  setView(view: IslandViewName): void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function buildPomodoroNusaCard(actions: PomodoroNusaActions): {
  element: HTMLElement;
  update(s?: PomodoroState): void;
} {
  const root = h("div", { class: "nusa-card nusa-pomo-card" });

  const body = h("div", { class: "nusa-card-body" });

  // Left ring
  const ringHolder = h("div", { class: "nusa-pomo-ring-holder" });
  const ring = h("div", { class: "nusa-pomo-ring" });
  const timeText = h("div", { class: "nusa-pomo-time" }, "25:00");
  ringHolder.appendChild(ring);
  ringHolder.appendChild(timeText);

  // Right info and controls
  const infoCol = h("div", { class: "nusa-pomo-info" });
  const modeTitle = h("div", { class: "nusa-pomo-title" }, "Tempo de Foco");
  const sessionsSubtitle = h("div", { class: "nusa-pomo-sub" }, "Ciclo Pomodoro");

  const modePills = h("div", { class: "nusa-pomo-modes" });
  const focusPill = h("button", { class: "nusa-mini-pill active", type: "button" }, "Foco");
  const shortPill = h("button", { class: "nusa-mini-pill", type: "button" }, "Pausa");
  const longPill = h("button", { class: "nusa-mini-pill", type: "button" }, "Longa");

  focusPill.addEventListener("click", (e) => {
    e.stopPropagation();
    pomodoro.setMode("focus");
  });
  shortPill.addEventListener("click", (e) => {
    e.stopPropagation();
    pomodoro.setMode("short_break");
  });
  longPill.addEventListener("click", (e) => {
    e.stopPropagation();
    pomodoro.setMode("long_break");
  });

  modePills.appendChild(focusPill);
  modePills.appendChild(shortPill);
  modePills.appendChild(longPill);

  const controlsRow = h("div", { class: "nusa-pomo-ctrls" });
  const startBtn = h("button", { class: "nusa-pill-btn nusa-primary-btn", type: "button" }, "Iniciar");
  const skipBtn = h("button", { class: "nusa-ctrl-btn", title: "Pular fase", type: "button" }, "⏭");
  const resetBtn = h("button", { class: "nusa-ctrl-btn", title: "Reiniciar", type: "button" }, "↺");

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pomodoro.toggle();
  });

  skipBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pomodoro.skip();
  });

  resetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pomodoro.reset();
  });

  controlsRow.appendChild(startBtn);
  controlsRow.appendChild(skipBtn);
  controlsRow.appendChild(resetBtn);

  infoCol.appendChild(modeTitle);
  infoCol.appendChild(sessionsSubtitle);
  infoCol.appendChild(modePills);
  infoCol.appendChild(controlsRow);

  body.appendChild(ringHolder);
  body.appendChild(infoCol);

  const dots = buildNusaDots("pomodoro", actions);

  root.appendChild(body);
  root.appendChild(dots);

  function update(state: PomodoroState = pomodoro.getState()) {
    timeText.textContent = formatTime(state.timeLeftSec);
    startBtn.textContent = state.isRunning ? "Pausar" : "Iniciar";

    if (state.mode === "focus") {
      modeTitle.textContent = "Tempo de Foco";
      sessionsSubtitle.textContent = `Sessão ${state.sessionsCompletedToday + 1} de hoje`;
      focusPill.classList.add("active");
      shortPill.classList.remove("active");
      longPill.classList.remove("active");
    } else if (state.mode === "short_break") {
      modeTitle.textContent = "Pausa Curta";
      sessionsSubtitle.textContent = "Descanse a mente, 5 min";
      focusPill.classList.remove("active");
      shortPill.classList.add("active");
      longPill.classList.remove("active");
    } else {
      modeTitle.textContent = "Pausa Longa";
      sessionsSubtitle.textContent = "Você mereceu, 15 min";
      focusPill.classList.remove("active");
      shortPill.classList.remove("active");
      longPill.classList.add("active");
    }

    // Dynamic conic-gradient angle
    const total = state.totalDurationSec || 1;
    const progress = Math.max(0, Math.min(1, (total - state.timeLeftSec) / total));
    const deg = Math.floor(progress * 360);
    ring.style.background = `conic-gradient(from 200deg, #ff5a6e ${deg}deg, rgba(255,255,255,0.1) ${deg}deg)`;
  }

  pomodoro.subscribe((s) => update(s));

  return {
    element: root,
    update,
  };
}
