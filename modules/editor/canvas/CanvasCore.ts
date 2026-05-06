import { Canvas, Rect } from "fabric";
import { EventBus } from "./EventBus";
import { mmToPx, pxToMm, getCanvasSize, type FormatKey } from "./canvasConfig";
import type { Slot } from "./types";

export interface CanvasCoreOptions {
  format: FormatKey;
  bleedMM: number;
  eventBus: EventBus;
}

/**
 * CanvasCore — низкоуровневая работа с Fabric.js канвой:
 * - инициализация холста
 * - установка размера под формат A4/A3 + bleed
 * - zoom (масштабирование)
 * - отрисовка шаблонных линий (bleed, safe zone)
 * - setTemplate — загрузка шаблона со слотами
 * - destroy
 */
export class CanvasCore {
  public canvas: Canvas | null = null;
  private eventBus: EventBus;
  private format: FormatKey;
  private bleedMM: number;

  constructor(private options: CanvasCoreOptions) {
    this.eventBus = options.eventBus;
    this.format = options.format;
    this.bleedMM = options.bleedMM;
  }

  /**
   * Инициализирует Fabric.js канву на переданном HTML-элементе.
   */
  init(canvasEl: HTMLCanvasElement): void {
    const size = getCanvasSize(this.format, this.bleedMM);

    this.canvas = new Canvas(canvasEl, {
      width: size.widthPx,
      height: size.heightPx,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: false,
    });

    this.eventBus.emit("canvasSizeChanged", {
      width: size.widthPx,
      height: size.heightPx,
    });
  }

  /**
   * Устанавливает масштаб канвы.
   */
  setZoom(zoom: number): void {
    if (!this.canvas) return;
    this.canvas.setZoom(zoom);
    this.canvas.renderAll();
    this.eventBus.emit("zoomChanged", { zoom });
  }

  /**
   * Возвращает текущий масштаб.
   */
  getZoom(): number {
    return this.canvas?.getZoom() ?? 1;
  }

  /**
   * Возвращает размер холста в пикселях.
   */
  getSize(): { width: number; height: number } {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
    };
  }

  /**
   * Отрисовывает шаблонные элементы: область выпуска (bleed) и безопасную зону.
   */
  drawTemplateGuides(): void {
    if (!this.canvas) return;

    const size = getCanvasSize(this.format, this.bleedMM);
    const bleedPx = mmToPx(this.bleedMM);

    // --- Safe zone (синяя пунктирная рамка внутри bleed) ---
    const safeRect = new Rect({
      left: bleedPx,
      top: bleedPx,
      width: size.widthPx - bleedPx * 2,
      height: size.heightPx - bleedPx * 2,
      fill: "transparent",
      stroke: "blue",
      strokeWidth: 1,
      strokeDashArray: [6, 3] as any,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      data: { role: "template", type: "safe_zone" } as Record<string, unknown>,
    });

    // --- Bleed (красная рамка по краю холста) ---
    const bleedRect = new Rect({
      left: 0,
      top: 0,
      width: size.widthPx,
      height: size.heightPx,
      fill: "transparent",
      stroke: "red",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      data: { role: "template", type: "bleed" } as Record<string, unknown>,
    });

    this.canvas.insertAt(0, safeRect);
    this.canvas.insertAt(1, bleedRect);

    this.canvas.renderAll();
  }

  /**
   * Загружает шаблон: очищает холст от user/slot объектов,
   * перерисовывает направляющие и слоты.
   * Вызывается при выборе нового шаблона.
   */
  setTemplate(slots: Slot[]): void {
    if (!this.canvas) return;

    // Удаляем все объекты, кроме template (bleed/safe zone)
    const toRemove = this.canvas.getObjects().filter((obj) => {
      const data = (obj as any).data;
      return data?.role !== "template";
    });
    toRemove.forEach((obj) => this.canvas!.remove(obj));

    // Отрисовываем слоты
    this.drawSlots(slots);

    this.canvas.renderAll();
    this.eventBus.emit("designLoaded", { isEmpty: slots.length === 0 });
  }

  /**
   * Отрисовывает слоты шаблона.
   */
  private drawSlots(slots: Slot[]): void {
    if (!this.canvas) return;

    slots.forEach((slot) => {
      const xPx = mmToPx(slot.xMM);
      const yPx = mmToPx(slot.yMM);
      const wPx = mmToPx(slot.widthMM);
      const hPx = mmToPx(slot.heightMM);

      const slotRect = new Rect({
        left: xPx,
        top: yPx,
        width: wPx,
        height: hPx,
        fill: "rgba(200, 200, 200, 0.15)",
        stroke: "#888888",
        strokeWidth: 1,
        strokeDashArray: [4, 4] as any,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        data: {
          role: "slot",
          slotId: slot.id,
          slotLabel: slot.label,
        } as Record<string, unknown>,
      });

      this.canvas!.add(slotRect);
    });
  }

  /**
   * Уничтожает канву и освобождает ресурсы.
   */
  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }
}

export type { FormatKey } from "./canvasConfig";
