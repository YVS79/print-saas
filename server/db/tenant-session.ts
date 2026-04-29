import { Queryable, getCurrentQueryable } from "@/server/db/transaction";

export async function setTenantShopId(shopId: string, queryable: Queryable = getCurrentQueryable()): Promise<void> {
  await queryable.query(`SELECT set_config('app.shop_id', $1, true)`, [shopId]);
}

export async function setTenantUserId(userId: string, queryable: Queryable = getCurrentQueryable()): Promise<void> {
  await queryable.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
}
