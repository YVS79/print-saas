import type { Canvas, FabricObject } from "fabric";
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
  // Определяем через duck-typing, т.к. FabricImage/FabricText не импортируются напрямую
  if ((obj as any).text !== undefined) {
    const textObj = obj as unknown as {
      text?: string;
      fontFamily?: string;
      fontSize?: number;
      fill?: string;
      textAlign?: string;
    };
    base.text = textObj.text ?? "";
    base.fontFamily = textObj.fontFamily;
    base.fontSizePt = pxToPt(textObj.fontSize ?? 16);
    base.color = textObj.fill as string;
    base.align = (textObj.textAlign as "left" | "center" | "right") ?? "left";
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
  private fabric: typeof import("fabric") | null = null;

  constructor(private eventBus: EventBus) {}

  /** Устанавливает ссылку на канву и модуль Fabric.js (вызывается после init). */
  setCanvas(fabric: typeof import("fabric"), canvas: Canvas | null): void {
    this.fabric = fabric;
    this.canvas = canvas;
  }

  /**
   * Добавляет изображение на холст из URL.
   * Возвращает ID созданного объекта.
   */
  async addImage(url: string, options?: { slotId?: string }): Promise<string> {
    const fabric = this.fabric;
    const canvas = this.canvas;
    if (!fabric) throw new Error('Fabric not initialized');
    if (!canvas) throw new Error('Canvas not initialized');

    const img = await fabric.FabricImage.fromURL(url, {
      crossOrigin: 'anonymous',
    });

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const imgWidth = img.width || 1;
    const imgHeight = img.height || 1;

    // Масштабируем, чтобы фото занимало не более 90% холста
    const padding = 0.9;
    const scale = Math.min(
      1,
      (canvasWidth * padding) / imgWidth,
      (canvasHeight * padding) / imgHeight
    );

    img.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      uniformScaling: true,
    });

    if (options?.slotId) {
      (img as any)._slotId = options.slotId;
    }

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();

    return (img as any).id || '';
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
    if (!this.canvas || !this.fabric) throw new Error("Canvas not initialized");

    const { FabricText } = this.fabric;
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

    // Явно устанавливаем позицию и размер текста
    textObj.left = this.canvas.width! / 2;
    textObj.top = this.canvas.height! / 2;
    textObj.fontSize = 40;
    textObj.originX = "center";
    textObj.originY = "center";

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
    if (!this.canvas || !this.fabric) return;
    const obj = findObjectById(this.canvas, objectId);
    if (!obj) return;

    const { FabricText } = this.fabric;
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
