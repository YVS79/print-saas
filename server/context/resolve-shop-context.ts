import { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/errors";
import { getSessionContext } from "@/server/auth/session";
import { verifyWidgetToken } from "@/server/auth/widget-token";

export interface ShopContext {
  shopId: string;
  actorUserId?: string;
  source: "session" | "widget";
}

export async function resolveShopContext(request: NextRequest): Promise<ShopContext> {
  const session = await getSessionContext(request);
  if (session) {
    return {
      shopId: session.shopId,
      actorUserId: session.userId,
      source: "session",
    };
  }

  const widget = await verifyWidgetToken(request);
  if (widget) {
    return {
      shopId: widget.shopId,
      source: "widget",
    };
  }

  throw new UnauthorizedError("Unable to resolve tenant context");
}
