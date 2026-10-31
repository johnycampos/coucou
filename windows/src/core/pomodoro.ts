// Pomodoro focus timer state & logic
// Implements Nusa-style focus sessions, short breaks, long breaks and chimes

export type PomodoroMode = "focus" | "short_break" | "long_break";

export interface PomodoroConfig {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakInterval: number; // after how many focus sessions
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeftSec: number;
  totalDurationSec: number;
  isRunning: boolean;
  sessionsCompletedToday: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakInterval: 4,
};

const STORAGE_KEY = "coucou_nusa_pomodoro";

export class PomodoroManager {
  private config: PomodoroConfig = DEFAULT_CONFIG;
  private state: PomodoroState = {
    mode: "focus",
    timeLeftSec: 25 * 60,
    totalDurationSec: 25 * 60,
    isRunning: false,
    sessionsCompletedToday: 0,
  };
  private timerId: number | null = null;
  private listeners: Set<(state: PomodoroState) => void> = new Set();
  private onPhaseEndCallback?: (completedMode: PomodoroMode, nextMode: PomodoroMode) => void;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.config) this.config = { ...DEFAULT_CONFIG, ...parsed.config };
        if (parsed.sessionsCompletedToday !== undefined) {
          this.state.sessionsCompletedToday = parsed.sessionsCompletedToday;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          config: this.config,
          sessionsCompletedToday: this.state.sessionsCompletedToday,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  public subscribe(fn: (state: PomodoroState) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  public setOnPhaseEnd(cb: (completedMode: PomodoroMode, nextMode: PomodoroMode) => void) {
    this.onPhaseEndCallback = cb;
  }

  public getState(): PomodoroState {
    return { ...this.state };
  }

  public getConfig(): PomodoroConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PomodoroConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (!this.state.isRunning) {
      this.reset();
    }
    this.saveState();
  }

  public start() {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    this.notify();

    this.timerId = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  public pause() {
    if (!this.state.isRunning) return;
    this.state.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public toggle() {
    if (this.state.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  public reset() {
    this.pause();
    const duration = this.getDurationForMode(this.state.mode);
    this.state.timeLeftSec = duration;
    this.state.totalDurationSec = duration;
    this.notify();
  }

  public setMode(mode: PomodoroMode) {
    this.pause();
    this.state.mode = mode;
    const duration = this.getDurationForMode(mode);
    this.state.timeLeftSec = duration;
    this.state.totalDurationSec = duration;
    this.notify();
  }

  public skip() {
    this.advancePhase();
  }

  private tick() {
    if (this.state.timeLeftSec > 0) {
      this.state.timeLeftSec -= 1;
      this.notify();
    } else {
      this.advancePhase();
    }
  }

  private advancePhase() {
    const prevMode = this.state.mode;
    let nextMode: PomodoroMode = "focus";

    if (prevMode === "focus") {
      this.state.sessionsCompletedToday += 1;
      this.saveState();
      if (this.state.sessionsCompletedToday % this.config.longBreakInterval === 0) {
        nextMode = "long_break";
      } else {
        nextMode = "short_break";
      }
    } else {
      nextMode = "focus";
    }

    this.setMode(nextMode);

    if (this.onPhaseEndCallback) {
      this.onPhaseEndCallback(prevMode, nextMode);
    }
  }

  private getDurationForMode(mode: PomodoroMode): number {
    switch (mode) {
      case "focus":
        return this.config.focusMin * 60;
      case "short_break":
        return this.config.shortBreakMin * 60;
      case "long_break":
        return this.config.longBreakMin * 60;
    }
  }

  private notify() {
    const s = this.getState();
    for (const listener of this.listeners) {
      listener(s);
    }
  }
}

export const pomodoro = new PomodoroManager();
