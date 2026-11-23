// Pure analysis layer: lint, view model for the preview, ATS text, round-trip check, editor diagnostics.
import {
  lintResume, parseResume, parseHeader, toPlainText, parseCriteria, evaluateCriteria,
} from '../../lib/resume'
import type { Problem, ParsedResume, ResumeHeader, CriteriaReport, Criterion, CriteriaParseError } from '../../lib/resume'
import { headingFor, isUnknownHeading } from '../../lib/resume/parse'

/** The library caps parsing at this many characters; everything here uses the same window. */
export const ANALYSIS_LIMIT = 200_000
export const MAX_DIAGNOSTICS = 2000

export interface OtherSection { title: string; lines: string[] }
export interface ViewModel {
  header: ResumeHeader
  resume: ParsedResume
  other: OtherSection[]
  /** Text shown as written when the document has no recognizable headings. */
  loose: string[]
  notes: string[]
  empty: boolean
  truncated: boolean
}

const CONTACT = /@|https?:|www\.|linkedin|github|\.(com|org|net|io|dev)\b|\+?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/i

const EMPTY_RESUME: ParsedResume = { summary: '', education: [], experience: [], skills: { technical: [], soft: [] }, projects: [] }

export function headerText(h: ResumeHeader): string {
  return [h.name, h.contact.join(' | ')].filter(Boolean).join('\n')
}

function scanStructure(lines: string[]): { known: number; other: OtherSection[]; headerEnd: number } {
  let known = 0
  let headerEnd = -1
  const other: OtherSection[] = []
  let cur: OtherSection | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()
    if (headingFor(t)) {
      if (headerEnd < 0) headerEnd = i
      known++
      cur = null
      continue
    }
    if (known > 0 && t && isUnknownHeading(lines, i)) {
      other.push((cur = { title: t.replace(/[:：]+$/, ''), lines: [] }))
      continue
    }
    if (cur && t) cur.lines.push(t)
  }
  return { known, other, headerEnd }
}

export function buildView(text: string): ViewModel {
  const source = typeof text === 'string' ? text : ''
  const truncated = source.length >= ANALYSIS_LIMIT
  const input = source.length > ANALYSIS_LIMIT ? source.slice(0, ANALYSIS_LIMIT) : source
  const notes: string[] = []
  if (truncated) notes.push(`Only the first ${ANALYSIS_LIMIT.toLocaleString('en-US')} characters are analysed and previewed.`)
  if (!input.trim()) return { header: { name: '', contact: [] }, resume: EMPTY_RESUME, other: [], loose: [], notes, empty: true, truncated }

  let header: ResumeHeader = { name: '', contact: [] }
  let resume: ParsedResume = EMPTY_RESUME
  let other: OtherSection[] = []
  let loose: string[] = []
  try {
    header = parseHeader(input)
    resume = parseResume(input)
    const lines = input.split(/\r?\n/)
    const s = scanStructure(lines)
    other = s.other
    if (s.known === 0 && s.other.length === 0) {
      // the header parser takes up to four leading lines; without headings, keep only contact-looking
      // lines in the header and show everything else as written
      const contactLike = (t: string) => t.split(/\s*[|\u2022\u00b7]\s*|\s{3,}/).filter(Boolean).every(p => CONTACT.test(p))
      const contact: string[] = []
      let seenName = false
      for (const l of lines) {
        const t = l.trim()
        if (!t) continue
        if (!seenName) { seenName = true; continue }
        if (contactLike(t)) contact.push(...t.split(/\s*[|\u2022\u00b7]\s*|\s{3,}/).map(x => x.trim()).filter(Boolean))
        else loose.push(t)
      }
      header = { name: header.name, contact }
      notes.push('No section headings were found (for example Experience, Education, Skills), so the text below the header is shown as written.')
    }
  } catch {
    notes.push('The text could not be parsed. It is shown as written.')
    loose = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 2000)
  }

  const nothing = !resume.summary && !resume.experience.length && !resume.education.length && !resume.projects.length
    && !resume.skills.technical.length && !resume.skills.soft.length && !other.length
  if (nothing && !loose.length && !header.name) notes.push('Nothing could be read from this text yet.')
  return { header, resume, other, loose, notes, empty: false, truncated }
}

