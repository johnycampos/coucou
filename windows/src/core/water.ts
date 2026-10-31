// Water / Hydration tracker state & logic
// Implements Nusa-style bottle tracking, daily goals, hourly charts and drink reminders

export interface WaterConfig {
  bottleMl: number;
  goalMl: number;
  startHour: number; // 0-23 (default 8)
  endHour: number;   // 0-23 (default 18)
  enabled: boolean;
}

export interface WaterState {
  day: string; // YYYYMMDD
  takenMl: number;
  inBottleMl: number;
  goalReached: boolean;
  hourlyHistory: number[]; // 24 hours
}

const DEFAULT_CONFIG: WaterConfig = {
  bottleMl: 500,
  goalMl: 1500,
  startHour: 8,
  endHour: 18,
  enabled: true,
};

const STORAGE_KEY = "coucou_nusa_water";

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export class WaterManager {
  private config: WaterConfig = DEFAULT_CONFIG;
  private state: WaterState = {
    day: getTodayString(),
    takenMl: 0,
    inBottleMl: 500,
    goalReached: false,
    hourlyHistory: new Array(24).fill(0),
  };
  private listeners: Set<(state: WaterState) => void> = new Set();

  constructor() {
    this.loadState();
    this.checkDayRoll();
  }

  private loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.config) this.config = { ...DEFAULT_CONFIG, ...parsed.config };
        if (parsed.state) {
          this.state = {
            ...this.state,
            ...parsed.state,
            hourlyHistory: parsed.state.hourlyHistory || new Array(24).fill(0),
          };
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
          state: this.state,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  private checkDayRoll() {
    const today = getTodayString();
    if (this.state.day !== today) {
      this.state.day = today;
      this.state.takenMl = 0;
      this.state.inBottleMl = this.config.bottleMl;
      this.state.goalReached = false;
      this.state.hourlyHistory = new Array(24).fill(0);
      this.saveState();
    }
  }

  public subscribe(fn: (state: WaterState) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  public getState(): WaterState {
    this.checkDayRoll();
    return { ...this.state };
  }

  public getConfig(): WaterConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<WaterConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
    this.notify();
  }

  public drink(amountMl: number = 250) {
    this.checkDayRoll();
    this.state.takenMl += amountMl;
    this.state.inBottleMl = Math.max(0, this.state.inBottleMl - amountMl);

    const hour = new Date().getHours();
    this.state.hourlyHistory[hour] = (this.state.hourlyHistory[hour] || 0) + amountMl;

    if (this.state.takenMl >= this.config.goalMl) {
      this.state.goalReached = true;
    }

    this.saveState();
    this.notify();
  }

  public refillBottle() {
    this.checkDayRoll();
    this.state.inBottleMl = this.config.bottleMl;
    this.saveState();
    this.notify();
  }

  public resetToday() {
    this.state.takenMl = 0;
    this.state.inBottleMl = this.config.bottleMl;
    this.state.goalReached = false;
    this.state.hourlyHistory = new Array(24).fill(0);
    this.saveState();
    this.notify();
  }

  private notify() {
    const s = this.getState();
    for (const listener of this.listeners) {
      listener(s);
    }
  }
}

export const water = new WaterManager();
