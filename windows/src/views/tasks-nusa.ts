// Nusa-style Tasks / To-do list card (420px x 140px)
import { h, clear } from "./dom";
import { tasks, type TaskItem } from "../core/tasks";
import { buildNusaDots } from "./nusa-dots";
import type { IslandViewName } from "../core/layout";

export interface TasksNusaActions {
  setView(view: IslandViewName): void;
}

export function buildTasksNusaCard(actions: TasksNusaActions): {
  element: HTMLElement;
  update(list?: TaskItem[]): void;
} {
  const root = h("div", { class: "nusa-card nusa-tasks-card" });

  const header = h("div", { class: "nusa-tasks-header" });
  const statsEl = h("div", { class: "nusa-tasks-stats" }, "0/0 Concluídas Hoje");
  header.appendChild(statsEl);

  const inputRow = h("div", { class: "nusa-tasks-input-row" });
  const taskInput = h("input", {
    class: "nusa-tasks-input",
    placeholder: "Adicionar nova tarefa... (Enter)",
    type: "text",
  }) as HTMLInputElement;

  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && taskInput.value.trim()) {
      tasks.addTask(taskInput.value.trim());
      taskInput.value = "";
    }
  });

  inputRow.appendChild(taskInput);

  const listContainer = h("div", { class: "nusa-tasks-list" });

  const dots = buildNusaDots("tasks", actions);

  root.appendChild(header);
  root.appendChild(inputRow);
  root.appendChild(listContainer);
  root.appendChild(dots);

  function update(taskList: TaskItem[] = tasks.getTasks()) {
    const stats = tasks.getStats();
    statsEl.textContent = `${stats.completedToday}/${stats.total} Tarefas Concluídas`;

    clear(listContainer);

    if (taskList.length === 0) {
      listContainer.appendChild(h("div", { class: "nusa-tasks-empty" }, "Nenhuma tarefa pendente"));
      return;
    }

    for (const item of taskList) {
      const row = h("div", { class: `nusa-task-row ${item.completed ? "completed" : ""}` });

      const check = h("button", {
        class: `nusa-task-check ${item.completed ? "checked" : ""}`,
        type: "button",
      }, item.completed ? "✓" : "");

      check.addEventListener("click", (e) => {
        e.stopPropagation();
        tasks.toggleTask(item.id);
      });

      const title = h("span", { class: "nusa-task-title" }, item.title);

      const delBtn = h("button", { class: "nusa-task-del", title: "Excluir", type: "button" }, "✕");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        tasks.deleteTask(item.id);
      });

      row.appendChild(check);
      row.appendChild(title);
      row.appendChild(delBtn);

      listContainer.appendChild(row);
    }
  }

  tasks.subscribe((list) => update(list));

  return {
    element: root,
    update,
  };
}
