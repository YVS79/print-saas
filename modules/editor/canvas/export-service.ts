import { type Canvas, type FabricObject } from "fabric";
import { pxToMm } from "./canvasConfig";
import type { CanvasDesignObject, ObjectRole } from "./types";

/**
 * ExportService — конвертация между форматами (px/мм) и сериализация дизайна.
 * - toDesignJSON: Fabric-канва → CanvasDesignObject[] для отправки на бэкенд
 * - fromDesignJSON: CanvasDesignObject[] → данные для загрузки на канву
 * - toDataURL: экспорт канвы в изображение PNG
 */
export class ExportService {
  private canvas: Canvas | null = null;

  constructor() {}

  setCanvas(canvas: Canvas | null): void {
    this.canvas = canvas;
  }

  /**
   * Экспортирует все user-объекты с холста в массив CanvasDesignObject.
   * Template и slot объекты исключаются.
   */
  toDesignJSON(): CanvasDesignObject[] {
    if (!this.canvas) return [];

    return this.canvas
      .getObjects()
      .filter((obj) => {
        const role = (obj as any).data?.role;
        return role === undefined || role === "user";
      })
      .map((obj) => this.objectToDesignObject(obj as FabricObject))
      .filter(Boolean) as CanvasDesignObject[];
  }

  /**
   * Загружает массив CanvasDesignObject на холст.
   * Очищает существующие user-объекты, затем добавляет новые.
   */
  fromDesignJSON(objects: CanvasDesignObject[]): void {
    if (!this.canvas) return;

    // Удаляем все user-объекты
    const userObjects = this.canvas.getObjects().filter((obj) => {
      const role = (obj as any).data?.role;
      return role === undefined || role === "user";
    });
    userObjects.forEach((obj) => this.canvas!.remove(obj));

    // Добавляем объекты из JSON
    // TODO: имплементировать через ObjectService после интеграции
    this.canvas.renderAll();
  }

  /**
   * Экспортирует канву в DataURL (PNG) с заданным множителем DPI.
   * Для 300 DPI при стандартном экране (96 DPI) используем multiplier = 300/96 ≈ 3.125.
   */
  toDataURL(multiplier: number = 1): string {
    if (!this.canvas) return "";
    return this.canvas.toDataURL({
      format: "png",
      multiplier,
      enableRetinaScaling: false,
    });
  }

  /**
   * Конвертирует один Fabric-объект в CanvasDesignObject.
   */
  private objectToDesignObject(obj: FabricObject): CanvasDesignObject | null {
    const data = (obj as any).data ?? {};
    const objectId: string = data.objectId ?? "";
    if (!objectId) return null;

    const base: CanvasDesignObject = {
      id: objectId,
      role: (data.role ?? "user") as ObjectRole,
      type: this.mapFabricType(obj.type ?? ""),
      xMM: pxToMm(obj.left ?? 0),
      yMM: pxToMm(obj.top ?? 0),
      widthMM: pxToMm((obj.width ?? 0) * (obj.scaleX ?? 1)),
      heightMM: pxToMm((obj.height ?? 0) * (obj.scaleY ?? 1)),
      rotationDeg: obj.angle ?? 0,
      opacity: obj.opacity ?? 1,
      zIndex: this.canvas?.getObjects().indexOf(obj) ?? 0,
    };

    if (base.type === "image") {
      base.assetId = data.assetId;
      base.crop = data.crop;
    }

    if (base.type === "text") {
      const textObj = obj as unknown as {
        text?: string;
        fontFamily?: string;
        fontSize?: number;
        fill?: string;
        textAlign?: string;
      };
      base.text = textObj.text ?? "";
      base.fontFamily = textObj.fontFamily ?? "Arial";
      base.fontSizePt = pxToMm(textObj.fontSize ?? 16);
      base.color = (textObj.fill as string) ?? "#000000";
      base.align = (textObj.textAlign as "left" | "center" | "right") ?? "left";
    }

    return base;
  }

  private mapFabricType(fabricType: string): "image" | "text" | "shape" {
    if (fabricType === "image") return "image";
    if (fabricType === "text" || fabricType === "textbox" || fabricType === "i-text")
      return "text";
    return "shape";
  }

  destroy(): void {
    this.canvas = null;
  }
}
