import type { Canvas } from "fabric";
import { EventBus } from "./EventBus";
import { CanvasCore } from "./CanvasCore";
import { ObjectService } from "./object-service";
import { SelectionService } from "./selection-service";
import { HistoryService } from "./history-service";
import { ExportService } from "./export-service";
import { SlotService } from "./slot-service";
import type { FormatKey } from "./canvasConfig";
import type { Command } from "./commands/Command";
import type { Slot } from "./types";

type ServiceMap = {
  objectService: ObjectService;
  selectionService: SelectionService;
  historyService: HistoryService;
  exportService: ExportService;
  slotService: SlotService;
};

/**
 * CanvasManager — фасад-компоновщик, объединяющий все сервисы редактора.
 */
export class CanvasManager {
  public readonly eventBus: EventBus;
  public readonly core: CanvasCore;
  public readonly objectService: ObjectService;
  public readonly selectionService: SelectionService;
  public readonly historyService: HistoryService;
  public readonly exportService: ExportService;
  public readonly slotService: SlotService;

  private services: Array<{ destroy(): void }> = [];

  constructor(format: FormatKey, bleedMM: number) {
    this.eventBus = new EventBus();

    this.core = new CanvasCore({ format, bleedMM, eventBus: this.eventBus });
    this.objectService = new ObjectService(this.eventBus);
    this.selectionService = new SelectionService(this.eventBus);
    this.historyService = new HistoryService(this.eventBus);
    this.exportService = new ExportService();
    this.slotService = new SlotService(this.eventBus);

    this.services = [
      this.selectionService,
      this.exportService,
      this.slotService,
    ];
  }

  /**
   * Возвращает сервис по имени для команд.
   */
  getService<T>(name: keyof ServiceMap): T {
    return (this as any)[name] as T;
  }

  /**
   * Инициализирует канву на элементе <canvas>.
   */
  init(canvasEl: HTMLCanvasElement): void {
    this.core.init(canvasEl);
    this.core.drawTemplateGuides();

    const canvas = this.core.canvas;
    this.objectService.setCanvas(canvas);
    this.selectionService.setCanvas(canvas);
    this.exportService.setCanvas(canvas);
    this.slotService.setCanvas(canvas);
    this.historyService.setManager(this);
  }

  /**
   * Загружает шаблон на холст (очищает user/slot, рисует направляющие и слоты).
   */
  setTemplate(slots: Slot[]): void {
    this.core.setTemplate(slots);
  }

  /**
   * Выполняет команду через HistoryService (с поддержкой undo/redo).
   */
  async executeCommand(command: Command): Promise<void> {
    await command.execute(this);
    this.historyService.push(command);
  }

  /**
   * Отменяет последнюю команду.
   */
  undo(): void {
    this.historyService.undo();
  }

  /**
   * Повторяет последнюю отменённую команду.
   */
  redo(): void {
    this.historyService.redo();
  }

  /**
   * Устанавливает масштаб.
   */
  setZoom(zoom: number): void {
    this.core.setZoom(zoom);
  }

  /**
   * Получает Fabric.js канву.
   */
  getCanvas(): Canvas | null {
    return this.core.canvas;
  }

  /**
   * Уничтожает менеджер и все сервисы.
   */
  destroy(): void {
    for (let i = this.services.length - 1; i >= 0; i--) {
      this.services[i].destroy();
    }
    this.services = [];
    this.core.destroy();
    this.eventBus.clear();
  }
}
