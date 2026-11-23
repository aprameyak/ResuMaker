// Small, pure diff helpers. No React, no DOM.

export type DiffType = 'eq' | 'add' | 'del'
export interface DiffOp<T = string> { type: DiffType; value: T }

export const DEFAULT_MAX_CELLS = 4_000_000

/** Longest-common-subsequence diff of two arrays. Trims common head/tail first; falls back to a coarse replace when the middle is huge. */
export function lcsDiff<T>(a: readonly T[], b: readonly T[], maxCells = DEFAULT_MAX_CELLS): { ops: Array<DiffOp<T>>; coarse: boolean } {
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB-- }

  const ops: Array<DiffOp<T>> = []
  for (let i = 0; i < start; i++) ops.push({ type: 'eq', value: a[i] })

  const n = endA - start
  const m = endB - start
  let coarse = false
  if (n === 0) {
    for (let j = 0; j < m; j++) ops.push({ type: 'add', value: b[start + j] })
  } else if (m === 0) {
    for (let i = 0; i < n; i++) ops.push({ type: 'del', value: a[start + i] })
  } else if ((n + 1) * (m + 1) > maxCells) {
    coarse = true
    for (let i = 0; i < n; i++) ops.push({ type: 'del', value: a[start + i] })
    for (let j = 0; j < m; j++) ops.push({ type: 'add', value: b[start + j] })
  } else {
    const w = m + 1
    const dp = new Uint32Array((n + 1) * w)
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i * w + j] = a[start + i] === b[start + j]
          ? dp[(i + 1) * w + j + 1] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1])
      }
    }
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (a[start + i] === b[start + j]) { ops.push({ type: 'eq', value: a[start + i] }); i++; j++ }
      else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { ops.push({ type: 'del', value: a[start + i] }); i++ }
      else { ops.push({ type: 'add', value: b[start + j] }); j++ }
    }
    while (i < n) { ops.push({ type: 'del', value: a[start + i] }); i++ }
    while (j < m) { ops.push({ type: 'add', value: b[start + j] }); j++ }
  }

  for (let i = endA; i < a.length; i++) ops.push({ type: 'eq', value: a[i] })
  return { ops, coarse }
}

export function lineDiff(before: string, after: string, maxCells = DEFAULT_MAX_CELLS): { ops: Array<DiffOp<string>>; coarse: boolean } {
  return lcsDiff(before.split('\n'), after.split('\n'), maxCells)
}

export function diffStats(ops: Array<DiffOp<unknown>>): { added: number; removed: number; same: number } {
  let added = 0, removed = 0, same = 0
  for (const o of ops) {
    if (o.type === 'add') added++
    else if (o.type === 'del') removed++
    else same++
  }
  return { added, removed, same }
}

export interface Seg { text: string; changed: boolean }
export interface DiffRow { type: DiffType; text: string; segs?: Seg[] }

function tokens(s: string): string[] {
  return s.match(/\s+|[^\s]+/g) ?? []
}

/** Word-level segments for one removed line and the added line that replaces it. */
export function wordSegments(before: string, after: string): { before: Seg[]; after: Seg[] } {
  const { ops, coarse } = lcsDiff(tokens(before), tokens(after), 250_000)
  if (coarse) return { before: [{ text: before, changed: true }], after: [{ text: after, changed: true }] }
  const b: Seg[] = []
  const a: Seg[] = []
  const push = (list: Seg[], text: string, changed: boolean) => {
    const last = list[list.length - 1]
    if (last && last.changed === changed) last.text += text
    else list.push({ text, changed })
  }
  for (const o of ops) {
    if (o.type === 'eq') { push(b, o.value, false); push(a, o.value, false) }
    else if (o.type === 'del') push(b, o.value, true)
    else push(a, o.value, true)
  }
  return { before: b, after: a }
}

/** Line diff rows for display. A run of removed lines followed by added lines is paired up for word-level marks. */
export function diffRows(before: string, after: string, maxCells = DEFAULT_MAX_CELLS): { rows: DiffRow[]; coarse: boolean; stats: { added: number; removed: number; same: number } } {
  const { ops, coarse } = lineDiff(before, after, maxCells)
  const rows: DiffRow[] = []
  let i = 0
  while (i < ops.length) {
    if (ops[i].type === 'eq') { rows.push({ type: 'eq', text: ops[i].value }); i++; continue }
    const dels: string[] = []
    const adds: string[] = []
    while (i < ops.length && ops[i].type === 'del') dels.push(ops[i++].value)
    while (i < ops.length && ops[i].type === 'add') adds.push(ops[i++].value)
    // an 'add' run that starts without a 'del' run (or the reverse order) is handled by the loop above too
    const pairs = Math.min(dels.length, adds.length)
    const delRows: DiffRow[] = dels.map(t => ({ type: 'del', text: t }))
    const addRows: DiffRow[] = adds.map(t => ({ type: 'add', text: t }))
    for (let k = 0; k < pairs; k++) {
      if (dels[k].length <= 2000 && adds[k].length <= 2000) {
        const s = wordSegments(dels[k], adds[k])
        delRows[k].segs = s.before
        addRows[k].segs = s.after
      }
    }
    rows.push(...delRows, ...addRows)
  }
  return { rows, coarse, stats: diffStats(ops) }
}
