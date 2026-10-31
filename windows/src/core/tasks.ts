// Tasks & To-do list state & logic
// Implements Nusa-style quick to-do management in the notch

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  dueTime?: string; // e.g. "14:30"
}

export interface TaskStats {
  total: number;
  completedToday: number;
}

const STORAGE_KEY = "coucou_nusa_tasks";

export class TasksManager {
  private tasks: TaskItem[] = [];
  private listeners: Set<(tasks: TaskItem[]) => void> = new Set();

  constructor() {
    this.loadTasks();
  }

  private loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.tasks = JSON.parse(raw);
      }
    } catch {
      this.tasks = [];
    }
  }

  private saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    } catch {
      // Ignore
    }
  }

  public subscribe(fn: (tasks: TaskItem[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.getTasks());
    return () => this.listeners.delete(fn);
  }

  public getTasks(): TaskItem[] {
    return [...this.tasks];
  }

  public getStats(): TaskStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfTodayMs = today.getTime();

    const completedToday = this.tasks.filter(
      (t) => t.completed && t.completedAt && t.completedAt >= startOfTodayMs
    ).length;

    return {
      total: this.tasks.length,
      completedToday,
    };
  }

  public addTask(title: string, dueTime?: string): TaskItem {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTask: TaskItem = {
      id,
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
      dueTime: dueTime ? dueTime.trim() : undefined,
    };
    this.tasks.unshift(newTask);
    this.saveTasks();
    this.notify();
    return newTask;
  }

  public toggleTask(id: string) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : undefined;
    this.saveTasks();
    this.notify();
  }

  public editTask(id: string, title: string, dueTime?: string) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.title = title.trim();
    task.dueTime = dueTime ? dueTime.trim() : undefined;
    this.saveTasks();
    this.notify();
  }

  public deleteTask(id: string) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveTasks();
    this.notify();
  }

  private notify() {
    const list = this.getTasks();
    for (const listener of this.listeners) {
      listener(list);
    }
  }
}

export const tasks = new TasksManager();
