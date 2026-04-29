import { z } from "zod";
import { colorHexSchema, formatSchema, idSchema, mmNumberSchema } from "@/lib/validation/common";

const canvasObjectBaseSchema = z.object({
  id: idSchema,
  xMM: mmNumberSchema,
  yMM: mmNumberSchema,
  widthMM: mmNumberSchema,
  heightMM: mmNumberSchema,
  rotationDeg: z.number().min(-360).max(360),
  opacity: z.number().min(0).max(1),
  zIndex: z.number().int().min(0),
});

const canvasImageObjectSchema = canvasObjectBaseSchema.extend({
  type: z.literal("image"),
  assetId: idSchema,
  crop: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    })
    .optional(),
});

const canvasTextObjectSchema = canvasObjectBaseSchema.extend({
  type: z.literal("text"),
  text: z.string().min(1).max(5_000),
  fontFamily: z.string().min(1).max(150),
  fontSizePt: z.number().positive().max(500),
  color: colorHexSchema,
  align: z.enum(["left", "center", "right"]),
  lineHeight: z.number().positive().max(10),
});

const canvasShapeObjectSchema = canvasObjectBaseSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle", "line"]),
  fill: colorHexSchema.optional(),
  stroke: colorHexSchema.optional(),
  strokeWidthMM: z.number().positive().max(100).optional(),
});

export const canvasObjectSchema = z.discriminatedUnion("type", [
  canvasImageObjectSchema,
  canvasTextObjectSchema,
  canvasShapeObjectSchema,
]);

export const canvasDesignSchema = z.object({
  id: idSchema,
  shopId: idSchema,
  designId: idSchema,
  format: formatSchema,
  widthMM: mmNumberSchema,
  heightMM: mmNumberSchema,
  dpi: z.literal(300),
  bleedMM: z.number().min(0).max(50),
  objects: z.array(canvasObjectSchema),
  version: z.number().int().positive(),
  schemaVersion: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
  createdByUserId: idSchema,
});
