import { getCurrentQueryable } from "@/server/db/transaction";

export interface AssetRecord {
  id: string;
  shop_id: string;
  key: string;
  bucket: string;
  mime_type: string;
  width_px: number | null;
  height_px: number | null;
  size_bytes: number;
  created_by_user_id: string;
  created_at: string;
}

export async function createAsset(params: {
  shopId: string;
  key: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  widthPx?: number;
  heightPx?: number;
  createdByUserId: string;
}): Promise<AssetRecord> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<AssetRecord>(
    `
      INSERT INTO assets (
        shop_id, key, bucket, mime_type, width_px, height_px, size_bytes, created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, shop_id, key, bucket, mime_type, width_px, height_px,
                size_bytes, created_by_user_id, created_at
    `,
    [
      params.shopId,
      params.key,
      params.bucket,
      params.mimeType,
      params.widthPx ?? null,
      params.heightPx ?? null,
      params.sizeBytes,
      params.createdByUserId,
    ],
  );

  return result.rows[0];
}
