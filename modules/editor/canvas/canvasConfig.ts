/** DPI проекта — все дизайны хранятся в 300 DPI. */
export const DPI = 300 as const;

/** Форматы печати с размерами в мм. */
export const FORMATS = {
  A4: { widthMM: 210, heightMM: 297 },
  A3: { widthMM: 297, heightMM: 420 },
} as const;

export type FormatKey = keyof typeof FORMATS;

/** Конвертация миллиметров в пиксели при заданном DPI. */
export function mmToPx(mm: number): number {
  return (mm * DPI) / 25.4;
}

/** Конвертация пикселей в миллиметры. */
export function pxToMm(px: number): number {
  return (px * 25.4) / DPI;
}

/** Конвертация пунктов (pt) в пиксели. 1pt = 1/72 дюйма. */
export function ptToPx(pt: number): number {
  return (pt * DPI) / 72;
}

/** Конвертация пикселей в пункты. */
export function pxToPt(px: number): number {
  return (px * 72) / DPI;
}

/** Возвращает размер холста в пикселях для заданного формата с учётом выпуска (bleed). */
export function getCanvasSize(
  format: FormatKey,
  bleedMM: number,
): { widthPx: number; heightPx: number } {
  const fmt = FORMATS[format];
  return {
    widthPx: mmToPx(fmt.widthMM + bleedMM * 2),
    heightPx: mmToPx(fmt.heightMM + bleedMM * 2),
  };
}
