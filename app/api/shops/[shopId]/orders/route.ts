import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/http";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { assertTenantAccess } from "@/server/policies/tenant";
import { listOrdersForShop } from "@/server/services/order-service";

export async function GET(_request: NextRequest, context: RouteContext<"/api/shops/[shopId]/orders">) {
  try {
    const shopContext = await resolveShopContext(_request);
    const params = await context.params;
    assertTenantAccess(shopContext, params.shopId);

    const orders = await listOrdersForShop(params.shopId);
    return ok(orders);
  } catch (error) {
    return errorResponse(error);
  }
}
