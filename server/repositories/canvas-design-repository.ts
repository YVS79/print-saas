import { getCurrentQueryable } from "@/server/db/transaction";

export interface CreateCanvasDesignVersionParams {
  shopId: string;
  designId: string;
  format: "A4" | "A3";
  widthMM: number;
  heightMM: number;
  bleedMM: number;
  objects: unknown[];
  schemaVersion: number;
  createdByUserId: string;
}

export interface CanvasDesignRecord {
  id: string;
  shop_id: string;
  design_id: string;
  format: "A4" | "A3";
  width_mm: string;
  height_mm: string;
  dpi: 300;
  bleed_mm: string;
  objects_jsonb: unknown[];
  version: number;
  schema_version: number;
  created_by_user_id: string;
  updated_at: string;
}

export async function getLatestCanvasDesignVersion(shopId: string, designId: string): Promise<number> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<{ max_version: number | null }>(
    `
      SELECT MAX(version) AS max_version
      FROM canvas_designs
      WHERE shop_id = $1 AND design_id = $2
    `,
    [shopId, designId],
  );

  return result.rows[0]?.max_version ?? 0;
}

export async function createCanvasDesignVersion(
  params: CreateCanvasDesignVersionParams,
): Promise<CanvasDesignRecord> {
  const nextVersion = (await getLatestCanvasDesignVersion(params.shopId, params.designId)) + 1;

  const queryable = getCurrentQueryable();
  const result = await queryable.query<CanvasDesignRecord>(
    `
      INSERT INTO canvas_designs (
        shop_id, design_id, format, width_mm, height_mm, dpi, bleed_mm,
        objects_jsonb, version, schema_version, created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, 300, $6, $7::jsonb, $8, $9, $10)
      RETURNING id, shop_id, design_id, format, width_mm, height_mm, dpi, bleed_mm,
                objects_jsonb, version, schema_version, created_by_user_id, updated_at
    `,
    [
      params.shopId,
      params.designId,
      params.format,
      params.widthMM,
      params.heightMM,
      params.bleedMM,
      JSON.stringify(params.objects),
      nextVersion,
      params.schemaVersion,
      params.createdByUserId,
    ],
  );

  return result.rows[0];
}

export async function getCanvasDesignByVersion(
  shopId: string,
  designId: string,
  version: number,
): Promise<CanvasDesignRecord | null> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<CanvasDesignRecord>(
    `
      SELECT id, shop_id, design_id, format, width_mm, height_mm, dpi, bleed_mm,
             objects_jsonb, version, schema_version, created_by_user_id, updated_at
      FROM canvas_designs
      WHERE shop_id = $1 AND design_id = $2 AND version = $3
      LIMIT 1
    `,
    [shopId, designId, version],
  );

  return result.rows[0] ?? null;
}
