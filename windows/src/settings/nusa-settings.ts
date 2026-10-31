// Nusa Extras settings page in Coucou preferences window
import { h } from "../views/dom";
import { pomodoro } from "../core/pomodoro";
import { water } from "../core/water";
import { shelf } from "../core/shelf";

export function renderNusaSettings(container: HTMLElement) {
  const root = h("div", { class: "notch-page nusa-settings-page" });

  // 1. Music & Lyrics
  const musicSec = h("div", { class: "setting-section" });
  musicSec.appendChild(h("h3", { class: "section-title" }, "🎵 Música & Letras"));
  const musicDesc = h("p", { class: "section-desc" }, "Sincronização em tempo real com o banco comunitário aberto LRCLIB.");
  musicSec.appendChild(musicDesc);

  const rowLyrics = h("div", { class: "setting-row" });
  rowLyrics.appendChild(h("span", { class: "row-label" }, "Buscar letras sincronizadas no LRCLIB"));
  const lyricsToggle = h("input", { type: "checkbox", checked: true }) as HTMLInputElement;
  rowLyrics.appendChild(lyricsToggle);
  musicSec.appendChild(rowLyrics);

  // 2. Pomodoro
  const pomoSec = h("div", { class: "setting-section" });
  pomoSec.appendChild(h("h3", { class: "section-title" }, "⏱️ Pomodoro"));
  const pomoDesc = h("p", { class: "section-desc" }, "Temporizadores de foco e descanso com alertas sonoros.");
  pomoSec.appendChild(pomoDesc);

  const pomoConfig = pomodoro.getConfig();

  const rowFocus = h("div", { class: "setting-row" });
  rowFocus.appendChild(h("span", { class: "row-label" }, "Duração do Foco (minutos)"));
  const focusInput = h("input", {
    type: "number",
    class: "setting-num-input",
    value: String(pomoConfig.focusMin),
    min: "5",
    max: "120",
  }) as HTMLInputElement;
  focusInput.addEventListener("change", () => {
    pomodoro.updateConfig({ focusMin: parseInt(focusInput.value, 10) || 25 });
  });
  rowFocus.appendChild(focusInput);
  pomoSec.appendChild(rowFocus);

  const rowBreak = h("div", { class: "setting-row" });
  rowBreak.appendChild(h("span", { class: "row-label" }, "Pausa Curta (minutos)"));
  const breakInput = h("input", {
    type: "number",
    class: "setting-num-input",
    value: String(pomoConfig.shortBreakMin),
    min: "1",
    max: "30",
  }) as HTMLInputElement;
  breakInput.addEventListener("change", () => {
    pomodoro.updateConfig({ shortBreakMin: parseInt(breakInput.value, 10) || 5 });
  });
  rowBreak.appendChild(breakInput);
  pomoSec.appendChild(rowBreak);

  // 3. Water
  const waterSec = h("div", { class: "setting-section" });
  waterSec.appendChild(h("h3", { class: "section-title" }, "💧 Hidratação & Lembrete de Água"));
  const waterDesc = h("p", { class: "section-desc" }, "Controle sua meta diária de ingestão de água.");
  waterSec.appendChild(waterDesc);

  const waterConfig = water.getConfig();

  const rowGoal = h("div", { class: "setting-row" });
  rowGoal.appendChild(h("span", { class: "row-label" }, "Meta Diária (ml)"));
  const goalInput = h("input", {
    type: "number",
    class: "setting-num-input",
    value: String(waterConfig.goalMl),
    step: "100",
    min: "500",
    max: "5000",
  }) as HTMLInputElement;
  goalInput.addEventListener("change", () => {
    water.updateConfig({ goalMl: parseInt(goalInput.value, 10) || 1500 });
  });
  rowGoal.appendChild(goalInput);
  waterSec.appendChild(rowGoal);

  const rowBottle = h("div", { class: "setting-row" });
  rowBottle.appendChild(h("span", { class: "row-label" }, "Tamanho da Garrafa (ml)"));
  const bottleInput = h("input", {
    type: "number",
    class: "setting-num-input",
    value: String(waterConfig.bottleMl),
    step: "50",
    min: "100",
    max: "2000",
  }) as HTMLInputElement;
  bottleInput.addEventListener("change", () => {
    water.updateConfig({ bottleMl: parseInt(bottleInput.value, 10) || 500 });
  });
  rowBottle.appendChild(bottleInput);
  waterSec.appendChild(rowBottle);

  // 4. File Shelf
  const shelfSec = h("div", { class: "setting-section" });
  shelfSec.appendChild(h("h3", { class: "section-title" }, "📁 File Shelf"));
  const shelfDesc = h("p", { class: "section-desc" }, "Gaveta de arquivos temporários drag-and-drop.");
  shelfSec.appendChild(shelfDesc);

  const shelfConfig = shelf.getConfig();
  const rowShelfClear = h("div", { class: "setting-row" });
  rowShelfClear.appendChild(h("span", { class: "row-label" }, "Limpar arquivos da gaveta ao reiniciar o Coucou"));
  const shelfClearToggle = h("input", {
    type: "checkbox",
    checked: shelfConfig.clearOnStartup,
  }) as HTMLInputElement;
  shelfClearToggle.addEventListener("change", () => {
    shelf.updateConfig({ clearOnStartup: shelfClearToggle.checked });
  });
  rowShelfClear.appendChild(shelfClearToggle);
  shelfSec.appendChild(rowShelfClear);

  root.appendChild(musicSec);
  root.appendChild(pomoSec);
  root.appendChild(waterSec);
  root.appendChild(shelfSec);

  container.appendChild(root);
}
