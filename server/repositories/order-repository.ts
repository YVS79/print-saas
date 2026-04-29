import { getCurrentQueryable } from "@/server/db/transaction";

export interface OrderRecord {
  id: string;
  shop_id: string;
  design_id: string;
  design_version: number;
  quantity: number;
  status: "created" | "queued" | "printed" | "cancelled";
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export async function createOrder(params: {
  shopId: string;
  designId: string;
  designVersion: number;
  quantity: number;
  customerName?: string;
  customerPhone?: string;
}): Promise<OrderRecord> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<OrderRecord>(
    `
      INSERT INTO orders (
        shop_id, design_id, design_version, quantity, status, customer_name, customer_phone
      )
      VALUES ($1, $2, $3, $4, 'created', $5, $6)
      RETURNING id, shop_id, design_id, design_version, quantity, status,
                customer_name, customer_phone, created_at, updated_at
    `,
    [
      params.shopId,
      params.designId,
      params.designVersion,
      params.quantity,
      params.customerName ?? null,
      params.customerPhone ?? null,
    ],
  );

  return result.rows[0];
}

export async function getShopOrders(shopId: string): Promise<OrderRecord[]> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<OrderRecord>(
    `
      SELECT id, shop_id, design_id, design_version, quantity, status,
             customer_name, customer_phone, created_at, updated_at
      FROM orders
      WHERE shop_id = $1
      ORDER BY created_at DESC
    `,
    [shopId],
  );

  return result.rows;
}

export async function getOrderById(shopId: string, orderId: string): Promise<OrderRecord | null> {
  const queryable = getCurrentQueryable();
  const result = await queryable.query<OrderRecord>(
    `
      SELECT id, shop_id, design_id, design_version, quantity, status,
             customer_name, customer_phone, created_at, updated_at
      FROM orders
      WHERE shop_id = $1 AND id = $2
      LIMIT 1
    `,
    [shopId, orderId],
  );

  return result.rows[0] ?? null;
}
