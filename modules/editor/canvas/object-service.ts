import { FabricImage, FabricText, type Canvas, type FabricObject } from "fabric";
import { EventBus } from "./EventBus";
import type { ObjectInfo } from "./types";
import { mmToPx, pxToMm, ptToPx, pxToPt } from "./canvasConfig";

/** Генерирует уникальный ID для объектов на холсте. */
function generateId(): string {
  return crypto.randomUUID();
}

/** Находит Fabric-объект на холсте по его objectId в data. */
export function findObjectById(canvas: Canvas | null, objectId: string) {
  if (!canvas) return null;
  return (
    canvas
      .getObjects()
      .find((obj) => (obj as any).data?.objectId === objectId) ?? null
  );
}

/** Нормализует Fabric-объект в ObjectInfo (px → мм). */
export function normalizeObject(
  obj: FabricObject,
  canvas: Canvas,
): ObjectInfo {
  const data = (obj as any).data ?? {};
  const objects = canvas.getObjects();
  const zIndex = objects.indexOf(obj);

  const base: ObjectInfo = {
    id: data.objectId ?? "",
    type: mapFabricType(obj.type ?? ""),
    role: data.role ?? "user",
    xMM: pxToMm(obj.left ?? 0),
    yMM: pxToMm(obj.top ?? 0),
    widthMM: pxToMm((obj.width ?? 0) * (obj.scaleX ?? 1)),
    heightMM: pxToMm((obj.height ?? 0) * (obj.scaleY ?? 1)),
    rotationDeg: obj.angle ?? 0,
    opacity: obj.opacity ?? 1,
    zIndex,
  };

  // Дополнительные поля в зависимости от типа
  if (obj instanceof FabricImage) {
    base.assetId = data.assetId;
    base.type = "image";
  } else if (obj instanceof FabricText) {
    base.text = obj.text ?? "";
    base.fontFamily = obj.fontFamily;
    base.fontSizePt = pxToPt(obj.fontSize ?? 16);
    base.color = obj.fill as string;
    base.align = (obj.textAlign as "left" | "center" | "right") ?? "left";
  }

  return base;
}

function mapFabricType(fabricType: string): "image" | "text" | "shape" {
  if (fabricType === "image") return "image";
  if (fabricType === "text" || fabricType === "textbox" || fabricType === "i-text")
    return "text";
  return "shape";
}

/**
 * ObjectService — CRUD объектов на холсте (изображения, текст).
 * Работает через EventBus для уведомления остальных сервисов.
 */
export class ObjectService {
  private canvas: Canvas | null = null;

  constructor(private eventBus: EventBus) {}

  /** Устанавливает ссылку на канву (вызывается после init). */
  setCanvas(canvas: Canvas | null): void {
    this.canvas = canvas;
  }

  /**
   * Добавляет изображение на холст из URL.
   * Возвращает ID созданного объекта.
   */
  async addImage(
    url: string,
    options: {
      xMM: number;
      yMM: number;
      widthMM: number;
      heightMM: number;
      rotationDeg?: number;
      assetId?: string;
    },
  ): Promise<string> {
    if (!this.canvas) throw new Error("Canvas not initialized");

    const objectId = generateId();
    const img = await FabricImage.fromURL(url, {
      crossOrigin: "anonymous",
    });

    // Масштабируем под заданные размеры в мм
    const targetWidthPx = mmToPx(options.widthMM);
    const targetHeightPx = mmToPx(options.heightMM);
    img.set({
      left: mmToPx(options.xMM),
      top: mmToPx(options.yMM),
      scaleX: targetWidthPx / (img.width ?? 1),
      scaleY: targetHeightPx / (img.height ?? 1),
      angle: options.rotationDeg ?? 0,
      data: {
        objectId,
        role: "user",
        assetId: options.assetId,
      } as Record<string, unknown>,
    });

    this.canvas.add(img);
    this.canvas.renderAll();

    this.eventBus.emit("objectAdded", { objectId });
    return objectId;
  }

