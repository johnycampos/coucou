// Nusa-style Synced Lyrics card (Dual-pane 520px x 140px)
import { h, clear } from "./dom";
import { Spotify, currentArtwork, spotifyPosition, type SpotifyState } from "../core/spotify";
import { Bridge } from "../core/bridge";
import { fetchLyrics, findActiveLyricIndex, type LyricResult } from "../core/lrclib";
import { buildNusaDots } from "./nusa-dots";
import type { IslandViewName } from "../core/layout";

export interface LyricsNusaActions {
  setView(view: IslandViewName): void;
}

export function buildLyricsNusaCard(actions: LyricsNusaActions): {
  element: HTMLElement;
  update(s?: SpotifyState): void;
} {
  const root = h("div", { class: "nusa-card nusa-lyrics-card" });

  const container = h("div", { class: "nusa-lyrics-dual-pane" });

  // Left pane: Mini player
  const leftPane = h("div", { class: "nusa-lyrics-left" });
  const artImg = h("img", { class: "nusa-art-mini" }) as HTMLImageElement;
  const leftMeta = h("div", { class: "nusa-lyrics-meta" });
  const leftTitle = h("div", { class: "nusa-lyrics-title" });
  const leftArtist = h("div", { class: "nusa-lyrics-artist" });
  leftMeta.appendChild(leftTitle);
  leftMeta.appendChild(leftArtist);

  const leftControls = h("div", { class: "nusa-lyrics-ctrls" });
  const playBtn = h("button", { class: "nusa-ctrl-btn", type: "button" }, "▶");
  const backBtn = h("button", { class: "nusa-pill-btn", type: "button" }, "Música");

  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    void Bridge.spotifyControl("playPause");
  });

  backBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    actions.setView("music");
  });

  leftControls.appendChild(playBtn);
  leftControls.appendChild(backBtn);

  leftPane.appendChild(artImg);
  leftPane.appendChild(leftMeta);
  leftPane.appendChild(leftControls);

  // Right pane: Scrolling lyrics
  const rightPane = h("div", { class: "nusa-lyrics-right" });
  const scrollArea = h("div", { class: "nusa-lyrics-scroll" });
  rightPane.appendChild(scrollArea);

  container.appendChild(leftPane);
  container.appendChild(rightPane);

  const dots = buildNusaDots("lyrics", actions);

  root.appendChild(container);
  root.appendChild(dots);

  let currentTrackKey = "";
  let loadedLyrics: LyricResult | null = null;
  let lyricLineElements: HTMLElement[] = [];
  let currentActiveIndex = -1;

  async function loadLyricsForTrack(title: string, artist: string, album?: string, duration?: number) {
    const key = `${artist}-${title}`;
    if (key === currentTrackKey) return;
    currentTrackKey = key;
    clear(scrollArea);
    scrollArea.appendChild(h("div", { class: "nusa-lyrics-status" }, "Buscando letras no LRCLIB..."));

    loadedLyrics = await fetchLyrics(title, artist, album, duration);
    currentActiveIndex = -1;

    clear(scrollArea);
    lyricLineElements = [];

    if (!loadedLyrics || (!loadedLyrics.syncedLyrics && !loadedLyrics.plainLyrics)) {
      scrollArea.appendChild(h("div", { class: "nusa-lyrics-status" }, "Letras não disponíveis"));
      return;
    }

    if (loadedLyrics.syncedLyrics && loadedLyrics.syncedLyrics.length > 0) {
      for (let i = 0; i < loadedLyrics.syncedLyrics.length; i++) {
        const line = loadedLyrics.syncedLyrics[i];
        const lineEl = h("div", { class: "nusa-lyric-line" }, line.text || "♪");
        lineEl.addEventListener("click", (e) => {
          e.stopPropagation();
          void Bridge.spotifyControl("seek", line.timeMs / 1000);
        });
        scrollArea.appendChild(lineEl);
        lyricLineElements.push(lineEl);
      }
    } else if (loadedLyrics.plainLyrics) {
      const lines = loadedLyrics.plainLyrics.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        scrollArea.appendChild(h("div", { class: "nusa-lyric-line-plain" }, line));
      }
    }
  }

  function update(state: SpotifyState = Spotify.state) {
    const track = state.track;
    if (!track) {
      leftTitle.textContent = "Sem reprodução";
      leftArtist.textContent = "-";
      artImg.style.display = "none";
      clear(scrollArea);
      scrollArea.appendChild(h("div", { class: "nusa-lyrics-status" }, "Nenhuma música ativa"));
      return;
    }

    leftTitle.textContent = track.title;
    leftArtist.textContent = track.artist;
    playBtn.textContent = state.playing ? "⏸" : "▶";

    const art = currentArtwork(state);
    if (art) {
      artImg.src = art;
      artImg.style.display = "block";
    } else {
      artImg.style.display = "none";
    }

    void loadLyricsForTrack(track.title, track.artist, track.album, track.duration);

    // Sync active lyric line
    if (loadedLyrics && loadedLyrics.syncedLyrics && lyricLineElements.length > 0) {
      const posSec = spotifyPosition(state, Date.now());
      const posMs = posSec * 1000;
      const activeIdx = findActiveLyricIndex(loadedLyrics.syncedLyrics, posMs);

      if (activeIdx !== currentActiveIndex) {
        if (currentActiveIndex >= 0 && lyricLineElements[currentActiveIndex]) {
          lyricLineElements[currentActiveIndex].classList.remove("active");
        }
        currentActiveIndex = activeIdx;
        if (activeIdx >= 0 && lyricLineElements[activeIdx]) {
          const el = lyricLineElements[activeIdx];
          el.classList.add("active");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }

  update();

  return {
    element: root,
    update,
  };
}
