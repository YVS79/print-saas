import { Format } from "@/lib/types/domain";
import { getCurrentQueryable } from "@/server/db/transaction";

export interface TemplateRecord {
  id: string;
  shop_id: string;
  name: string;
  format: Format;
  width_mm: string;
  height_mm: string;
  bleed_mm: string;
  base_design_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTemplatesByShop(shopId: string, format?: Format): Promise<TemplateRecord[]> {
  const queryable = getCurrentQueryable();

  if (format) {
    const result = await queryable.query<TemplateRecord>(
      `
        SELECT id, shop_id, name, format, width_mm, height_mm, bleed_mm, base_design_id, is_active, created_at, updated_at
        FROM templates
        WHERE shop_id = $1 AND format = $2 AND is_active = TRUE
        ORDER BY created_at DESC
      `,
      [shopId, format],
    );
    return result.rows;
  }

  const result = await queryable.query<TemplateRecord>(
    `
      SELECT id, shop_id, name, format, width_mm, height_mm, bleed_mm, base_design_id, is_active, created_at, updated_at
      FROM templates
      WHERE shop_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `,
    [shopId],
  );

  return result.rows;
}