  /**
   * Добавляет текстовый объект на холст.
   * Возвращает ID созданного объекта.
   */
  addText(
    text: string,
    options: {
      xMM: number;
      yMM: number;
      widthMM?: number;
      fontSizePt?: number;
      fontFamily?: string;
      color?: string;
      align?: "left" | "center" | "right";
    },
  ): string {
    if (!this.canvas) throw new Error("Canvas not initialized");

    const objectId = generateId();
    const fontSizePx = ptToPx(options.fontSizePt ?? 24);

    const textObj = new FabricText(text, {
      left: mmToPx(options.xMM),
      top: mmToPx(options.yMM),
      fontSize: fontSizePx,
      fontFamily: options.fontFamily ?? "Arial",
      fill: options.color ?? "#000000",
      textAlign: options.align ?? "left",
      width: options.widthMM ? mmToPx(options.widthMM) : undefined,
      data: {
        objectId,
        role: "user",
      } as Record<string, unknown>,
    });

    this.canvas.add(textObj);
    this.canvas.renderAll();

    this.eventBus.emit("objectAdded", { objectId });
    return objectId;
  }

  /**
   * Обновляет свойства существующего объекта.
   * Принимает частичные данные в миллиметрах.
   */
  update(objectId: string, props: Partial<ObjectInfo>): void {
    if (!this.canvas) return;
    const obj = findObjectById(this.canvas, objectId);
    if (!obj) return;

    const fabricProps: Record<string, unknown> = {};

    if (props.xMM !== undefined) fabricProps.left = mmToPx(props.xMM);
    if (props.yMM !== undefined) fabricProps.top = mmToPx(props.yMM);
    if (props.widthMM !== undefined) {
      const scale = mmToPx(props.widthMM) / (obj.width ?? 1);
      fabricProps.scaleX = scale;
    }
    if (props.heightMM !== undefined) {
      const scale = mmToPx(props.heightMM) / (obj.height ?? 1);
      fabricProps.scaleY = scale;
    }
    if (props.rotationDeg !== undefined) fabricProps.angle = props.rotationDeg;
    if (props.opacity !== undefined) fabricProps.opacity = props.opacity;

    // Текстовые свойства
    if (props.text !== undefined && obj instanceof FabricText) {
      fabricProps.text = props.text;
    }
    if (props.fontSizePt !== undefined && obj instanceof FabricText) {
      fabricProps.fontSize = ptToPx(props.fontSizePt);
    }
    if (props.color !== undefined && obj instanceof FabricText) {
      fabricProps.fill = props.color;
    }
    if (props.align !== undefined && obj instanceof FabricText) {
      fabricProps.textAlign = props.align;
    }
    if (props.fontFamily !== undefined && obj instanceof FabricText) {
      fabricProps.fontFamily = props.fontFamily;
    }

    obj.set(fabricProps);
    this.canvas.renderAll();

    this.eventBus.emit("objectModified", { objectId });
  }

  /**
   * Удаляет объект с холста по ID.
   */
  delete(objectId: string): void {
    if (!this.canvas) return;
    const obj = findObjectById(this.canvas, objectId);
    if (!obj) return;

    this.canvas.remove(obj);
    this.canvas.renderAll();
    this.eventBus.emit("objectRemoved", { objectId });
  }

  /**
   * Возвращает нормализованную информацию об объекте.
   */
  getObjectInfo(objectId: string): ObjectInfo | null {
    if (!this.canvas) return null;
    const obj = findObjectById(this.canvas, objectId);
    if (!obj) return null;
    return normalizeObject(obj, this.canvas);
  }

  /**
   * Возвращает все user-объекты (не template и не slot).
   */
  getAllUserObjects(): ObjectInfo[] {
    if (!this.canvas) return [];
    return this.canvas
      .getObjects()
      .filter((obj) => {
        const role = (obj as any).data?.role;
        return role === undefined || role === "user";
      })
      .map((obj) => normalizeObject(obj, this.canvas!));
  }
}
