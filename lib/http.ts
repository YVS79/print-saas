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
  return Response.json<ApiSuccessResponse<T>>({ data });
}

export function created<T>(data: T): Response {
  return Response.json<ApiSuccessResponse<T>>({ data }, { status: 201 });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json<ApiErrorResponse>({ error: error.message }, { status: error.statusCode });
  }

  return Response.json<ApiErrorResponse>({ error: "Internal server error" }, { status: 500 });
}
