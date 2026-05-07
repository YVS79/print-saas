import type { Canvas, FabricObject } from "fabric";
import { EventBus } from "./EventBus";
import { mmToPx } from "./canvasConfig";
import type { Slot } from "./types";

/**
 * SlotService — управление слотами шаблона.
 * - Отрисовка слотов на холсте
 * - Проверка, находится ли объект внутри слота
 * - Привязка фото к слоту
 */
export class SlotService {
  private canvas: Canvas | null = null;
  private fabric: typeof import("fabric") | null = null;

  constructor(private eventBus: EventBus) {}

  setCanvas(fabric: typeof import("fabric"), canvas: Canvas | null): void {
    this.fabric = fabric;
    this.canvas = canvas;
  }

  /**
   * Отрисовывает слоты шаблона на холсте.
   * Слоты — это пунктирные рамки серого цвета, невыбираемые.
   */
  drawSlots(slots: Slot[]): void {
    if (!this.canvas || !this.fabric) return;

    const { Rect } = this.fabric;

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

    this.canvas.renderAll();
  }

  /**
   * Возвращает слот, в который попадает точка (xPx, yPx).
   */
  getSlotAtPoint(slots: Slot[], xPx: number, yPx: number): Slot | null {
    for (const slot of slots) {
      const sx = mmToPx(slot.xMM);
      const sy = mmToPx(slot.yMM);
      const sw = mmToPx(slot.widthMM);
      const sh = mmToPx(slot.heightMM);

      if (xPx >= sx && xPx <= sx + sw && yPx >= sy && yPx <= sy + sh) {
        return slot;
      }
    }
    return null;
  }

  /**
   * Проверяет, находится ли Fabric-объект внутри указанного слота.
   */
  isObjectInSlot(obj: FabricObject, slot: Slot): boolean {
    const objLeft = obj.left ?? 0;
    const objTop = obj.top ?? 0;
    const objRight = objLeft + (obj.width ?? 0) * (obj.scaleX ?? 1);
    const objBottom = objTop + (obj.height ?? 0) * (obj.scaleY ?? 1);

    const slotLeft = mmToPx(slot.xMM);
    const slotTop = mmToPx(slot.yMM);
    const slotRight = slotLeft + mmToPx(slot.widthMM);
    const slotBottom = slotTop + mmToPx(slot.heightMM);

    return (
      objLeft >= slotLeft &&
      objTop >= slotTop &&
      objRight <= slotRight &&
      objBottom <= slotBottom
    );
  }

  /**
   * Находит все slot-объекты на холсте.
   */
  getSlotObjects(): FabricObject[] {
    if (!this.canvas) return [];
    return this.canvas.getObjects().filter((obj) => {
      return (obj as any).data?.role === "slot";
    }) as FabricObject[];
  }

  destroy(): void {
    this.canvas = null;
  }
}
