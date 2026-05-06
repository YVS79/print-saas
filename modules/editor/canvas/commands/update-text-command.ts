import type { Command } from "./Command";
import type { ObjectInfo } from "../types";
import type { ObjectService } from "../object-service";
import type { CanvasManager } from "../CanvasManager";

/**
 * UpdateTextCommand — изменяет текст или его свойства.
 * При undo восстанавливает предыдущее состояние.
 */
export class UpdateTextCommand implements Command {
  readonly type = "UpdateTextCommand";
  private objectId: string;
  private previousState: Partial<ObjectInfo> | null = null;
  private newProps: Partial<ObjectInfo>;

  constructor(objectId: string, newProps: Partial<ObjectInfo>) {
    this.objectId = objectId;
    this.newProps = { ...newProps };
  }

  async execute(manager: CanvasManager): Promise<void> {
    const objectService = manager.getService<ObjectService>("objectService");
    if (!objectService) return;

    const currentInfo = objectService.getObjectInfo(this.objectId);
    if (!currentInfo) return;

    this.previousState = {
      text: currentInfo.text,
      fontSizePt: currentInfo.fontSizePt,
      fontFamily: currentInfo.fontFamily,
      color: currentInfo.color,
      align: currentInfo.align,
      xMM: currentInfo.xMM,
      yMM: currentInfo.yMM,
      widthMM: currentInfo.widthMM,
      heightMM: currentInfo.heightMM,
      rotationDeg: currentInfo.rotationDeg,
      opacity: currentInfo.opacity,
    };

    objectService.update(this.objectId, this.newProps);
  }

  undo(manager: CanvasManager): void {
    if (!this.previousState) return;
    const objectService = manager.getService<ObjectService>("objectService");
    if (!objectService) return;
    objectService.update(this.objectId, this.previousState);
  }
}
