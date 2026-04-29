import { NextRequest } from "next/server";
import { errorResponse, ok, parseOrThrow } from "@/lib/http";
import { getTemplatesQuerySchema } from "@/lib/validation/api";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { listTemplates } from "@/server/services/template-service";

export async function GET(request: NextRequest) {
  try {
    const shopContext = await resolveShopContext(request);
    const query = parseOrThrow(
      getTemplatesQuerySchema,
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    const templates = await listTemplates(shopContext.shopId, query.format);
    return ok(templates);
  } catch (error) {
    return errorResponse(error);
  }
}
