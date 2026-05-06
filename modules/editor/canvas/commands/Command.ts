import type { CanvasManager } from "../CanvasManager";

/**
 * Интерфейс команды для паттерна Command.
 * Позволяет выполнять и отменять действия (undo/redo).
 */
export interface Command {
  /** Уникальный идентификатор команды (для дедупликации). */
  readonly type: string;
  /** Выполнить команду. */
  execute(manager: CanvasManager): Promise<void> | void;
  /** Отменить команду. */
  undo(manager: CanvasManager): Promise<void> | void;
}
