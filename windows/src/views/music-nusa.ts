// Nusa-style Music Player card (420px x 140px)
import { h } from "./dom";
import { Spotify, currentArtwork, spotifyPosition, type SpotifyState } from "../core/spotify";
import { Bridge } from "../core/bridge";
import { buildNusaDots } from "./nusa-dots";
import type { IslandViewName } from "../core/layout";

export interface MusicNusaActions {
  setView(view: IslandViewName): void;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function buildMusicNusaCard(actions: MusicNusaActions): {
  element: HTMLElement;
  update(s?: SpotifyState): void;
} {
  const root = h("div", { class: "nusa-card nusa-music-card" });

  const body = h("div", { class: "nusa-card-body" });
  const artImg = h("img", { class: "nusa-art-img", alt: "Album art" }) as HTMLImageElement;
  const artHolder = h("div", { class: "nusa-art-holder" }, artImg);

  const metaCol = h("div", { class: "nusa-meta-col" });
  const titleEl = h("div", { class: "nusa-track-title" });
  const artistEl = h("div", { class: "nusa-track-artist" });

  const progressRow = h("div", { class: "nusa-progress-row" });
  const elapsedEl = h("span", { class: "nusa-time nusa-time-elapsed" }, "00:00");
  const barTrack = h("div", { class: "nusa-bar-track" });
  const barFill = h("div", { class: "nusa-bar-fill" });
  barTrack.appendChild(barFill);
  const remainingEl = h("span", { class: "nusa-time nusa-time-remaining" }, "-00:00");
  progressRow.appendChild(elapsedEl);
  progressRow.appendChild(barTrack);
  progressRow.appendChild(remainingEl);

  metaCol.appendChild(titleEl);
  metaCol.appendChild(artistEl);
  metaCol.appendChild(progressRow);

  const controlsRow = h("div", { class: "nusa-controls-row" });

  const prevBtn = h("button", { class: "nusa-ctrl-btn", title: "Anterior", type: "button" }, "⏮");
  const playBtn = h("button", { class: "nusa-ctrl-btn nusa-play-btn", title: "Play/Pausa", type: "button" }, "▶");
  const nextBtn = h("button", { class: "nusa-ctrl-btn", title: "Próximo", type: "button" }, "⏭");
  const lyricsBtn = h("button", { class: "nusa-pill-btn", title: "Ver Letras", type: "button" }, "Letras");

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    void Bridge.spotifyControl("previous");
  });

  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    void Bridge.spotifyControl("playPause");
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    void Bridge.spotifyControl("next");
  });

  lyricsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    actions.setView("lyrics");
  });

  controlsRow.appendChild(prevBtn);
  controlsRow.appendChild(playBtn);
  controlsRow.appendChild(nextBtn);
  controlsRow.appendChild(lyricsBtn);

  body.appendChild(artHolder);
  body.appendChild(metaCol);
  body.appendChild(controlsRow);

  const dots = buildNusaDots("music", actions);

  root.appendChild(body);
  root.appendChild(dots);

  function update(state: SpotifyState = Spotify.state) {
    const track = state.track;
    if (!track) {
      titleEl.textContent = "Nenhuma música tocando";
      artistEl.textContent = "Abra o Spotify, YouTube ou seu player";
      artImg.style.display = "none";
      elapsedEl.textContent = "00:00";
      remainingEl.textContent = "-00:00";
      barFill.style.width = "0%";
      playBtn.textContent = "▶";
      return;
    }

    titleEl.textContent = track.title || "Música desconhecida";
    artistEl.textContent = track.artist || "Artista desconhecido";
    playBtn.textContent = state.playing ? "⏸" : "▶";

    const art = currentArtwork(state);
    if (art) {
      artImg.src = art;
      artImg.style.display = "block";
    } else {
      artImg.style.display = "none";
    }

    const pos = spotifyPosition(state, Date.now());
    const dur = track.duration || 1;
    elapsedEl.textContent = formatTime(pos);
    remainingEl.textContent = `-${formatTime(Math.max(0, dur - pos))}`;
    const pct = Math.min(100, Math.max(0, (pos / dur) * 100));
    barFill.style.width = `${pct}%`;
  }

  update();

  return {
    element: root,
    update,
  };
}
