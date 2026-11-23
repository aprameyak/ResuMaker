// Page geometry for the Letter preview. CSS inches are 96px at screen scale.

export const PX_PER_IN = 96
export const PAGE_W_IN = 8.5
export const PAGE_H_IN = 11
export const MARGIN_IN = 0.5
export const CONTENT_H_IN = PAGE_H_IN - 2 * MARGIN_IN
export const PAGE_W_PX = PAGE_W_IN * PX_PER_IN
export const CONTENT_H_PX = CONTENT_H_IN * PX_PER_IN

/** Fractional pages from the measured content height in CSS pixels. */
export function pageFraction(contentHeightPx: number): number {
  if (!isFinite(contentHeightPx) || contentHeightPx <= 0) return 0
  return contentHeightPx / CONTENT_H_PX
}

/** Whole pages the content occupies (what a "max pages" rule should see). Empty content is 0. */
export function pageCount(contentHeightPx: number): number {
  const f = pageFraction(contentHeightPx)
  if (f <= 0) return 0
  return Math.max(1, Math.ceil(f - 0.005))
}

/** "1 page", "1.2 pages". Rounds up to one decimal so an overflow never reads as "1.0". */
export function formatPages(contentHeightPx: number): string {
  const f = pageFraction(contentHeightPx)
  if (f <= 0) return '0 pages'
  if (f <= 1.005) return f >= 0.95 ? '1 page' : `${Math.max(0.1, Math.round(f * 10) / 10).toFixed(1)} pages`
  return `${(Math.ceil(f * 10 - 1e-9) / 10).toFixed(1)} pages`
}

/** Offsets (in CSS inches from the top of the sheet) where pages 2..n begin. */
export function breakOffsetsIn(contentHeightPx: number): number[] {
  const pages = pageCount(contentHeightPx)
  const out: number[] = []
  for (let k = 1; k < pages; k++) out.push(MARGIN_IN + k * CONTENT_H_IN)
  return out
}

/** Scale that fits the sheet in a container, never above 1 and never below a readable floor. */
export function fitScale(containerWidthPx: number, gutterPx = 32): number {
  if (!isFinite(containerWidthPx) || containerWidthPx <= 0) return 1
  const s = (containerWidthPx - gutterPx) / PAGE_W_PX
  return Math.max(0.3, Math.min(1, s))
}
