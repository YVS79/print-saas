import type { Command } from "./Command";
import type { ObjectInfo } from "../types";
import type { ObjectService } from "../object-service";
import type { CanvasManager } from "../CanvasManager";

/**
 * DeleteObjectCommand — удаляет объект с холста.
 * При undo восстанавливает объект с сохранёнными параметрами.
 */
export class DeleteObjectCommand implements Command {
  readonly type = "DeleteObjectCommand";
  private objectId: string;
  private deletedObjectSnapshot: object | null = null;

  constructor(objectId: string) {
    this.objectId = objectId;
  }

  async execute(manager: CanvasManager): Promise<void> {
    const objectService: ObjectService = manager.getService("objectService");
    if (!objectService) return;

    this.deletedObjectSnapshot = objectService.getObjectInfo(this.objectId);
    objectService.delete(this.objectId);
  }

  undo(manager: CanvasManager): void {
    if (!this.deletedObjectSnapshot) return;

    const snapshot = this.deletedObjectSnapshot as unknown as ObjectInfo;
    const objectService: ObjectService = manager.getService("objectService");
    if (!objectService) return;

    if (snapshot.type === "text" && snapshot.text !== undefined) {
      objectService.addText(snapshot.text, {
        xMM: snapshot.xMM,
        yMM: snapshot.yMM,
        widthMM: snapshot.widthMM,
        fontSizePt: snapshot.fontSizePt,
        fontFamily: snapshot.fontFamily,
        color: snapshot.color,
        align: snapshot.align ?? "left",
      });
    }
  }
}
