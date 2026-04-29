import { NextRequest } from "next/server";
import { z } from "zod";
import { UnauthorizedError } from "@/lib/errors";
import { idSchema } from "@/lib/validation/common";

export interface SessionContext {
  userId: string;
  shopId: string;
}

const sessionHeadersSchema = z.object({
  userId: idSchema,
  shopId: idSchema,
});

export async function getSessionContext(request: NextRequest): Promise<SessionContext | null> {
  const parsed = sessionHeadersSchema.safeParse({
    userId: request.headers.get("x-user-id"),
    shopId: request.headers.get("x-shop-id"),
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export async function requireSessionContext(request: NextRequest): Promise<SessionContext> {
  const session = await getSessionContext(request);
  if (!session) {
    throw new UnauthorizedError("Missing session context");
  }
  return session;
}
