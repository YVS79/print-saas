import { NotFoundError } from "@/lib/errors";
import { createOrder, getOrderById, getShopOrders, OrderRecord } from "@/server/repositories/order-repository";
import { setTenantShopId } from "@/server/db/tenant-session";
import { withTransaction } from "@/server/db/transaction";
import { requireDesignVersion } from "@/server/services/design-service";

export async function createOrderForShop(input: {
  shopId: string;
  designId: string;
  designVersion: number;
  quantity: number;
  customerName?: string;
  customerPhone?: string;
}): Promise<OrderRecord> {
  return withTransaction(async () => {
    await setTenantShopId(input.shopId);

    await requireDesignVersion({
      shopId: input.shopId,
      designId: input.designId,
      version: input.designVersion,
    });

    return createOrder({
      shopId: input.shopId,
      designId: input.designId,
      designVersion: input.designVersion,
      quantity: input.quantity,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
    });
  });
}

export async function listOrdersForShop(shopId: string): Promise<OrderRecord[]> {
  return getShopOrders(shopId);
}

export async function requireOrderForShop(shopId: string, orderId: string): Promise<OrderRecord> {
  const order = await getOrderById(shopId, orderId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }
  return order;
}
