import { Format } from "@/lib/types/domain";
import { getCurrentQueryable } from "@/server/db/transaction";

export interface PrintJobRecord {
  id: string;
  shop_id: string;
  order_id: string;
  design_id: string;
  design_version: number;
  printer_format: Format;
  dpi: 300;
  bleed_mm: string;
  status: "queued" | "rendering" | "ready" | "failed";
  pdf_asset_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function getShopPrintJobs(shopId: string): Promise<PrintJobRecord[]> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<PrintJobRecord>(
    `
      SELECT id, shop_id, order_id, design_id, design_version, printer_format, dpi, bleed_mm,
             status, pdf_asset_id, error_message, created_at, updated_at
      FROM print_jobs
      WHERE shop_id = $1
      ORDER BY created_at DESC
    `,
    [shopId],
  );

  return result.rows;
}

export async function createPrintJob(params: {
  shopId: string;
  orderId: string;
  designId: string;
  designVersion: number;
  printerFormat: Format;
  bleedMM: number;
}): Promise<PrintJobRecord> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<PrintJobRecord>(
    `
      INSERT INTO print_jobs (
        shop_id, order_id, design_id, design_version, printer_format, dpi, bleed_mm, status
      )
      VALUES ($1, $2, $3, $4, $5, 300, $6, 'queued')
      RETURNING id, shop_id, order_id, design_id, design_version, printer_format, dpi, bleed_mm,
                status, pdf_asset_id, error_message, created_at, updated_at
    `,
    [params.shopId, params.orderId, params.designId, params.designVersion, params.printerFormat, params.bleedMM],
  );

  return result.rows[0];
}

export async function updatePrintJobStatus(params: {
  shopId: string;
  printJobId: string;
  status: PrintJobRecord["status"];
  errorMessage?: string;
}): Promise<PrintJobRecord | null> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<PrintJobRecord>(
    `
      UPDATE print_jobs
      SET status = $3,
          error_message = $4,
          updated_at = NOW()
      WHERE shop_id = $1 AND id = $2
      RETURNING id, shop_id, order_id, design_id, design_version, printer_format, dpi, bleed_mm,
                status, pdf_asset_id, error_message, created_at, updated_at
    `,
    [params.shopId, params.printJobId, params.status, params.errorMessage ?? null],
  );

  return result.rows[0] ?? null;
}
