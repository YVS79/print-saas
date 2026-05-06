import type { Command } from "./Command";
import type { ObjectService } from "../object-service";
import type { CanvasManager } from "../CanvasManager";

export interface AddImageCommandOptions {
  url: string;
  xMM: number;
  yMM: number;
  widthMM: number;
  heightMM: number;
  rotationDeg?: number;
  assetId?: string;
}

/**
 * AddImageCommand — добавляет изображение на холст.
 * При undo удаляет объект, при redo добавляет заново.
 */
export class AddImageCommand implements Command {
  readonly type = "AddImageCommand";
  private objectId: string | null = null;
  private objectData: AddImageCommandOptions;

  constructor(options: AddImageCommandOptions) {
    this.objectData = { ...options };
  }

  async execute(manager: CanvasManager): Promise<void> {
    const objectService = manager.getService<ObjectService>("objectService");
    if (!objectService) return;

    const id = await objectService.addImage(this.objectData.url, {
      xMM: this.objectData.xMM,
      yMM: this.objectData.yMM,
      widthMM: this.objectData.widthMM,
      heightMM: this.objectData.heightMM,
      rotationDeg: this.objectData.rotationDeg,
      assetId: this.objectData.assetId,
    });

    this.objectId = id;
  }

  undo(manager: CanvasManager): void {
    if (!this.objectId) return;
    const objectService = manager.getService<ObjectService>("objectService");
    if (!objectService) return;
    objectService.delete(this.objectId);
  }

  getObjectId(): string | null {
    return this.objectId;
  }
}
