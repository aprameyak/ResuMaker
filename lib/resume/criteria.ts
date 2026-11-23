import { BULLET, DATE_RANGE, headingFor, isHeaderCandidate, isUnknownHeading } from './parse'
import { containsTerm } from './keywords'
import { ALIASES, GERUNDS } from './dictionary'
import { lintResume } from './lint'

export interface Criterion {
  id: string
  text: string
  kind: string
  params: Record<string, unknown>
}

export interface CriterionResult {
  criterion: Criterion
  pass: boolean
  detail: string
  locations: Array<{ from: number; to: number }>
}

export interface CriteriaReport {
  results: CriterionResult[]
  score: number
  passed: number
  failed: number
  total: number
}

export interface CriteriaParseError {
  line: number
  text: string
  message: string
}

type Loc = { from: number; to: number }

const LINES_PER_PAGE = 54
const MAX_LOCATIONS = 500
const SECTIONS = ['summary', 'experience', 'education', 'skills', 'projects']

// ---------------------------------------------------------------- parsing

interface Rule {
  kind: string
  key: string
  example: string
  arg: boolean
  build: (rest: string, rawRest: string) => { params: Record<string, unknown>; canonical: string } | string
}

function int(rest: string, label: string, example: string, min = 0): number | string {
  if (!/^\d+$/.test(rest)) return `"${label}" needs a whole number, e.g. "${example}".`
  const n = Number(rest)
  if (n < min) return `"${label}" must be at least ${min}, e.g. "${example}".`
  return n
}

function splitList(raw: string): string[] {
  // a trailing sentence period ("sql.", "node.js.") is never part of a term
  return raw.split(',').map(s => s.trim().replace(/\.+$/, '')).filter(Boolean)
}

