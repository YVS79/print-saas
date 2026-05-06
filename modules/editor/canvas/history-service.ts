import { EventBus } from "./EventBus";
import type { Command } from "./commands/Command";
import type { CanvasManager } from "./CanvasManager";

/**
 * HistoryService — стек команд (Command pattern) для undo/redo.
 * Хранит выполненные команды и позволяет отменять/повторять их.
 */
export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private manager: CanvasManager | null = null;

  /** Максимальное количество команд в стеке (чтобы не забивать память). */
  private readonly maxCommands = 100;

  constructor(private eventBus: EventBus) {}

  /** Устанавливает ссылку на CanvasManager (вызывается при инициализации). */
  setManager(manager: CanvasManager): void {
    this.manager = manager;
  }

  /**
   * Выполняет команду и помещает её в стек undo.
   */
  push(command: Command): void {
    this.undoStack.push(command);

    if (this.undoStack.length > this.maxCommands) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.emitHistoryChanged();
  }

  /**
   * Отменяет последнюю команду.
   */
  undo(): void {
    const command = this.undoStack.pop();
    if (!command || !this.manager) return;

    this.redoStack.push(command);
    command.undo(this.manager);
    this.emitHistoryChanged();
  }

  /**
   * Повторяет последнюю отменённую команду.
   */
  redo(): void {
    const command = this.redoStack.pop();
    if (!command || !this.manager) return;

    this.undoStack.push(command);
    command.execute(this.manager);
    this.emitHistoryChanged();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private emitHistoryChanged(): void {
    this.eventBus.emit("historyChanged", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  /** Очищает всю историю. */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.emitHistoryChanged();
  }
}
