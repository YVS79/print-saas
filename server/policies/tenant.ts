import { ForbiddenError } from "@/lib/errors";
import { ShopContext } from "@/server/context/resolve-shop-context";

export function assertTenantAccess(context: ShopContext, requestedShopId: string): void {
  if (context.shopId !== requestedShopId) {
    throw new ForbiddenError("Tenant mismatch");
  }
}
