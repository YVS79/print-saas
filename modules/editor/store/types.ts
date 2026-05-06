import type { Format } from "@/lib/types/domain";
import type { ObjectInfo } from "../canvas/types";

/**
 * Состояние редактора (EditorState) — плоское, без fabric-объектов.
 * Используется для синхронизации React UI с CanvasManager.
 */
export interface EditorState {
  /** Загружен ли дизайн. */
  isLoaded: boolean;
  /** Текущий формат. */
  format: Format | null;
  /** Ширина в мм. */
  widthMM: number;
  /** Высота в мм. */
  heightMM: number;
  /** Выпуск (bleed) в мм. */
  bleedMM: number;
  /** Текущий масштаб. */
  zoom: number;
  /** Выбранные объекты (нормализованные). */
  selectedObjects: ObjectInfo[];
  /** Все объекты на холсте (кроме template/slot). */
  objects: ObjectInfo[];
  /** Можно ли отменить. */
  canUndo: boolean;
  /** Можно ли повторить. */
  canRedo: boolean;
  /** Идёт ли загрузка. */
  isLoading: boolean;
  /** Сообщение об ошибке. */
  error: string | null;
}

export const initialEditorState: EditorState = {
  isLoaded: false,
  format: null,
  widthMM: 0,
  heightMM: 0,
  bleedMM: 3,
  zoom: 1,
  selectedObjects: [],
  objects: [],
  canUndo: false,
  canRedo: false,
  isLoading: false,
  error: null,
};

/**
 * Действия редактора для dispatch.
 */
export type EditorAction =
  | { type: "SET_LOADED"; payload: { format: Format; widthMM: number; heightMM: number; bleedMM: number } }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_SELECTED_OBJECTS"; payload: ObjectInfo[] }
  | { type: "SET_OBJECTS"; payload: ObjectInfo[] }
  | { type: "SET_HISTORY"; payload: { canUndo: boolean; canRedo: boolean } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
