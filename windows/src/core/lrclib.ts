// LRCLIB API client and LRC synchronized lyrics parser
// Provides real-time lyrics synchronization for Nusa & Coucou

export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface LyricResult {
  id?: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics: LyricLine[] | null;
  plainLyrics: string | null;
}

/**
 * Parses LRC formatted text (e.g. "[01:23.45] lyric line") into a sorted array of LyricLine objects.
 */
export function parseLRC(lrcText: string | null | undefined): LyricLine[] | null {
  if (!lrcText) return null;
  const lines = lrcText.split("\n");
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    timeRegex.lastIndex = 0;
    const matches: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const frac = match[3] || "0";
      const ms = frac.length === 2 ? parseInt(frac, 10) * 10 : parseInt(frac, 10);
      const totalMs = minutes * 60 * 1000 + seconds * 1000 + ms;
      matches.push(totalMs);
    }

    const cleanText = trimmed.replace(timeRegex, "").trim();
    if (matches.length > 0) {
      for (const timeMs of matches) {
        result.push({ timeMs, text: cleanText });
      }
    }
  }

  if (result.length === 0) return null;
  return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Finds the index of the currently active lyric line for a given playback position in milliseconds.
 */
export function findActiveLyricIndex(lyrics: LyricLine[] | null, currentPositionMs: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentPositionMs >= lyrics[i].timeMs) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}

/**
 * Queries LRCLIB for synchronized and plain lyrics.
 */
export async function fetchLyrics(
  trackName: string,
  artistName: string,
  albumName?: string,
  durationSec?: number
): Promise<LyricResult | null> {
  if (!trackName) return null;

  try {
    const url = new URL("https://lrclib.net/api/get");
    url.searchParams.set("track_name", trackName);
    if (artistName) url.searchParams.set("artist_name", artistName);
    if (albumName) url.searchParams.set("album_name", albumName);
    if (durationSec && durationSec > 0) url.searchParams.set("duration", Math.round(durationSec).toString());

    const resp = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Coucou-Nusa/1.1.0 (+https://github.com/johnycampos/coucou)",
      },
    });

    if (resp.status === 404) {
      // Fallback search
      return await searchLyricsFallback(trackName, artistName);
    }

    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      id: data.id,
      trackName: data.trackName || trackName,
      artistName: data.artistName || artistName,
      albumName: data.albumName,
      duration: data.duration,
      syncedLyrics: parseLRC(data.syncedLyrics),
      plainLyrics: data.plainLyrics || null,
    };
  } catch (err) {
    console.warn("Failed to fetch lyrics from LRCLIB:", err);
    return null;
  }
}

async function searchLyricsFallback(trackName: string, artistName: string): Promise<LyricResult | null> {
  try {
    const searchUrl = new URL("https://lrclib.net/api/search");
    searchUrl.searchParams.set("q", `${artistName} ${trackName}`.trim());
    const resp = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "Coucou-Nusa/1.1.0 (+https://github.com/johnycampos/coucou)",
      },
    });

    if (!resp.ok) return null;
    const items = await resp.json();
    if (!Array.isArray(items) || items.length === 0) return null;

    const best = items[0];
    return {
      id: best.id,
      trackName: best.trackName || trackName,
      artistName: best.artistName || artistName,
      albumName: best.albumName,
      duration: best.duration,
      syncedLyrics: parseLRC(best.syncedLyrics),
      plainLyrics: best.plainLyrics || null,
    };
  } catch {
    return null;
  }
}
