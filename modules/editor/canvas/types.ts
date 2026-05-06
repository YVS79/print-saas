import type { Format } from "@/lib/types/domain";

/**
 * Роль объекта на холсте:
 * - "template" — служебные линии (bleed, safe zone), не экспортируются
 * - "slot" — фото-слоты шаблона (рамка для фото), не экспортируются
 * - "user" — объекты, добавленные пользователем, экспортируются
 */
export type ObjectRole = "template" | "slot" | "user";

/** Описание слота шаблона — область, куда пользователь может поместить фото. */
export interface Slot {
  id: string;
  xMM: number;
  yMM: number;
  widthMM: number;
  heightMM: number;
  rotationDeg: number;
  label?: string;
}

/**
 * Нормализованная информация об объекте на холсте.
 * Используется для синхронизации Fabric → React.
 */
export interface ObjectInfo {
  id: string;
  type: "image" | "text" | "shape";
  role: ObjectRole;
  xMM: number;
  yMM: number;
  widthMM: number;
  heightMM: number;
  rotationDeg: number;
  opacity: number;
  zIndex: number;
  // Поля для конкретных типов
  assetId?: string;
  text?: string;
  fontFamily?: string;
  fontSizePt?: number;
  color?: string;
  align?: "left" | "center" | "right";
  shape?: "rect" | "circle" | "line";
}

/**
 * Объект дизайна в формате для хранения/передачи.
 * Соответствует CanvasObject из domain.ts, но с role.
 */
export interface CanvasDesignObject {
  id: string;
  role: ObjectRole;
  type: "image" | "text" | "shape";
  xMM: number;
  yMM: number;
  widthMM: number;
  heightMM: number;
  rotationDeg: number;
  opacity: number;
  zIndex: number;
  // Изображение
  assetId?: string;
  crop?: { x: number; y: number; width: number; height: number };
  // Текст
  text?: string;
  fontFamily?: string;
  fontSizePt?: number;
  color?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  // Фигура
  shape?: "rect" | "circle" | "line";
  fill?: string;
  stroke?: string;
  strokeWidthMM?: number;
}