const RULES: Rule[] = [
  {
    kind: 'max-bullets-per-role', key: 'max bullets per role', example: 'max bullets per role: 5', arg: true,
    build: rest => { const n = int(rest, 'max bullets per role', 'max bullets per role: 5'); return typeof n === 'string' ? n : { params: { max: n }, canonical: `max bullets per role: ${n}` } },
  },
  {
    kind: 'min-bullets-per-role', key: 'min bullets per role', example: 'min bullets per role: 2', arg: true,
    build: rest => { const n = int(rest, 'min bullets per role', 'min bullets per role: 2'); return typeof n === 'string' ? n : { params: { min: n }, canonical: `min bullets per role: ${n}` } },
  },
  {
    kind: 'max-bullet-length', key: 'max bullet length', example: 'max bullet length: 160', arg: true,
    build: rest => {
      const n = int(rest.replace(/\s*(characters|chars)$/, ''), 'max bullet length', 'max bullet length: 160', 1)
      return typeof n === 'string' ? n : { params: { max: n }, canonical: `max bullet length: ${n}` }
    },
  },
  {
    kind: 'max-words-per-bullet', key: 'max words per bullet', example: 'max words per bullet: 30', arg: true,
    build: rest => { const n = int(rest, 'max words per bullet', 'max words per bullet: 30', 1); return typeof n === 'string' ? n : { params: { max: n }, canonical: `max words per bullet: ${n}` } },
  },
  {
    kind: 'min-words-per-bullet', key: 'min words per bullet', example: 'min words per bullet: 6', arg: true,
    build: rest => { const n = int(rest, 'min words per bullet', 'min words per bullet: 6'); return typeof n === 'string' ? n : { params: { min: n }, canonical: `min words per bullet: ${n}` } },
  },
  {
    kind: 'bullets-with-numbers', key: 'bullets with numbers', example: 'bullets with numbers: 40%', arg: true,
    build: rest => {
      const m = rest.match(/^(\d+(?:\.\d+)?)\s*%$/)
      if (!m) return '"bullets with numbers" needs a percentage, e.g. "bullets with numbers: 40%".'
      const p = Number(m[1])
      if (p > 100) return 'A percentage cannot be above 100, e.g. "bullets with numbers: 40%".'
      return { params: { percent: p }, canonical: `bullets with numbers: ${p}%` }
    },
  },
  {
    kind: 'must-include', key: 'must include', example: 'must include: python, sql', arg: true,
    build: (rest, raw) => {
      const terms = splitList(raw)
      if (!terms.length) return '"must include" needs a comma-separated list, e.g. "must include: python, sql".'
      return { params: { terms }, canonical: `must include: ${terms.map(t => t.toLowerCase()).join(', ')}` }
    },
  },
  {
    kind: 'must-not-include', key: 'must not include', example: 'must not include: references available', arg: true,
    build: (rest, raw) => {
      const terms = splitList(raw)
      if (!terms.length) return '"must not include" needs a comma-separated list, e.g. "must not include: objective, references".'
      return { params: { terms }, canonical: `must not include: ${terms.map(t => t.toLowerCase()).join(', ')}` }
    },
  },
  {
    kind: 'start-with-verb', key: 'start bullets with a verb', example: 'start bullets with a verb', arg: false,
    build: () => ({ params: {}, canonical: 'start bullets with a verb' }),
  },
  {
    kind: 'no-first-person', key: 'no first person', example: 'no first person', arg: false,
    build: () => ({ params: {}, canonical: 'no first person' }),
  },
  {
    kind: 'max-pages', key: 'max pages', example: 'max pages: 1', arg: true,
    build: rest => { const n = int(rest, 'max pages', 'max pages: 1', 1); return typeof n === 'string' ? n : { params: { max: n }, canonical: `max pages: ${n}` } },
  },
  {
    kind: 'max-summary-words', key: 'max summary words', example: 'max summary words: 50', arg: true,
    build: rest => { const n = int(rest, 'max summary words', 'max summary words: 50'); return typeof n === 'string' ? n : { params: { max: n }, canonical: `max summary words: ${n}` } },
  },
  {
    kind: 'date-format', key: 'date format', example: 'date format: Mon YYYY', arg: true,
    build: rest => {
      if (rest.replace(/\s+/g, ' ') !== 'mon yyyy') return 'Only the "Mon YYYY" date format is supported, e.g. "date format: Mon YYYY" (Jan 2020).'
      return { params: { format: 'Mon YYYY' }, canonical: 'date format: mon yyyy' }
    },
  },
  {
    kind: 'require-sections', key: 'require sections', example: 'require sections: experience, education, skills', arg: true,
    build: (rest, raw) => {
      const names = splitList(raw)
      if (!names.length) return '"require sections" needs a list, e.g. "require sections: experience, education, skills".'
      const out: string[] = []
      for (const n of names) {
        const s = headingFor(n) ?? (SECTIONS.includes(n.toLowerCase()) ? n.toLowerCase() : null)
        if (!s) return `Unknown section "${n}". Use: ${SECTIONS.join(', ')}.`
        if (!out.includes(s)) out.push(s)
      }
      return { params: { sections: out }, canonical: `require sections: ${out.join(', ')}` }
    },
  },
  {
    kind: 'no-lint-errors', key: 'no lint errors', example: 'no lint errors', arg: false,
    build: () => ({ params: {}, canonical: 'no lint errors' }),
  },
  {
    kind: 'no-lint-warnings', key: 'no lint warnings', example: 'no lint warnings', arg: false,
    build: () => ({ params: {}, canonical: 'no lint warnings' }),
  },
]

function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

function closest(key: string): Rule {
  let best = RULES[0]
  let bestScore = Infinity
  for (const r of RULES) {
    const d = distance(key.slice(0, 60), r.key)
    if (d < bestScore) { bestScore = d; best = r }
  }
  return best
}

