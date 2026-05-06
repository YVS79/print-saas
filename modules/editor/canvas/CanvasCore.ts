import { Canvas, Rect } from "fabric";
import { EventBus } from "./EventBus";
import { mmToPx, getCanvasSize, type FormatKey } from "./canvasConfig";

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
   * Вставляем в самый низ холста (index 0).
   */
  drawTemplateGuides(): void {
    if (!this.canvas) return;

    const size = getCanvasSize(this.format, this.bleedMM);
    const bleedPx = mmToPx(this.bleedMM);

    // --- Safe zone (синяя пунктирная рамка внутри bleed) ---
    // Вставляем первой на index 0 (будет в самом низу)
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

    // Используем insertAt(index, ...objects) — Fabric.js 6 API
    // Сначала добавляем наверх, затем вставляем с нужным индексом
    this.canvas.insertAt(0, safeRect);
    this.canvas.insertAt(1, bleedRect);

    this.canvas.renderAll();
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
