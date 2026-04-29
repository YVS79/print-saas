import { NextRequest } from "next/server";
import { ForbiddenError } from "@/lib/errors";
import { created, errorResponse, parseOrThrow } from "@/lib/http";
import { uploadAssetInputSchema } from "@/lib/validation/api";
import { resolveShopContext } from "@/server/context/resolve-shop-context";
import { createAssetUpload } from "@/server/services/asset-service";

export async function POST(request: NextRequest) {
  try {
    const shopContext = await resolveShopContext(request);
    const body = parseOrThrow(uploadAssetInputSchema, await request.json());

    if (!shopContext.actorUserId) {
      throw new ForbiddenError("Asset upload requires session actor");
    }

    const upload = await createAssetUpload({
      shopId: shopContext.shopId,
      actorUserId: shopContext.actorUserId,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      widthPx: body.widthPx,
      heightPx: body.heightPx,
    });

    return created(upload);
  } catch (error) {
    return errorResponse(error);
  }
}
