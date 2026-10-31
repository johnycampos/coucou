// Nusa-style Water / Hydration card (420px x 140px)
import { h } from "./dom";
import { water, type WaterState } from "../core/water";
import { buildNusaDots } from "./nusa-dots";
import type { IslandViewName } from "../core/layout";

export interface WaterNusaActions {
  setView(view: IslandViewName): void;
}

export function buildWaterNusaCard(actions: WaterNusaActions): {
  element: HTMLElement;
  update(s?: WaterState): void;
} {
  const root = h("div", { class: "nusa-card nusa-water-card" });

  const body = h("div", { class: "nusa-card-body" });

  // Left bottle visual
  const bottleHolder = h("div", { class: "nusa-water-bottle-holder" });
  const bottleOutline = h("div", { class: "nusa-water-bottle-outline" });
  const bottleFill = h("div", { class: "nusa-water-bottle-fill" });
  bottleOutline.appendChild(bottleFill);
  const bottleText = h("div", { class: "nusa-water-bottle-text" }, "500 ml");
  bottleHolder.appendChild(bottleOutline);
  bottleHolder.appendChild(bottleText);

  // Right info and controls
  const infoCol = h("div", { class: "nusa-water-info" });
  const titleRow = h("div", { class: "nusa-water-title" }, "Lembrete de Água");
  const statsRow = h("div", { class: "nusa-water-stats" }, "0 / 1.5 L (0%)");
  const statusNote = h("div", { class: "nusa-water-note" }, "Hidrate-se regularmente!");

  const controlsRow = h("div", { class: "nusa-water-ctrls" });
  const drinkCupBtn = h("button", { class: "nusa-pill-btn nusa-primary-btn", type: "button" }, "+ Copo (250ml)");
  const refillBtn = h("button", { class: "nusa-pill-btn", type: "button" }, "Refil");
  const resetBtn = h("button", { class: "nusa-ctrl-btn", title: "Reiniciar dia", type: "button" }, "↺");

  drinkCupBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    water.drink(250);
  });

  refillBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    water.refillBottle();
  });

  resetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    water.resetToday();
  });

  controlsRow.appendChild(drinkCupBtn);
  controlsRow.appendChild(refillBtn);
  controlsRow.appendChild(resetBtn);

  infoCol.appendChild(titleRow);
  infoCol.appendChild(statsRow);
  infoCol.appendChild(statusNote);
  infoCol.appendChild(controlsRow);

  body.appendChild(bottleHolder);
  body.appendChild(infoCol);

  const dots = buildNusaDots("water", actions);

  root.appendChild(body);
  root.appendChild(dots);

  function update(state: WaterState = water.getState()) {
    const config = water.getConfig();
    const takenL = (state.takenMl / 1000).toFixed(1);
    const goalL = (config.goalMl / 1000).toFixed(1);
    const pct = Math.min(100, Math.round((state.takenMl / config.goalMl) * 100));

    statsRow.textContent = `${takenL} / ${goalL} L  (${pct}%)`;

    if (state.goalReached) {
      statusNote.textContent = "🎉 Meta diária alcançada! Parabéns!";
      statusNote.style.color = "#4ade80";
    } else {
      statusNote.textContent = "Hora de beber água e se cuidar.";
      statusNote.style.color = "#8c94a8";
    }

    bottleText.textContent = `${state.inBottleMl} ml`;
    const bottlePct = Math.min(100, Math.max(0, (state.inBottleMl / config.bottleMl) * 100));
    bottleFill.style.height = `${bottlePct}%`;
  }

  water.subscribe((s) => update(s));

  return {
    element: root,
    update,
  };
}
