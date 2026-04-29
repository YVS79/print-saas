const MM_PER_INCH = 25.4;

export function mmToPx(mm: number, dpi = 300): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export function pxToMm(px: number, dpi = 300): number {
  return (px / dpi) * MM_PER_INCH;
}
