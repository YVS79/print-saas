import { NextRequest } from "next/server";
import { created, errorResponse, ok, parseOrThrow } from "@/lib/http";
import { createPrintJobInputSchema } from "@/lib/validation/api";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { createPrintJobForOrder, listPrintJobsForShop } from "@/server/services/print-job-service";

export async function GET(request: NextRequest) {
  try {
    const shopContext = await resolveShopContext(request);
    const jobs = await listPrintJobsForShop(shopContext.shopId);
    return ok(jobs);
  } catch (error) {
    return errorResponse(error);
  }
}

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
