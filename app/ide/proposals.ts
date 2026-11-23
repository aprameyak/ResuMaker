// Pure helpers for turning proposals, fixes and diffs into editor changes. No React, no CodeMirror.
import { analyzeJobDescription, optimizeResume } from '../../lib/resume'
import type { Problem, Keywords } from '../../lib/resume'

export interface TextChange { from: number; to: number; insert: string }
export interface RangeProposal { from: number; to: number; before: string; after: string }

export type Check = { ok: true } | { ok: false; reason: string }

export function checkProposal(doc: string, p: RangeProposal): Check {
  if (!Number.isInteger(p.from) || !Number.isInteger(p.to) || p.from < 0 || p.to < p.from || p.to > doc.length) {
    return { ok: false, reason: 'The proposed range is outside the resume. Run the request again.' }
  }
  if (doc.slice(p.from, p.to) !== p.before) {
    return { ok: false, reason: 'The resume changed since this proposal was made, so the proposed edit no longer lines up. Reject it and run the request again.' }
  }
  return { ok: true }
}

export function applyChanges(text: string, changes: readonly TextChange[]): string {
  const sorted = changes.slice().sort((a, b) => b.from - a.from || b.to - a.to)
  let out = text
  for (const c of sorted) out = out.slice(0, c.from) + c.insert + out.slice(c.to)
  return out
}

/** Smallest single replacement that turns `before` into `after`, positioned at `base`. */
export function minimalChange(before: string, after: string, base = 0): TextChange | null {
  if (before === after) return null
  let pre = 0
  const max = Math.min(before.length, after.length)
  while (pre < max && before.charCodeAt(pre) === after.charCodeAt(pre)) pre++
  let suf = 0
  while (suf < max - pre && before.charCodeAt(before.length - 1 - suf) === after.charCodeAt(after.length - 1 - suf)) suf++
  return { from: base + pre, to: base + before.length - suf, insert: after.slice(pre, after.length - suf) }
}

/** One change per edited line when the line count is unchanged (keeps the cursor in untouched lines); otherwise one minimal change. */
export function proposalChanges(p: RangeProposal): TextChange[] {
  if (p.before === p.after) return []
  const a = p.before.split('\n')
  const b = p.after.split('\n')
  if (a.length !== b.length) {
    const c = minimalChange(p.before, p.after, p.from)
    return c ? [c] : []
  }
  const out: TextChange[] = []
  let pos = p.from
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      const c = minimalChange(a[i], b[i], pos)
      if (c) out.push(c)
    }
    pos += a[i].length + 1
  }
  return out
}

/** Non-overlapping fixes from a problem list, as editor changes. Same selection rule as applyFixes in lib/resume/lint. */
export function fixChanges(problems: readonly Problem[]): TextChange[] {
  const fixes = problems.map(p => p.fix).filter((f): f is NonNullable<Problem['fix']> => Boolean(f)).sort((a, b) => a.from - b.from)
  const out: TextChange[] = []
  let lastEnd = -1
  for (const f of fixes) {
    if (f.from < lastEnd) continue
    out.push({ from: f.from, to: f.to, insert: f.insert })
    lastEnd = f.to
  }
  return out
}

export interface AliasProposal { proposal: RangeProposal | null; count: number; notes: string[]; skipped: number }

/**
 * "Spell out aliases": only the wording changes optimizeResume makes because the posting uses the long form
 * (for example "JS" -> "JavaScript"). Lines where the optimizer would also make a style fix are left alone
 * and counted in `skipped`, so the proposal never mixes in other edits. Nothing is applied here.
 */
export function aliasProposal(text: string, keywords: Keywords, maxLines = 4000): AliasProposal {
  const lines = text.split('\n')
  const out = lines.slice()
  const notes: string[] = []
  let count = 0
  let skipped = 0
  const limit = Math.min(lines.length, maxLines)
  for (let i = 0; i < limit; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    let res
    try { res = optimizeResume(line, keywords) } catch { continue }
    if (res.optimized === line) continue
    const aliasOnly = res.changes.length > 0 && res.changes.every(c => c.explanation.startsWith('The job posting says'))
    if (!aliasOnly) { skipped++; continue }
    out[i] = res.optimized
    count++
    for (const c of res.changes) if (!notes.includes(c.explanation)) notes.push(c.explanation)
  }
  if (!count) return { proposal: null, count: 0, notes: [], skipped }
  const after = out.join('\n')
  return { proposal: { from: 0, to: text.length, before: text, after }, count, notes, skipped }
}

export function keywordsFor(jobText: string): Keywords {
  return analyzeJobDescription(jobText.slice(0, 100_000))
}
