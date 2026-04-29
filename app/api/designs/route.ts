import { NextRequest } from "next/server";
import { ForbiddenError } from "@/lib/errors";
import { created, errorResponse, parseOrThrow } from "@/lib/http";
import { saveCanvasDesignInputSchema } from "@/lib/validation/api";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { saveDesignVersion } from "@/server/services/design-service";

export async function POST(request: NextRequest) {
  try {
    const shopContext = await resolveShopContext(request);
    const body = parseOrThrow(saveCanvasDesignInputSchema, await request.json());

    const actorUserId = shopContext.actorUserId;
    if (!actorUserId) {
      throw new ForbiddenError("Editor endpoint requires session actor");
    }

    const design = await saveDesignVersion({
      shopId: shopContext.shopId,
      designId: body.designId,
      format: body.format,
      widthMM: body.widthMM,
      heightMM: body.heightMM,
      bleedMM: body.bleedMM,
      objects: body.objects,
      schemaVersion: body.schemaVersion,
      actorUserId,
    });

    return created(design);
  } catch (error) {
    return errorResponse(error);
  }
}
