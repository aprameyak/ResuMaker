import { TECH_TERMS, INDUSTRY_TERMS, DISPLAY } from '../dictionary'
import { containsTerm } from '../keywords'
import { BULLET } from '../parse'
import { OUT_OF_SCOPE } from './prompt'

export interface Violation { rule: string; message: string }
export interface GuardResult { ok: boolean; violations: Violation[] }

export interface GuardOptions {
  kind?: 'bullet' | 'text'
  maxGrowth?: number
  mustShrink?: boolean
  /** Extra text whose numbers and names may appear (facts the user typed in their own prompt). */
  allow?: string
  /** 'strict': same line count, headings/role lines untouched, bullet markers kept. */
  structure?: 'strict' | 'free'
}

const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 }
const NUMBER_RE = new RegExp('(?<![A-Za-z0-9_.])([$€£]?)(\\d[\\d,]*(?:\\.\\d+)?)(?:\\s?(%|percent|thousand|million|billion|k|m|b|x)(?![A-Za-z]))?', 'gi')
const NUMBER_WORDS = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'fifteen', 'twenty', 'thirty', 'forty', 'fifty', 'hundred', 'thousand', 'million', 'billion', 'dozen', 'dozens', 'double', 'doubled', 'doubling', 'triple', 'tripled', 'tripling', 'halved', 'halving', 'quadrupled', 'half', 'tenfold', 'twofold']
const AMBIGUOUS_TERMS = new Set(['rest', 'spring', 'express', 'swift', 'go', 'r', 'c', 'rails', 'spark', 'rust', 'ruby', 'scala', 'bash', 'jest', 'sass', 'vite', 'git', 'enterprise', 'retail', 'insurance', 'banking', 'gaming', 'startup', 'logistics', 'pci', 'java'])
const STOPWORDS = new Set('a an the and or of to in on for with by from at as is was were be been it its this that these those their our your into over under across per via using use used while than then also so but not no more most less new all each any both own other such'.split(' '))
const COMMON_CAPS = new Set(['i', 'a'])

interface Num { value: number; pct: boolean; cur: boolean; raw: string }

function extractNumbers(s: string): Num[] {
  const out: Num[] = []
  NUMBER_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = NUMBER_RE.exec(s))) {
    const core = m[2].replace(/,+$/, '').replace(/,/g, '')
    let value = Number(core)
    if (!isFinite(value)) continue
    const unit = (m[3] || '').toLowerCase()
    const pct = unit === '%' || unit === 'percent'
    if (SCALE[unit]) value *= SCALE[unit]
    out.push({ value: Math.round(value * 1e6) / 1e6, pct, cur: m[1] !== '', raw: m[0].trim() })
  }
  return out
}

function numKey(n: Num): string { return `${n.value}${n.pct ? '%' : ''}` }

function numberWordSet(s: string): Set<string> {
  const set = new Set<string>()
  const lower = s.toLowerCase()
  NUMBER_WORDS.forEach(w => { if (new RegExp(`\\b${w}\\b`).test(lower)) set.add(w) })
  return set
}

function techTerms(s: string): Set<string> {
  const set = new Set<string>()
  const all = Array.from(new Set([...TECH_TERMS, ...INDUSTRY_TERMS]))
  all.forEach(term => {
    if (!containsTerm(s, term)) return
    if (AMBIGUOUS_TERMS.has(term)) {
      const shown = DISPLAY[term] || term
      const esc = shown.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
      const re = term === 'rest' ? /\bREST(ful)?\b/ : term === 'go' ? /\bGo(lang)?\b/ : new RegExp(`(?:^|[^A-Za-z0-9])${esc}(?![A-Za-z0-9])`)
      if (!re.test(s)) return
      // a capitalized sentence opener like "Spring" or "Express" is not evidence of a technology
      if (['spring', 'express', 'swift', 'rest'].indexOf(term) >= 0 && new RegExp(`^\\s*(?:[-*\\u2022]\\s*)?${esc}\\b`).test(s) && !/\b(Boot|MVC|framework|\.js)\b/.test(s)) return
    }
    set.add(term)
  })
  return set
}

