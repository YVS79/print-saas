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
import { getFabric } from "./getFabric";

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
  private fabric: typeof import("fabric") | null = null;

  constructor(format: FormatKey, bleedMM: number) {
    this.eventBus = new EventBus();

    this.core = new CanvasCore({ format, bleedMM, eventBus: this.eventBus });

    this.objectService = new ObjectService(this.eventBus);
    this.selectionService = new SelectionService(this.eventBus);
    this.historyService = new HistoryService(this.eventBus);
    this.exportService = new ExportService();
    this.slotService = new SlotService(this.eventBus);

    this.services = [
      this.core,
      this.selectionService,
      this.exportService,
      this.slotService,
    ];
  }

  /**
   * Инициализирует холст и связывает все сервисы.
   */
  async init(canvasEl: HTMLCanvasElement): Promise<void> {
    await this.core.init(canvasEl);

    const fabric = await getFabric();
    this.fabric = fabric;

    // Прокидываем канву в сервисы
    this.objectService.setCanvas(fabric, this.core.canvas);
    this.selectionService.setCanvas(this.core.canvas);
    this.slotService.setCanvas(fabric, this.core.canvas);
  }

  /**
   * Получает сервис по имени.
   */
  getService<K extends keyof ServiceMap>(name: K): ServiceMap[K] {
    return this[name];
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
   * Изменяет размер холста под новый формат + bleed.
   * Сохраняет все user-объекты, перерисовывает направляющие.
   */
  setCanvasSize(format: FormatKey, bleedMM: number): void {
    this.core.setCanvasSize(format, bleedMM);
  }

  /**
   * Загружает шаблон — очищает user/slot объекты и рисует слоты.
   */
  setTemplate(slots: Slot[]): void {
    this.core.setTemplate(slots);
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
   * Получает Fabric.js канву (алиас для getCanvas).
   */
  getFabricCanvas(): Canvas | null {
    return this.core.getCanvas();
  }

  /**
   * Получает загруженный модуль Fabric.js.
   */
  getFabric(): typeof import("fabric") | null {
    return this.fabric;
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
    this.fabric = null;
  }
}
