import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { z } from "zod";
import { UnauthorizedError } from "@/lib/errors";
import { idSchema } from "@/lib/validation/common";

export interface WidgetContext {
  shopId: string;
}

const widgetTokenPayloadSchema = z.object({
  shopId: idSchema,
});

export async function verifyWidgetToken(request: NextRequest): Promise<WidgetContext | null> {
  const token = request.nextUrl.searchParams.get("token") ?? request.headers.get("x-widget-token");
  if (!token) {
    return null;
  }

  const secret = process.env.WIDGET_JWT_SECRET;
  if (!secret) {
    throw new UnauthorizedError("WIDGET_JWT_SECRET is required");
  }

  const encodedSecret = new TextEncoder().encode(secret);
  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    payload = (await jwtVerify(token, encodedSecret)).payload;
  } catch {
    throw new UnauthorizedError("Invalid widget token");
  }

  const parsed = widgetTokenPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new UnauthorizedError("Invalid widget token payload");
  }

  return parsed.data;
}
