import { type Canvas, type FabricObject } from "fabric";
import { EventBus } from "./EventBus";
import { normalizeObject } from "./object-service";
import type { ObjectInfo } from "./types";

/**
 * SelectionService — управление выделением на холсте.
 * - Отслеживает активный объект
 * - Нормализует выделенные объекты в ObjectInfo
 * - Использует debounce для синхронизации с React
 */
export class SelectionService {
  private canvas: Canvas | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 50;

  constructor(private eventBus: EventBus) {}

  /** Устанавливает ссылку на канву и подписывается на события выделения. */
  setCanvas(canvas: Canvas | null): void {
    this.detachListeners();
    this.canvas = canvas;
    this.attachListeners();
  }

  private attachListeners(): void {
    if (!this.canvas) return;

    this.canvas.on("selection:created", () => this.handleSelectionChange());
    this.canvas.on("selection:updated", () => this.handleSelectionChange());
    this.canvas.on("selection:cleared", () => this.handleSelectionChange());
    this.canvas.on("object:modified", () => this.handleSelectionChange());
  }

  private detachListeners(): void {
    if (!this.canvas) return;
    this.canvas.off("selection:created");
    this.canvas.off("selection:updated");
    this.canvas.off("selection:cleared");
    this.canvas.off("object:modified");
  }

  private handleSelectionChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncSelection();
    }, this.debounceMs);
  }

  /** Нормализует выделенные объекты и эмитит событие. */
  private syncSelection(): void {
    if (!this.canvas) return;

    const activeObjects = this.canvas.getActiveObjects();
    const objectIds: string[] = [];

    const filtered = activeObjects.filter((obj) => {
      const role = (obj as any).data?.role;
      return role === undefined || role === "user";
    });

    filtered.map((obj) => {
      const info = normalizeObject(obj as FabricObject, this.canvas!);
      objectIds.push(info.id);
    });

    this.eventBus.emit("selectionChanged", { objectIds });
  }

  /**
   * Возвращает нормализованную информацию о выделенных объектах.
   */
  getActiveObjectInfos(): ObjectInfo[] {
    if (!this.canvas) return [];
    const active = this.canvas.getActiveObjects();
    return active
      .filter((obj) => {
        const role = (obj as any).data?.role;
        return role === undefined || role === "user";
      })
      .map((obj) => normalizeObject(obj as FabricObject, this.canvas!));
  }

  /**
   * Снимает выделение со всех объектов.
   */
  clearSelection(): void {
    if (!this.canvas) return;
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  /**
   * Выделяет объект по ID.
   */
  selectById(objectId: string): void {
    if (!this.canvas) return;
    const target = this.canvas
      .getObjects()
      .find((obj) => (obj as any).data?.objectId === objectId);
    if (target) {
      this.canvas.setActiveObject(target);
      this.canvas.renderAll();
    }
  }

  /** Уничтожает сервис (отписывается от событий). */
  destroy(): void {
    this.detachListeners();
    this.canvas = null;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
