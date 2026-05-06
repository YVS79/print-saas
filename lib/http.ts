import { ZodSchema } from "zod";
import { AppError, ValidationError } from "@/lib/errors";

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
}

export function parseOrThrow<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((issue) => issue.message).join(", "));
  }
  return result.data;
}

export function ok<T>(data: T): Response {
  return Response.json({ data } satisfies ApiSuccessResponse<T>);
}

export function created<T>(data: T): Response {
  return Response.json({ data } satisfies ApiSuccessResponse<T>, { status: 201 });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: error.message } satisfies ApiErrorResponse, { status: error.statusCode });
  }

  return Response.json({ error: "Internal server error" } satisfies ApiErrorResponse, { status: 500 });
}