/** Plain text an ATS would pull from the printed PDF: header, then sections in the order the PDF prints them. */
export function atsText(view: ViewModel): string {
  if (view.empty) return ''
  let out = toPlainText(view.resume, headerText(view.header)).replace(/\n+$/, '')
  const extra: string[] = []
  for (const o of view.other) extra.push('', o.title.toUpperCase(), ...o.lines)
  if (view.loose.length) extra.push('', ...view.loose)
  if (extra.length) out += '\n' + extra.join('\n')
  return out.replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ---------------------------------------------------------------- round trip

export interface RoundTripRow { label: string; original: number; after: number; ok: boolean }
export interface RoundTrip { rows: RoundTripRow[]; lost: string[]; ok: boolean; skippedLostScan: boolean }

function counts(v: ViewModel) {
  const r = v.resume
  return {
    'Name found': v.header.name ? 1 : 0,
    'Contact items': v.header.contact.length,
    'Summary': r.summary ? 1 : 0,
    'Experience roles': r.experience.length,
    'Experience bullets': r.experience.reduce((n, e) => n + e.responsibilities.length, 0),
    'Education entries': r.education.length,
    'Projects': r.projects.length,
    'Skills': r.skills.technical.length + r.skills.soft.length,
    'Other sections': v.other.length,
  }
}

const WORD = /[\p{L}\p{N}][\p{L}\p{N}.+#'-]*/gu
function words(s: string): string[] {
  return (s.toLowerCase().match(WORD) ?? [])
}

/** Re-parse the ATS text and compare what survived with what the original text produced. */
export function roundTrip(original: ViewModel, ats: string, originalText: string): RoundTrip {
  const again = buildView(ats)
  const a = counts(original)
  const b = counts(again)
  const rows: RoundTripRow[] = (Object.keys(a) as Array<keyof typeof a>).map(label => ({
    label, original: a[label], after: b[label], ok: b[label] >= a[label],
  }))

  // lines of the original whose words mostly vanished from the ATS text
  const lost: string[] = []
  let skipped = false
  const body = originalText.slice(0, ANALYSIS_LIMIT)
  if (body.length > 60_000) skipped = true
  else {
    const have = new Set(words(ats))
    for (const line of body.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || headingFor(t)) continue
      const w = words(t)
      if (w.length < 2) continue
      const missing = w.filter(x => !have.has(x))
      if (missing.length / w.length > 0.4) {
        lost.push(t.length > 110 ? t.slice(0, 109) + '…' : t)
        if (lost.length >= 20) break
      }
    }
  }
  return { rows, lost, ok: rows.every(r => r.ok) && lost.length === 0, skippedLostScan: skipped }
}

// ---------------------------------------------------------------- lint + criteria -> editor diagnostics

export interface DiagAction { name: string; change: { from: number; to: number; insert: string } }
export interface DiagData {
  from: number
  to: number
  severity: 'error' | 'warning' | 'info'
  message: string
  source: 'lint' | 'criteria'
  actions: DiagAction[]
}

export function safeLint(text: string): Problem[] {
  try { return lintResume(text.slice(0, ANALYSIS_LIMIT)) } catch { return [] }
}

export function parseCriteriaSafe(text: string): { criteria: Criterion[]; errors: CriteriaParseError[] } {
  try { return parseCriteria(text) } catch { return { criteria: [], errors: [{ line: 1, text: '', message: 'Could not read the criteria.' }] } }
}

export function evaluateSafe(text: string, criteria: Criterion[], pages: number | undefined): CriteriaReport | null {
  if (!criteria.length) return null
  try { return evaluateCriteria(text.slice(0, ANALYSIS_LIMIT), criteria, { pages }) } catch { return null }
}

export function maxPagesRule(criteria: Criterion[]): number | null {
  const c = criteria.find(x => x.kind === 'max-pages')
  const n = c && typeof c.params.max === 'number' ? c.params.max : null
  return n
}

export function toDiagnostics(problems: readonly Problem[], report: CriteriaReport | null, docLength: number): DiagData[] {
  const out: DiagData[] = []
  const clamp = (from: number, to: number): [number, number] | null => {
    if (!Number.isFinite(from) || !Number.isFinite(to) || docLength === 0) return null
    let f = Math.max(0, Math.min(docLength, Math.floor(from)))
    let t = Math.max(0, Math.min(docLength, Math.floor(to)))
    if (t <= f) { if (f >= docLength) f = docLength - 1; t = f + 1 }
    return [f, t]
  }
  for (const p of problems) {
    const r = clamp(p.from, p.to)
    if (!r) continue
    const actions: DiagAction[] = []
    if (p.fix) actions.push({ name: p.fix.label, change: { from: p.fix.from, to: p.fix.to, insert: p.fix.insert } })
    out.push({ from: r[0], to: r[1], severity: p.severity, message: p.message, source: 'lint', actions })
    if (out.length >= MAX_DIAGNOSTICS) return out
  }
  if (report) {
    for (const res of report.results) {
      if (res.pass) continue
      for (const loc of res.locations) {
        const r = clamp(loc.from, loc.to)
        if (!r) continue
        out.push({ from: r[0], to: r[1], severity: 'info', message: `${res.criterion.text}: ${res.detail}`, source: 'criteria', actions: [] })
        if (out.length >= MAX_DIAGNOSTICS) return out
      }
    }
  }
  return out
}

export function countBySeverity(problems: readonly Problem[]): { error: number; warning: number; info: number } {
  const c = { error: 0, warning: 0, info: 0 }
  for (const p of problems) c[p.severity]++
  return c
}