function stripPossessive(w: string): string { return w.replace(/['’]s$/i, '') }

/** Capitalized or technical-looking tokens that are not just the first word of a line/sentence. */
function entityTokens(s: string): Set<string> {
  const set = new Set<string>()
  s.split('\n').forEach(line => {
    const body = line.replace(BULLET, '')
    const re = /[A-Za-z0-9][A-Za-z0-9.+#/&'’-]*/g
    let m: RegExpExecArray | null
    while ((m = re.exec(body))) {
      let tok = stripPossessive(m[0]).replace(/[.'’/-]+$/, '')
      if (!tok) continue
      const before = body.slice(0, m.index).trimEnd()
      const atStart = before === '' || /[.!?:;]$/.test(before)
      const lower = tok.toLowerCase()
      if (STOPWORDS.has(lower) || COMMON_CAPS.has(lower)) continue
      const capital = /^[A-Z]/.test(tok)
      const internal = /[a-z][A-Z]|[A-Za-z]\d|\d[A-Za-z]|[A-Za-z]\.[A-Za-z]|^[A-Z]{2,}$|[A-Za-z][+#]/.test(tok)
      if (/^[$\u20ac\u00a3]?\d/.test(tok)) continue
      if (internal && !(atStart && /^[A-Z][a-z]+$/.test(tok))) set.add(lower)
      else if (capital && !atStart) set.add(lower)
    }
  })
  return set
}

function contentWords(s: string): Set<string> {
  const set = new Set<string>()
  s.toLowerCase().split(/[^a-z0-9]+/).forEach(w => {
    if (w.length >= 4 && !STOPWORDS.has(w)) set.add(w.slice(0, 5))
  })
  return set
}

const PREAMBLE = /^\s*(here(?:'s| is| are)|sure|certainly|of course|okay|ok[,.! ]|absolutely|i(?:'ve| have| rewrote| revised| updated)|rewritten|revised|updated version|below is|as requested|great|no problem|happy to|let me|this (?:version|rewrite|bullet))/i
const TRAILING_CHATTER = /\n\s*(let me know|hope this|feel free|i can also|note:|notes?:|explanation:|changes made:|why:)/i
const FIRST_PERSON = /\b(I|I'm|I've|I'd|I'll|me|my|mine|myself|we|our|ours|us)\b/

function countFirstPerson(s: string): number {
  // "US" (the country) is not first person: only lowercase "us" counts
  const re = new RegExp(FIRST_PERSON.source.replace('|us)', ')') + '|\\bus\\b', 'g')
  return (s.match(re) || []).length
}

function norm(s: string): string { return s.replace(/\s+/g, ' ').trim() }

function wordCount(s: string): number { return norm(s).split(' ').filter(Boolean).length }

export function verifyRewrite(original: string, candidate: string, opts: GuardOptions = {}): GuardResult {
  const violations: Violation[] = []
  const add = (rule: string, message: string) => { if (!violations.some(v => v.rule === rule && v.message === message)) violations.push({ rule, message }) }
  const orig = typeof original === 'string' ? original : ''
  const cand = typeof candidate === 'string' ? candidate : ''
  const kind = opts.kind || 'text'
  const maxGrowth = opts.maxGrowth && opts.maxGrowth > 0 ? opts.maxGrowth : 1.5
  const allow = opts.allow || ''

  const trimmed = cand.trim()
  if (!trimmed) { add('empty', 'The output was empty. Return the rewritten text.'); return { ok: false, violations } }
  if (trimmed === OUT_OF_SCOPE || /^OUT_OF_SCOPE\b/.test(trimmed)) { add('out-of-scope', 'The output was OUT_OF_SCOPE, which is not a rewrite.'); return { ok: false, violations } }
  if (norm(trimmed) === norm(orig)) add('identical', 'The output is identical to the original. Change it or the edit is pointless.')

  // format
  if (PREAMBLE.test(trimmed)) add('preamble', 'Remove the preamble or commentary. Return only the replacement text.')
  if (TRAILING_CHATTER.test(trimmed)) add('commentary', 'Remove trailing commentary. Return only the replacement text.')
  if (/```|\*\*|__[^_]+__|^\s{0,3}#{1,6}\s/m.test(trimmed) || (!/`/.test(orig) && /`/.test(trimmed))) add('markdown', 'Remove markdown formatting (code fences, backticks, bold, headings).')
  const wrapped = /^["'“‘].*["'”’]$/.test(trimmed.replace(/\n/g, ' ')) && !/^["'“‘]/.test(orig.trim())
  if (wrapped) add('quotes', 'Remove the quotation marks around the output.')
  if (kind === 'bullet') {
    if (/\n/.test(trimmed)) add('multi-line', 'A bullet must be exactly one line. Remove line breaks.')
    if (BULLET.test(trimmed)) add('bullet-marker', 'Do not include the bullet marker. Return only the bullet text.')
    const op = /[.!?]$/.test(orig.trim())
    const cp = /[.!?]$/.test(trimmed)
    if (op !== cp) add('trailing-period', op ? 'The original ends with a period; keep that consistent.' : 'The original has no trailing period; do not add one.')
  }

  // first person
  const fpCand = countFirstPerson(trimmed)
  const fpOrig = countFirstPerson(orig)
  if (kind === 'bullet' ? fpCand > 0 : fpCand > fpOrig) add('first-person', 'Remove first-person words (I, my, we, our).')

  // numbers: all original numbers survive, no new ones
  const allowNums = new Set(extractNumbers(allow).map(numKey))
  const origNums = extractNumbers(orig)
  const candNums = extractNumbers(trimmed)
  const candKeys = new Set(candNums.map(numKey))
  const origKeys = new Set(origNums.map(numKey))
  origNums.forEach(n => {
    if (!candKeys.has(numKey(n))) add('lost-number', `The number "${n.raw}" from the original is missing. Every number must be kept exactly.`)
  })
  candNums.forEach(n => {
    if (origKeys.has(numKey(n)) || allowNums.has(numKey(n))) return
    const year = !n.pct && !n.cur && Number.isInteger(n.value) && n.value >= 1950 && n.value <= 2100 && !/[,]/.test(n.raw)
    if (year) add('new-year', `The year "${n.raw}" is not in the original. Do not add dates.`)
    else add('new-number', `The number "${n.raw}" is not in the original. Do not invent figures.`)
  })
  const origWords = numberWordSet(orig + ' ' + allow)
  numberWordSet(trimmed).forEach(w => { if (!origWords.has(w)) add('new-number', `The quantity word "${w}" is not in the original. Do not invent counts or multipliers.`) })

  // technologies and named things
  const origTech = techTerms(orig + '\n' + allow)
  const candTech = techTerms(trimmed)
  candTech.forEach(t => { if (!origTech.has(t)) add('new-technology', `"${DISPLAY[t] || t}" is not in the original. Do not add tools, skills or industries.`) })
  if (!opts.mustShrink) {
    const origOnly = techTerms(orig)
    origOnly.forEach(t => { if (!candTech.has(t)) add('lost-technology', `"${DISPLAY[t] || t}" from the original is missing. Keep every named tool.`) })
  }
  const origEnt = entityTokens(orig + '\n' + allow)
  const origLower = (orig + ' ' + allow).toLowerCase()
  entityTokens(trimmed).forEach(e => {
    if (origEnt.has(e) || origLower.indexOf(e) >= 0) return
    if (candTech.size && Array.from(candTech).some(t => (DISPLAY[t] || t).toLowerCase() === e)) return // already reported as technology
    add('new-name', `"${e}" is not in the original. Do not add names, employers, tools or acronyms.`)
  })

  // size
  const o = norm(orig).length
  const c = norm(trimmed).length
  if (o > 0) {
    const limit = Math.max(o * maxGrowth, o + 24)
    if (c > limit) add('too-long', `The output is ${c} characters against ${o} in the original. Stay within ${Math.round(maxGrowth * 100)}% of the original.`)
    if (opts.mustShrink && c >= o) add('not-shorter', `The output must be shorter than the original (${o} characters) but is ${c}.`)
    if (!opts.mustShrink && o >= 40 && c < o * 0.3) add('too-short', 'The output drops most of the original. Keep the facts.')
  }

  // drift: a rewrite shares its substance with the original
  const ow = contentWords(orig)
  const cw = contentWords(trimmed)
  if (ow.size >= 4 && cw.size >= 3) {
    let shared = 0
    cw.forEach(w => { if (ow.has(w)) shared++ })
    if (shared / Math.min(ow.size, cw.size) < 0.34) add('off-topic', 'The output does not stay close to the original text. Rewrite the same content, do not replace it.')
  }

  // structure for multi-line targets
  if (opts.structure === 'strict') {
    const ol = orig.split('\n')
    const cl = trimmed.split('\n')
    if (ol.filter(l => l.trim()).length !== cl.filter(l => l.trim()).length || ol.length !== cl.length) {
      add('line-count', `The target has ${ol.length} lines; the output has ${cl.length}. Keep the same number of lines.`)
    } else {
      ol.forEach((line, i) => {
        const a = line.replace(/\s+$/, '')
        const b = cl[i].replace(/\s+$/, '')
        const am = a.match(BULLET)
        const bm = b.match(BULLET)
        if (am) {
          if (!bm || norm(am[0]) !== norm(bm[0])) add('bullet-marker', `Line ${i + 1} must keep its bullet marker "${norm(am[0])}".`)
        } else if (a !== b && a.trim()) {
          add('structure', `Line ${i + 1} ("${a.trim().slice(0, 40)}") is a heading or role line and must not change.`)
        }
        if (bm && !am) add('bullet-marker', `Line ${i + 1} gained a bullet marker.`)
      })
    }
  }

  return { ok: violations.length === 0, violations }
}

export { wordCount }