function stripComment(line: string): string {
  const m = line.match(/(?:^|\s)#/)
  return m && m.index !== undefined ? line.slice(0, m.index) : line
}

export function parseCriteria(source: string): { criteria: Criterion[]; errors: CriteriaParseError[] } {
  const criteria: Criterion[] = []
  const errors: CriteriaParseError[] = []
  const seen = new Set<string>()
  const lines = String(source ?? '').split(/\r?\n/)

  lines.forEach((original, i) => {
    const err = (message: string) => errors.push({ line: i + 1, text: original.trim(), message })
    try {
      const text = stripComment(original).trim().replace(/\s+/g, ' ')
      if (!text) return
      const norm = text.toLowerCase().replace(/\.+$/, '')
      const colon = text.indexOf(':')
      const key = (colon >= 0 ? norm.slice(0, norm.indexOf(':')) : norm).trim()
      const rawRest = colon >= 0 ? text.slice(colon + 1).trim() : ''
      const rest = rawRest.toLowerCase().replace(/\.+$/, '')

      let rule = RULES.find(r => r.key === key)
      if (!rule) {
        // "max pages 1" (missing colon) or "start bullets with verbs"
        rule = RULES.find(r => r.arg && colon < 0 && norm.startsWith(r.key + ' '))
        if (rule) {
          err(`Missing colon after "${rule.key}". Did you mean "${rule.key}: ${norm.slice(rule.key.length + 1)}"?`)
          return
        }
        if (/^start bullets with (an? )?verbs?$/.test(norm)) rule = RULES.find(r => r.kind === 'start-with-verb')
      }
      if (!rule) {
        const c = closest(key)
        err(`Unknown criterion "${text}". Did you mean "${c.example}"?`)
        return
      }
      if (!rule.arg && rest) {
        err(`"${rule.key}" takes no value. Write just "${rule.example}".`)
        return
      }
      if (rule.arg && !rawRest) {
        err(`"${rule.key}" needs a value, e.g. "${rule.example}".`)
        return
      }
      const built = rule.build(rest, rawRest)
      if (typeof built === 'string') { err(built); return }
      if (seen.has(built.canonical)) { err(`Duplicate criterion "${built.canonical}".`); return }
      seen.add(built.canonical)
      criteria.push({ id: built.canonical, text, kind: rule.kind, params: built.params })
    } catch {
      err('Could not read this line.')
    }
  })
  return { criteria, errors }
}

export const CRITERIA_PRESETS: Record<string, string> = {
  'ats-safe': `# Plain structure that applicant tracking systems read reliably
require sections: experience, education, skills
date format: Mon YYYY
no first person
start bullets with a verb
no lint errors
max pages: 2
must not include: references available upon request
`,
  'one-page-student': `# One page, short bullets, some numbers
max pages: 1
require sections: education, experience, skills
min bullets per role: 1
max bullets per role: 4
max bullet length: 160
bullets with numbers: 30%
start bullets with a verb
no first person
max summary words: 40
`,
  'swe-industry': `# Software engineering resume for industry roles
max pages: 1
require sections: experience, education, skills
min bullets per role: 2
max bullets per role: 6
max words per bullet: 35
min words per bullet: 6
bullets with numbers: 50%
start bullets with a verb
no first person
no lint errors
must not include: responsible for, references available upon request
`,
}

// ------------------------------------------------------------- scanning

interface Line { start: number; end: number; text: string; trimmed: string; indent: number }

interface Bullet {
  from: number
  to: number
  body: string
  section: string
  role: number // index into roles, -1 if not in a role
}

interface Role { from: number; to: number; bullets: number }

interface Scan {
  lines: Line[]
  bullets: Bullet[]
  roles: Role[]
  sections: Set<string>
  summary: Array<{ from: number; to: number; text: string }>
  headerLinesBySection: Array<{ section: string; line: Line }>
  /** physical-line spans of bullet/summary/prose text (not role headers, contact lines or skills) */
  bodySpans: Loc[]
  nonblank: number
}

function scan(text: string): Scan {
  const lines: Line[] = []
  let offset = 0
  for (const raw of text.split('\n')) {
    const withoutCr = raw.endsWith('\r') ? raw.slice(0, -1) : raw
    const trimmed = withoutCr.trim()
    const indent = withoutCr.length - withoutCr.trimStart().length
    lines.push({ start: offset, end: offset + withoutCr.length, text: withoutCr, trimmed, indent })
    offset += raw.length + 1
  }

  const bullets: Bullet[] = []
  const roles: Role[] = []
  const sections = new Set<string>()
  const summary: Scan['summary'] = []
  const headerLinesBySection: Scan['headerLinesBySection'] = []
  const bodySpans: Loc[] = []
  let nonblank = 0
  let section = 'header'
  let role: Role | null = null
  let last: Bullet | null = null
  let lastIndent = 0
  const rawTrimmed = lines.map(l => l.text)

  const nextNonblank = (from: number): string => {
    for (let k = from + 1; k < lines.length; k++) if (lines[k].trimmed) return lines[k].trimmed
    return ''
  }

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    const t = line.trimmed
    if (!t) { last = null; continue }
    nonblank++
    const textStart = line.start + line.indent
    const textEnd = textStart + t.length

    let heading = headingFor(t)
    let inlineRest: string | null = null
    if (!heading) {
      const inline = t.match(/^([A-Za-z &]{3,30}?)\s*:\s*(\S.*)$/)
      const h = inline ? headingFor(inline[1]) : null
      if (inline && h) { heading = h; inlineRest = inline[2] }
    }
    if (!heading && section !== 'header' && !BULLET.test(line.text) && isUnknownHeading(rawTrimmed, li)) {
      section = 'other'
      role = null
      last = null
      continue
    }
    if (heading) {
      section = heading
      sections.add(heading)
      role = null
      last = null
      if (inlineRest !== null && heading === 'summary') {
        const at = line.start + line.text.indexOf(inlineRest)
        summary.push({ from: at, to: line.end, text: inlineRest })
        bodySpans.push({ from: at, to: line.end })
      }
      continue
    }

    const b = line.text.match(BULLET)
    if (b) {
      const from = line.start + b[0].length
      const body = line.text.slice(b[0].length).trimEnd()
      if (!body.trim()) { last = null; continue }
      if (section === 'experience') {
        if (!role) { role = { from: textStart, to: line.end, bullets: 0 }; roles.push(role) }
        role.bullets++
      }
      const bullet: Bullet = { from, to: from + body.length, body: body.replace(/\s+/g, ' ').trim(), section, role: section === 'experience' ? roles.length - 1 : -1 }
      if (section !== 'skills') {
        bullets.push(bullet)
        bodySpans.push({ from, to: from + body.length })
      }
      if (section === 'summary') summary.push({ from, to: from + body.length, text: bullet.body })
      last = section !== 'skills' ? bullet : null
      lastIndent = line.indent
      continue
    }

    if (last) {
      // A non-blank line right after a bullet is a wrapped continuation unless it clearly starts something new.
      const atMarker = line.indent <= lastIndent
      const startsLower = /^[\p{Ll}(]/u.test(t)
      const label = /^\p{Lu}[\p{L}\p{N} &/]{1,30}:\s/u.test(t)
      if (!startsLower && atMarker && label) {
        // "Environment: Linux" style note under a role: ends the bullet, is not a new role
        last = null
        continue
      }
      const dateHeader = DATE_RANGE.exec(t)
      const newRole = !startsLower && atMarker && (
        (dateHeader !== null && dateHeader.index <= 40) ||
        (/^\p{Lu}/u.test(t) && isHeaderCandidate(t)) ||
        (/^\p{Lu}/u.test(t) && t.length < 60 && !/[.!?,;:]$/.test(t) && isHeaderCandidate(nextNonblank(li)) && !BULLET.test(nextNonblank(li)))
      )
      if (!newRole) {
        last.to = textEnd
        last.body = (last.body + ' ' + t).replace(/\s+/g, ' ').trim()
        bodySpans.push({ from: textStart, to: textEnd })
        if (last.section === 'summary') summary.push({ from: textStart, to: textEnd, text: t })
        continue
      }
    }
    last = null

    if (section === 'summary') {
      summary.push({ from: textStart, to: textEnd, text: t })
    }
    if (section === 'summary' || section === 'projects' || section === 'other' || (section === 'header' && !/@|https?:|www\.|\d/i.test(t))) {
      bodySpans.push({ from: textStart, to: textEnd })
    }
    if (section === 'experience') {
      if (!role || role.bullets > 0) {
        role = { from: textStart, to: textEnd, bullets: 0 }
        roles.push(role)
      }
    }
    headerLinesBySection.push({ section, line })
  }
  return { lines, bullets, roles, sections, summary, headerLinesBySection, bodySpans, nonblank }
}

// ----------------------------------------------------------- evaluation

// Unicode-aware boundaries: not inside a word, e-mail, URL or domain (me.com, my-portfolio.dev, Rémy).
const LEFT = "(?<![\\p{L}\\p{N}_.@/:'’-])"
const RIGHT = '(?![\\p{L}\\p{N}_@/-]|\\.[\\p{L}\\p{N}]|://)'
const FP_CONTRACTION = new RegExp(`${LEFT}I['’](?:m|ve|ll|d)(?![\\p{L}])`, 'giu')
const FP_BARE_I = new RegExp(`${LEFT}I(?=[ \\t]+\\p{L})`, 'gu')
const FP_MY = new RegExp(`${LEFT}(?:my|me|myself|mine)${RIGHT}`, 'giu')
const ROMAN_LABEL = /\b(?:phase|type|level|part|grade|stage|class|step|section|chapter|volume|tier|category|year|group|module|unit|act|war|schedule|title|factor|trial|tier)[ \t]*$/i
const ROMAN_AFTER = /^(?:[ \t]+(?:and|or|&|to|through)[ \t]+(?:[IVX]+\b|\d)|[ \t]*[,/–-][ \t]*[IVX]+\b)/

function firstPersonIn(span: string): Loc[] {
  const out: Loc[] = []
  for (const m of Array.from(span.matchAll(FP_CONTRACTION))) out.push({ from: m.index ?? 0, to: (m.index ?? 0) + m[0].length })
  for (const m of Array.from(span.matchAll(FP_BARE_I))) {
    const at = m.index ?? 0
    // "Phase I and II", "Type I and Type II" are Roman numerals, not the pronoun
    if (ROMAN_LABEL.test(span.slice(Math.max(0, at - 14), at)) || ROMAN_AFTER.test(span.slice(at + 1, at + 24))) continue
    out.push({ from: at, to: at + 1 })
  }
  for (const m of Array.from(span.matchAll(FP_MY))) {
    // "ME" / "MY" in capitals is a state code or acronym, not a pronoun
    if (m[0].length > 1 && m[0] === m[0].toUpperCase()) continue
    out.push({ from: m.index ?? 0, to: (m.index ?? 0) + m[0].length })
  }
  return out
}

// Verb check: positive evidence (past tense -ed/-é, irregular past, gerund from the dictionary) minus a blocklist.
const WEAK_OPENERS = new Set(['responsible', 'worked', 'helped', 'assisted', 'duties', 'duty', 'tasks', 'task', 'involved', 'participated'])
const IRREGULAR_PAST = new Set([
  'led', 'built', 'ran', 'wrote', 'drove', 'won', 'took', 'made', 'sold', 'taught', 'spoke', 'began', 'grew', 'set', 'cut', 'put', 'read',
  'hit', 'spread', 'gave', 'found', 'kept', 'held', 'brought', 'thought', 'chose', 'drew', 'spent', 'sent', 'met', 'paid', 'saw', 'told',
  'oversaw', 'understood', 'forged', 'drafted', 'bought', 'caught', 'fed', 'got', 'leapt', 'lost', 'rose', 'sped', 'shot', 'swept', 'wove',
  'rebuilt', 'rewrote', 'redesigned', 'overhauled', 'undertook', 'outperformed', 'withdrew', 'upheld', 'mentored',
])
const ADJECTIVE_ED = new Set([
  'experienced', 'skilled', 'motivated', 'dedicated', 'seasoned', 'accomplished', 'talented', 'committed', 'qualified', 'detailed',
  'passionate', 'licensed', 'certified', 'proven', 'results', 'detail',
])

function verbCheck(word: string): 'ok' | 'weak' | 'no' {
  const tok = word.replace(/[,;:.!?]+$/, '')
  if (!/^\p{L}[\p{L}'’/-]*$/u.test(tok)) return 'no'
  const lower = tok.toLowerCase()
  if (WEAK_OPENERS.has(lower)) return 'weak'
  // "Wrote/edited" -> first alternative; "Co-founded" -> last hyphen part
  const first = lower.split('/')[0]
  const core = first.split('-').pop() || first
  if (ADJECTIVE_ED.has(core)) return 'no'
  if (Object.prototype.hasOwnProperty.call(GERUNDS, core)) return 'ok'
  if (IRREGULAR_PAST.has(core) || Object.values(GERUNDS).some(v => v.toLowerCase() === core)) return 'ok'
  if (core.length > 3 && /(?:ed|é)$/.test(core)) return 'ok'
  return 'no'
}

const MONTH_TOKEN = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\b|\b\d{1,2}\/\d{4}\b|\b(?:19|20)\d{2}\b/gi
const GOOD_DATE = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
}

function words(s: string): number {
  const m = s.match(/\S+/g)
  return m ? m.length : 0
}

function cap(locs: Loc[]): Loc[] {
  return locs.length > MAX_LOCATIONS ? locs.slice(0, MAX_LOCATIONS) : locs
}

function plural(n: number, w: string): string {
  return `${n} ${w}${n === 1 ? '' : 's'}`
}

function canonTerm(t: string): string {
  const l = t.toLowerCase().trim()
  return Object.prototype.hasOwnProperty.call(ALIASES, l) ? ALIASES[l] : l
}

function firstTokenRange(b: Bullet): { word: string; to: number } {
  const m = b.body.match(/^\S+/)
  const word = m ? m[0] : ''
  return { word, to: Math.min(b.to, b.from + word.length) }
}

function evalOne(text: string, c: Criterion, s: Scan, opts: { pages?: number; now?: Date }): { pass: boolean; detail: string; locations: Loc[] } {
  const p = c.params
  switch (c.kind) {
    case 'max-bullets-per-role': {
      const max = Number(p.max)
      const over = s.roles.filter(r => r.bullets > max)
      return over.length
        ? { pass: false, detail: `${plural(over.length, 'role')} with more than ${max} bullets (most: ${Math.max(...over.map(r => r.bullets))}).`, locations: cap(over.map(r => ({ from: r.from, to: r.to }))) }
        : { pass: true, detail: `Every role has ${max} bullets or fewer.`, locations: [] }
    }
    case 'min-bullets-per-role': {
      const min = Number(p.min)
      const under = s.roles.filter(r => r.bullets < min)
      return under.length
        ? { pass: false, detail: `${plural(under.length, 'role')} with fewer than ${min} bullets.`, locations: cap(under.map(r => ({ from: r.from, to: r.to }))) }
        : { pass: true, detail: `Every role has at least ${min} bullets.`, locations: [] }
    }
    case 'max-bullet-length': {
      const max = Number(p.max)
      const bad = s.bullets.filter(b => b.body.length > max)
      return bad.length
        ? { pass: false, detail: `${plural(bad.length, 'bullet')} longer than ${max} characters (longest: ${Math.max(...bad.map(b => b.body.length))}).`, locations: cap(bad.map(b => ({ from: b.from, to: b.to }))) }
        : { pass: true, detail: `All bullets are ${max} characters or shorter.`, locations: [] }
    }
    case 'max-words-per-bullet': {
      const max = Number(p.max)
      const bad = s.bullets.filter(b => words(b.body) > max)
      return bad.length
        ? { pass: false, detail: `${plural(bad.length, 'bullet')} with more than ${max} words.`, locations: cap(bad.map(b => ({ from: b.from, to: b.to }))) }
        : { pass: true, detail: `All bullets have ${max} words or fewer.`, locations: [] }
    }
    case 'min-words-per-bullet': {
      const min = Number(p.min)
      const bad = s.bullets.filter(b => words(b.body) < min)
      return bad.length
        ? { pass: false, detail: `${plural(bad.length, 'bullet')} with fewer than ${min} words.`, locations: cap(bad.map(b => ({ from: b.from, to: b.to }))) }
        : { pass: true, detail: `All bullets have at least ${min} words.`, locations: [] }
    }
    case 'bullets-with-numbers': {
      const need = Number(p.percent)
      const exp = s.bullets.filter(b => b.section === 'experience')
      if (!exp.length) return { pass: true, detail: 'No experience bullets to check.', locations: [] }
      const without = exp.filter(b => !/\d/.test(b.body))
      const have = exp.length - without.length
      const pct = Math.round((have / exp.length) * 1000) / 10
      // compare exact fractions so 1 of 3 meets "33.33%"
      return have * 100 + 1e-9 >= need * exp.length
        ? { pass: true, detail: `${pct}% of experience bullets contain a number (need ${need}%).`, locations: [] }
        : { pass: false, detail: `${pct}% of experience bullets contain a number, need ${need}%.`, locations: cap(without.map(b => ({ from: b.from, to: b.to }))) }
    }
    case 'must-include': {
      const terms = (p.terms as string[]) || []
      const missing = terms.filter(t => !containsTerm(text, canonTerm(t)))
      return missing.length
        ? { pass: false, detail: `Missing: ${missing.join(', ')}.`, locations: [] }
        : { pass: true, detail: `All ${plural(terms.length, 'term')} found.`, locations: [] }
    }
    case 'must-not-include': {
      const terms = (p.terms as string[]) || []
      const locs: Loc[] = []
      const found: string[] = []
      for (const t of terms) {
        const body = t.trim().split(/\s+/).map(escapeRe).join('\\s+')
        const re = new RegExp(`(?<![A-Za-z0-9])${body}(?![A-Za-z0-9])`, 'gi')
        let hit = false
        for (const m of Array.from(text.matchAll(re))) {
          if (!m[0]) continue
          hit = true
          if (locs.length < MAX_LOCATIONS) locs.push({ from: m.index ?? 0, to: (m.index ?? 0) + m[0].length })
        }
        if (hit) found.push(t)
      }
      locs.sort((a, b) => a.from - b.from)
      return found.length
        ? { pass: false, detail: `Found: ${found.join(', ')}.`, locations: locs }
        : { pass: true, detail: 'None of the banned terms appear.', locations: [] }
    }
    case 'start-with-verb': {
      const bad: Bullet[] = []
      let weak = 0
      for (const b of s.bullets) {
        const v = verbCheck(b.body.match(/^\S+/)?.[0] ?? '')
        if (v === 'ok') continue
        if (v === 'weak') weak++
        bad.push(b)
      }
      const note = weak ? ` (${weak} with a weak opener such as "Worked" or "Responsible")` : ''
      return bad.length
        ? { pass: false, detail: `${plural(bad.length, 'bullet')} do not start with an action verb${note}.`, locations: cap(bad.map(b => { const f = firstTokenRange(b); return { from: b.from, to: f.to } })) }
        : { pass: true, detail: 'Every bullet starts with an action verb.', locations: [] }
    }
    case 'no-first-person': {
      // only bullet, summary and prose text is checked, never role headers, contact lines or skills
      const locs: Loc[] = []
      for (const sp of s.bodySpans) {
        for (const l of firstPersonIn(text.slice(sp.from, sp.to))) {
          if (locs.length < MAX_LOCATIONS) locs.push({ from: sp.from + l.from, to: sp.from + l.to })
        }
      }
      locs.sort((x, y) => x.from - y.from)
      return locs.length
        ? { pass: false, detail: `${plural(locs.length, 'first-person word')} found.`, locations: locs }
        : { pass: true, detail: 'No first-person pronouns.', locations: [] }
    }
    case 'max-pages': {
      const max = Number(p.max)
      const pages = typeof opts.pages === 'number' && isFinite(opts.pages) && opts.pages >= 0 ? opts.pages : Math.max(s.nonblank ? 1 : 0, Math.ceil(s.nonblank / LINES_PER_PAGE))
      const measured = typeof opts.pages === 'number' && isFinite(opts.pages) && opts.pages >= 0
      const label = measured ? 'measured' : `estimated from ${s.nonblank} lines`
      return pages <= max
        ? { pass: true, detail: `${pages} ${pages === 1 ? 'page' : 'pages'} (${label}), limit ${max}.`, locations: [] }
        : { pass: false, detail: `${pages} pages (${label}), limit ${max}.`, locations: [] }
    }
    case 'max-summary-words': {
      const max = Number(p.max)
      const n = s.summary.reduce((a, x) => a + words(x.text), 0)
      return n > max
        ? { pass: false, detail: `Summary has ${n} words, limit ${max}.`, locations: [{ from: s.summary[0].from, to: s.summary[s.summary.length - 1].to }] }
        : { pass: true, detail: `Summary has ${n} words, limit ${max}.`, locations: [] }
    }
    case 'date-format': {
      const locs: Loc[] = []
      const bad: string[] = []
      for (const h of s.headerLinesBySection) {
        if (h.section !== 'experience' && h.section !== 'education') continue
        const line = h.line
        for (const m of Array.from(line.text.matchAll(MONTH_TOKEN))) {
          if (GOOD_DATE.test(m[0])) continue
          if (locs.length < MAX_LOCATIONS) locs.push({ from: line.start + (m.index ?? 0), to: line.start + (m.index ?? 0) + m[0].length })
          bad.push(m[0])
        }
      }
      return bad.length
        ? { pass: false, detail: `${plural(bad.length, 'date')} not in Mon YYYY form: ${bad.slice(0, 3).join('; ')}${bad.length > 3 ? '...' : ''}.`, locations: locs }
        : { pass: true, detail: 'All dates use Mon YYYY.', locations: [] }
    }
    case 'require-sections': {
      const need = (p.sections as string[]) || []
      const missing = need.filter(n => !s.sections.has(n))
      return missing.length
        ? { pass: false, detail: `Missing sections: ${missing.join(', ')}.`, locations: [] }
        : { pass: true, detail: 'All required sections present.', locations: [] }
    }
    case 'no-lint-errors':
    case 'no-lint-warnings': {
      const errorsOnly = c.kind === 'no-lint-errors'
      const probs = lintResume(text, opts.now ?? new Date()).filter(x => (errorsOnly ? x.severity === 'error' : x.severity === 'warning' || x.severity === 'error'))
      return probs.length
        ? { pass: false, detail: `${plural(probs.length, errorsOnly ? 'lint error' : 'lint warning')}: ${probs[0].message}`, locations: cap(probs.map(x => ({ from: x.from, to: x.to }))) }
        : { pass: true, detail: errorsOnly ? 'No lint errors.' : 'No lint warnings or errors.', locations: [] }
    }
    default:
      return { pass: false, detail: `Unknown criterion kind "${c.kind}".`, locations: [] }
  }
}

// Note: the lint criteria call lintResume, which uses the clock for future-date checks. Without opts.now the
// result can change over time; pass opts.now for reproducible reports.
export function evaluateCriteria(resumeText: string, criteria: Criterion[], opts: { pages?: number; now?: Date } = {}): CriteriaReport {
  const text = typeof resumeText === 'string' ? resumeText : ''
  let s: Scan | null = null
  try { s = scan(text) } catch { s = null }
  const results: CriterionResult[] = []
  for (const c of Array.isArray(criteria) ? criteria : []) {
    let r: { pass: boolean; detail: string; locations: Loc[] }
    try {
      if (!s) throw new Error('scan failed')
      r = evalOne(text, c, s, opts || {})
      r.locations = r.locations.filter(l => Number.isInteger(l.from) && Number.isInteger(l.to) && l.from >= 0 && l.to <= text.length && l.from <= l.to)
    } catch {
      r = { pass: false, detail: 'Could not evaluate this criterion.', locations: [] }
    }
    results.push({ criterion: c, pass: r.pass, detail: r.detail, locations: r.locations })
  }
  const passed = results.filter(r => r.pass).length
  const total = results.length
  return { results, score: total ? (passed < total ? Math.min(99, Math.round((passed / total) * 100)) : 100) : 100, passed, failed: total - passed, total }
}

export function compareReports(before: CriteriaReport, after: CriteriaReport): { regressed: string[]; fixed: string[]; scoreDelta: number } {
  const was = new Map(before.results.map(r => [r.criterion.id, r.pass]))
  const regressed: string[] = []
  const fixed: string[] = []
  for (const r of after.results) {
    const b = was.get(r.criterion.id)
    if (b === undefined) continue
    if (b && !r.pass) regressed.push(r.criterion.id)
    if (!b && r.pass) fixed.push(r.criterion.id)
  }
  return { regressed, fixed, scoreDelta: after.score - before.score }
}
