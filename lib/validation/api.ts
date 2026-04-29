import { z } from "zod";
import { canvasObjectSchema } from "@/lib/validation/canvas";
import { formatSchema, idSchema, mmNumberSchema } from "@/lib/validation/common";

export const saveCanvasDesignInputSchema = z.object({
  designId: idSchema,
  format: formatSchema,
  widthMM: mmNumberSchema,
  heightMM: mmNumberSchema,
  bleedMM: z.number().min(0).max(50),
  objects: z.array(canvasObjectSchema),
  schemaVersion: z.number().int().positive(),
});

export const createOrderInputSchema = z.object({
  designId: idSchema,
  designVersion: z.number().int().positive(),
  quantity: z.number().int().positive().max(10_000),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(50).optional(),
});

export const createPrintJobInputSchema = z.object({
  orderId: idSchema,
});

export const uploadAssetInputSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  sizeBytes: z.number().int().positive(),
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
});

export const getTemplatesQuerySchema = z.object({
  format: formatSchema.optional(),
});
