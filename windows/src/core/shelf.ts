// File Shelf state & logic
// Implements Nusa-style temporary drag-and-drop storage inside the notch

export interface ShelfItem {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  isDirectory: boolean;
  addedAt: number;
}

export interface ShelfConfig {
  clearOnStartup: boolean;
}

const STORAGE_KEY = "coucou_nusa_shelf";
const CONFIG_KEY = "coucou_nusa_shelf_config";

export class ShelfManager {
  private items: ShelfItem[] = [];
  private config: ShelfConfig = { clearOnStartup: true };
  private listeners: Set<(items: ShelfItem[]) => void> = new Set();

  constructor() {
    this.loadConfig();
    this.loadItems();
  }

  private loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        this.config = { ...this.config, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore
    }
  }

  private loadItems() {
    if (this.config.clearOnStartup) {
      this.items = [];
      this.saveItems();
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.items = JSON.parse(raw);
      }
    } catch {
      this.items = [];
    }
  }

  private saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // Ignore
    }
  }

  public saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore
    }
  }

  public subscribe(fn: (items: ShelfItem[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.getItems());
    return () => this.listeners.delete(fn);
  }

  public getItems(): ShelfItem[] {
    return [...this.items];
  }

  public getConfig(): ShelfConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ShelfConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  public addFiles(newFiles: { name: string; path: string; sizeBytes?: number; isDirectory?: boolean }[]) {
    for (const f of newFiles) {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.items.push({
        id,
        name: f.name,
        path: f.path,
        sizeBytes: f.sizeBytes || 0,
        isDirectory: Boolean(f.isDirectory),
        addedAt: Date.now(),
      });
    }
    this.saveItems();
    this.notify();
  }

  public removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.saveItems();
    this.notify();
  }

  public clear() {
    this.items = [];
    this.saveItems();
    this.notify();
  }

  private notify() {
    const list = this.getItems();
    for (const listener of this.listeners) {
      listener(list);
    }
  }
}

export const shelf = new ShelfManager();
