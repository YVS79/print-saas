import { NextRequest } from "next/server";
import { created, errorResponse, parseOrThrow } from "@/lib/http";
import { createOrderInputSchema } from "@/lib/validation/api";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { createOrderForShop } from "@/server/services/order-service";

export async function POST(request: NextRequest) {
  try {
    const shopContext = await resolveShopContext(request);
    const body = parseOrThrow(createOrderInputSchema, await request.json());

    const order = await createOrderForShop({
      shopId: shopContext.shopId,
      designId: body.designId,
      designVersion: body.designVersion,
      quantity: body.quantity,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
    });

    return created(order);
  } catch (error) {
    return errorResponse(error);
  }
}
