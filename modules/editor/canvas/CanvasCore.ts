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

  constructor(private options: CanvasCoreOptions) {
    this.eventBus = options.eventBus;
    this.format = options.format;
    this.bleedMM = options.bleedMM;
  }

  async init(canvasEl: HTMLCanvasElement): Promise<void> {
    const fabric = await getFabric();
    this.fabric = fabric;

    const size = getCanvasSize(this.format, this.bleedMM);
    canvasEl.width = size.widthPx;
    canvasEl.height = size.heightPx;

    this.canvas = new fabric.Canvas(canvasEl, {
      width: size.widthPx,
      height: size.heightPx,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: false,
    });

    this.eventBus.emit("canvasSizeChanged", { width: size.widthPx, height: size.heightPx });

    // Канвас — фиксированный CSS-размер, без зума канваса
    // Разрешение (буфер) меняется только при A4/A3
    requestAnimationFrame(() => {
      this.fitToContainer();
      this.drawTemplateGuides();
    });
  }

  /** Фиксирует CSS-размер канваса по контейнеру, viewportTransform = identity */
  fitToContainer(): void {
    if (!this.canvas) return;

    const canvasEl = this.canvas.getElement();
    const wrapper = canvasEl.parentElement;
    if (!wrapper) return;
    const parent = wrapper.parentElement;
    if (!parent) return;

    const parentW = parent.clientWidth;
    const parentH = parent.clientHeight;
    if (parentW === 0 || parentH === 0) return;

    // CSS размер канваса = контейнер
    canvasEl.style.width = parentW + 'px';
    canvasEl.style.height = parentH + 'px';
    wrapper.style.width = parentW + 'px';
    wrapper.style.height = parentH + 'px';

    // Без зума — viewportTransform identity
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    this.canvas.requestRenderAll();
    this.eventBus.emit("zoomChanged", { zoom: 1 });
  }

  /** Масштабирует все user-объекты на холсте (не канвас) */
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

  getSize(): { width: number; height: number } {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
    };
  }

  drawTemplateGuides(): void {
    if (!this.canvas || !this.fabric) return;
    const { Rect } = this.fabric;
    const size = getCanvasSize(this.format, this.bleedMM);

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
    const size = getCanvasSize(format, bleedMM);
    this.canvas.setWidth(size.widthPx);
    this.canvas.setHeight(size.heightPx);
    const el = this.canvas.getElement();
    el.width = size.widthPx;
    el.height = size.heightPx;
    const toRemove = this.canvas.getObjects().filter((obj) => {
      const role = (obj as any).data?.role;
      return role === "template" || role === "slot";
    });
    toRemove.forEach((obj) => this.canvas!.remove(obj));
    this.drawTemplateGuides();
    this.canvas.renderAll();
    this.fitToContainer();
    this.eventBus.emit("canvasSizeChanged", { width: size.widthPx, height: size.heightPx });
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }
}

export type { FormatKey } from "./canvasConfig";
