import { NextRequest } from "next/server";
import { created, errorResponse, parseOrThrow } from "@/lib/http";
import { createPrintJobInputSchema } from "@/lib/validation/api";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { createPrintJobForOrder } from "@/server/services/print-job-service";

export async function POST(request: NextRequest) {
  try {
    const shopContext = await resolveShopContext(request);
    const body = parseOrThrow(createPrintJobInputSchema, await request.json());

    const printJob = await createPrintJobForOrder({
      shopId: shopContext.shopId,
      orderId: body.orderId,
    });

    return created(printJob);
  } catch (error) {
    return errorResponse(error);
  }
}
