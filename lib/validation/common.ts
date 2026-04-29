import { z } from "zod";

export const idSchema = z.uuid();
export const formatSchema = z.enum(["A4", "A3"]);

export const mmNumberSchema = z.number().positive().max(10_000);
export const colorHexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
