// Nusa-style File Shelf card (420px x 140px)
import { h, clear } from "./dom";
import { shelf, type ShelfItem } from "../core/shelf";
import { Bridge } from "../core/bridge";
import { buildNusaDots } from "./nusa-dots";
import type { IslandViewName } from "../core/layout";

export interface ShelfNusaActions {
  setView(view: IslandViewName): void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function buildShelfNusaCard(actions: ShelfNusaActions): {
  element: HTMLElement;
  update(items?: ShelfItem[]): void;
} {
  const root = h("div", { class: "nusa-card nusa-shelf-card" });

  const dropZone = h("div", { class: "nusa-shelf-dropzone" });

  const emptyState = h("div", { class: "nusa-shelf-empty" });
  const iconEl = h("div", { class: "nusa-shelf-icon" }, "📥");
  const promptEl = h("div", { class: "nusa-shelf-prompt" }, "Arraste arquivos aqui");
  const subPromptEl = h("div", { class: "nusa-shelf-sub" }, "Solte para guardar temporariamente no notch");
  emptyState.appendChild(iconEl);
  emptyState.appendChild(promptEl);
  emptyState.appendChild(subPromptEl);

  const fileList = h("div", { class: "nusa-shelf-list" });

  const headerRow = h("div", { class: "nusa-shelf-header" });
  const countEl = h("span", { class: "nusa-shelf-count" }, "0 arquivos");
  const clearBtn = h("button", { class: "nusa-pill-btn", type: "button" }, "Limpar");

  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    shelf.clear();
  });

  headerRow.appendChild(countEl);
  headerRow.appendChild(clearBtn);

  dropZone.appendChild(emptyState);
  dropZone.appendChild(headerRow);
  dropZone.appendChild(fileList);

  // Drag over events
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("hover");
    promptEl.textContent = "Solte para adicionar!";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("hover");
    promptEl.textContent = "Arraste arquivos aqui";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("hover");
    promptEl.textContent = "Arraste arquivos aqui";

    if (e.dataTransfer && e.dataTransfer.files) {
      const added: { name: string; path: string; sizeBytes: number }[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const path = (file as any).path || file.name;
        added.push({
          name: file.name,
          path,
          sizeBytes: file.size,
        });
      }
      if (added.length > 0) {
        shelf.addFiles(added);
      }
    }
  });

  const dots = buildNusaDots("shelf", actions);

  root.appendChild(dropZone);
  root.appendChild(dots);

  function update(items: ShelfItem[] = shelf.getItems()) {
    clear(fileList);

    if (items.length === 0) {
      emptyState.style.display = "flex";
      headerRow.style.display = "none";
      fileList.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    headerRow.style.display = "flex";
    fileList.style.display = "flex";
    countEl.textContent = `${items.length} ${items.length === 1 ? "arquivo" : "arquivos"}`;

    for (const item of items) {
      const itemRow = h("div", { class: "nusa-shelf-item" });
      const itemIcon = h("span", { class: "nusa-shelf-item-icon" }, item.isDirectory ? "📁" : "📄");
      const itemInfo = h("div", { class: "nusa-shelf-item-info" });
      const itemName = h("div", { class: "nusa-shelf-item-name", title: item.name }, item.name);
      const itemSize = h("div", { class: "nusa-shelf-item-size" }, formatBytes(item.sizeBytes));
      itemInfo.appendChild(itemName);
      itemInfo.appendChild(itemSize);

      const delBtn = h("button", { class: "nusa-shelf-del-btn", title: "Remover", type: "button" }, "✕");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        shelf.removeItem(item.id);
      });

      itemRow.appendChild(itemIcon);
      itemRow.appendChild(itemInfo);
      itemRow.appendChild(delBtn);

      itemRow.addEventListener("click", () => {
        const fileUrl = "file:///" + item.path.replace(/\\/g, "/");
        void Bridge.openUrl(fileUrl);
      });

      fileList.appendChild(itemRow);
    }
  }

  shelf.subscribe((items) => update(items));

  return {
    element: root,
    update,
  };
}
