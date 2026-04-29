import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  CanvasDesignRecord,
  createCanvasDesignVersion,
  getCanvasDesignByVersion,
} from "@/server/repositories/canvas-design-repository";
import { setTenantShopId, setTenantUserId } from "@/server/db/tenant-session";
import { getCurrentQueryable, withTransaction } from "@/server/db/transaction";

const MAX_VERSION_RETRIES = 3;

export async function saveDesignVersion(input: {
  shopId: string;
  designId: string;
  format: "A4" | "A3";
  widthMM: number;
  heightMM: number;
  bleedMM: number;
  objects: unknown[];
  schemaVersion: number;
  actorUserId: string;
}): Promise<CanvasDesignRecord> {
  for (let attempt = 1; attempt <= MAX_VERSION_RETRIES; attempt += 1) {
    try {
      return await withTransaction(async () => {
        await setTenantShopId(input.shopId);
        await setTenantUserId(input.actorUserId);

        // Serialize version increment per (shopId + designId)
        const queryable = getCurrentQueryable();
        await queryable.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
          `${input.shopId}:${input.designId}`,
        ]);

        return createCanvasDesignVersion({
          shopId: input.shopId,
          designId: input.designId,
          format: input.format,
          widthMM: input.widthMM,
          heightMM: input.heightMM,
          bleedMM: input.bleedMM,
          objects: input.objects,
          schemaVersion: input.schemaVersion,
          createdByUserId: input.actorUserId,
        });
      });
    } catch (error) {
      const pgError = error as { code?: string };
      const isUniqueConflict = pgError.code === "23505";
      const canRetry = isUniqueConflict && attempt < MAX_VERSION_RETRIES;
      if (canRetry) {
        continue;
      }
      if (isUniqueConflict) {
        throw new ConflictError("CanvasDesign version conflict. Retry save operation.");
      }
      throw error;
    }
  }

  throw new ConflictError("CanvasDesign version conflict. Retry save operation.");
}

export async function requireDesignVersion(input: {
  shopId: string;
  designId: string;
  version: number;
}): Promise<CanvasDesignRecord> {
  const design = await getCanvasDesignByVersion(input.shopId, input.designId, input.version);
  if (!design) {
    throw new NotFoundError("CanvasDesign version not found");
  }
  return design;
}
