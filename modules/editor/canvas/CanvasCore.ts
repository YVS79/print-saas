import { EventBus } from "./EventBus";
import { getCanvasSize, type FormatKey } from "./canvasConfig";
import type { Slot } from "./types";
import { getFabric } from "./getFabric";

export interface CanvasCoreOptions {
  format: FormatKey;
  bleedMM: number;
  eventBus: EventBus;
}

export class CanvasCore {
  public canvas: import("fabric").Canvas | null = null;
  private fabric: typeof import("fabric") | null = null;
  private eventBus: EventBus;
  private format: FormatKey;
  private bleedMM: number;
  /** Множитель масштаба объектов (не канваса). 1 = оригинальный размер */
  private objectScale: number = 1;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private options: CanvasCoreOptions) {
    this.eventBus = options.eventBus;
    this.format = options.format;
    this.bleedMM = options.bleedMM;
  }

  async init(canvasEl: HTMLCanvasElement): Promise<void> {
    const fabric = await getFabric();
    this.fabric = fabric;

    // Начальный размер buffer — 1×1, потом fitToContainer установит реальный размер
    canvasEl.width = 1;
    canvasEl.height = 1;

    this.canvas = new fabric.Canvas(canvasEl, {
      width: 1,
      height: 1,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: false,
    });

    this.eventBus.emit("canvasSizeChanged", {
      width: 1,
      height: 1,
    });

    // Дожидаемся, пока DOM layout завершится, затем fit + guides + observer
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.fitToContainer();
        this.drawTemplateGuides();
        this.setupResizeObserver();
      });
    });
  }

  // ---------- ResizeObserver ----------

  private setupResizeObserver(): void {
    this.teardownResizeObserver();

    const parent = this.getContainer();
    if (!parent) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.resizeTimer) return;
      this.resizeTimer = setTimeout(() => {
        this.resizeTimer = null;
        if (this.canvas && entries.length > 0) {
          this.fitToContainer();
        }
      }, 80);
    });

    this.resizeObserver.observe(parent);
  }

  private teardownResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  }

  // ---------- Container helpers ----------

  /**
   * Возвращает родительский контейнер (не .canvas-container, а наш Layout-контейнер).
   */
  private getContainer(): HTMLElement | null {
    if (!this.canvas) return null;
    const el = this.canvas.getElement();
    const wrapper = el.parentElement; // .canvas-container
    if (!wrapper) return null;
    const parent = wrapper.parentElement; // наш layout-контейнер
    if (!parent) return null;
    return parent;
  }

  // ---------- Fit to container ----------

  /**
   * Подгоняет canvas под размер контейнера:
   * 1. Устанавливает buffer + CSS canvas = размер контейнера.
   * 2. Вычисляет zoom, чтобы A4-страница вписалась с центрированием.
   * 3. Применяет viewportTransform.
   */
  fitToContainer(): void {
    if (!this.canvas) return;
    const container = this.getContainer();
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    if (containerW === 0 || containerH === 0) return;

    // 1. Размер canvas = размер контейнера (И buffer, И CSS)
    this.canvas.setDimensions({
      width: containerW,
      height: containerH,
    });

    // 2. Размер страницы A4 (логические пиксели, 300 DPI с bleed)
    const pageSize = getCanvasSize(this.format, this.bleedMM);
    const pageW = pageSize.widthPx;
    const pageH = pageSize.heightPx;
    if (pageW === 0 || pageH === 0) return;

    // 3. Отступ внутри viewport (padding)
    const padding = 20;

    // 4. Zoom — вписать страницу в контейнер
    const zoom = Math.min(
      (containerW - padding * 2) / pageW,
      (containerH - padding * 2) / pageH,
    );

    // 5. Размер страницы после zoom
    const scaledW = pageW * zoom;
    const scaledH = pageH * zoom;

    // 6. Смещение для центрирования
    const offsetX = (containerW - scaledW) / 2;
    const offsetY = (containerH - scaledH) / 2;

    // 7. Применяем viewportTransform
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY]);

    // 8. Обновляем offset для корректной работы мыши
    this.canvas.calcOffset();
    this.canvas.requestRenderAll();

    // Сбрасываем objectScale при fitToContainer (переход в режим Fit)
    this.objectScale = 1;

    this.eventBus.emit("zoomChanged", { zoom });
  }

  // ---------- User zoom ----------

  /**
   * Масштабирует все user-объекты на холсте (не viewport).
   */
  setZoom(multiplier: number): void {
    if (!this.canvas) return;
    const ratio = multiplier / this.objectScale;
    this.objectScale = multiplier;

    const objects = this.canvas.getObjects();
    for (const obj of objects) {
      const role = (obj as any).data?.role;
      if (role === "template" || role === "slot") continue;
      obj.set({
        scaleX: (obj.scaleX ?? 1) * ratio,
        scaleY: (obj.scaleY ?? 1) * ratio,
        left: (obj.left ?? 0) * ratio,
        top: (obj.top ?? 0) * ratio,
      });
    }

    this.canvas.requestRenderAll();
    this.eventBus.emit("zoomChanged", { zoom: multiplier });
  }

  getZoom(): number {
    return this.objectScale;
  }

  getCanvas(): import("fabric").Canvas | null {
    return this.canvas;
  }

  /**
   * Возвращает логический размер холста (буфер, а не CSS).
   */
  getSize(): { width: number; height: number } {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
    };
  }

  // ---------- Guides ----------

  drawTemplateGuides(): void {
    if (!this.canvas || !this.fabric) return;
    const { Rect } = this.fabric;
    const size = getCanvasSize(this.format, this.bleedMM);

    // Половина strokeWidth для inset, чтобы stroke не выходил за границы rect
    const inset = 0.5;

    const bleedRect = new Rect({
      left: inset,
      top: inset,
      width: size.widthPx - inset * 2,
      height: size.heightPx - inset * 2,
      fill: "transparent",
      stroke: "red",
      strokeWidth: 1,
      strokeUniform: true,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      data: { role: "template", type: "bleed" } as Record<string, unknown>,
    });

    this.canvas.insertAt(0, bleedRect);
    this.canvas.renderAll();
  }

  setTemplate(slots: Slot[]): void {
    if (!this.canvas) return;
    const toRemove = this.canvas.getObjects().filter((obj) => {
      const data = (obj as any).data;
      return data?.role !== "template";
    });
    toRemove.forEach((obj) => this.canvas!.remove(obj));
    this.drawSlots(slots);
    this.canvas.renderAll();
    this.eventBus.emit("designLoaded", { isEmpty: slots.length === 0 });
  }

  private drawSlots(slots: Slot[]): void {
    if (!this.canvas || !this.fabric) return;
    const { Rect } = this.fabric;
    slots.forEach((slot) => {
      const xPx = (slot.xMM * 300) / 25.4;
      const yPx = (slot.yMM * 300) / 25.4;
      const wPx = (slot.widthMM * 300) / 25.4;
      const hPx = (slot.heightMM * 300) / 25.4;

      const slotRect = new Rect({
        left: xPx,
        top: yPx,
        width: wPx,
        height: hPx,
        fill: "rgba(200, 200, 200, 0.15)",
        stroke: "#888888",
        strokeWidth: 1,
        strokeUniform: true,
        strokeDashArray: [4, 4] as any,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        data: { role: "slot", slotId: slot.id, slotLabel: slot.label } as Record<string, unknown>,
      });
      this.canvas!.add(slotRect);
    });
  }

  setCanvasSize(format: FormatKey, bleedMM: number): void {
    if (!this.canvas) return;
    this.format = format;
    this.bleedMM = bleedMM;

    // Удаляем старые template/slot объекты
    const toRemove = this.canvas.getObjects().filter((obj) => {
      const role = (obj as any).data?.role;
      return role === "template" || role === "slot";
    });
    toRemove.forEach((obj) => this.canvas!.remove(obj));

    // Перерисовываем направляющие для нового формата
    this.drawTemplateGuides();
    this.canvas.renderAll();

    // Пересчитываем zoom и центрирование
    this.fitToContainer();

    const size = getCanvasSize(format, bleedMM);
    this.eventBus.emit("canvasSizeChanged", {
      width: size.widthPx,
      height: size.heightPx,
    });
  }

  destroy(): void {
    this.teardownResizeObserver();
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }
}

export type { FormatKey } from "./canvasConfig";
