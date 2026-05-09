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

    this.canvas!.requestRenderAll();

    this.eventBus.emit("canvasSizeChanged", { width: size.widthPx, height: size.heightPx });
  }

  getCanvas(): import("fabric").Canvas | null {
    return this.canvas;
  }

  setZoom(zoom: number): void {
    if (!this.canvas || !this.fabric) return;
    const centerPoint = new this.fabric.Point(
      this.canvas.width! / 2,
      this.canvas.height! / 2
    );
    this.canvas.zoomToPoint(centerPoint, zoom);
    this.canvas.requestRenderAll();
    this.eventBus.emit("zoomChanged", { zoom });
  }

  getZoom(): number {
    return this.canvas?.getZoom() ?? 1;
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
    const bleedPx = (this.bleedMM * 300) / 25.4;

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
