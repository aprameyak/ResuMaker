import { TECH_TERMS, INDUSTRY_TERMS, DISPLAY } from '../dictionary'
import { containsTerm } from '../keywords'
import { BULLET, DATE_RANGE } from '../parse'
import { OUT_OF_SCOPE } from './prompt'

export interface Violation { rule: string; message: string }
export interface GuardResult {
  ok: boolean
  violations: Violation[]
  /** Non-blocking notes (for example tools dropped while shortening). */
  warnings?: string[]
}

export interface GuardOptions {
  kind?: 'bullet' | 'text'
  maxGrowth?: number
  mustShrink?: boolean
  /** Extra text whose numbers and names may appear (facts the user typed in their own prompt). */
  allow?: string
  /** 'strict': same line count, headings/role lines untouched, bullet markers kept. */
  structure?: 'strict' | 'free'
  /** Hard limits the user asked for ("shorten to 5 words"). */
  maxWords?: number
  maxChars?: number
  maxLines?: number
  /** Identical output is a legitimate answer ("already fine"), not a violation. */
  allowUnchanged?: boolean
}

// ---------------------------------------------------------------- text helpers

const ARABIC_DIGITS = /[٠-٩۰-۹०-९]/g

/** NFKC-normalise (full-width, math digits) and fold Arabic-Indic / Devanagari digits to ASCII. */
export function foldText(s: string): string {
  let out = s
  try { out = out.normalize('NFKC') } catch { /* very old engines */ }
  return out.replace(ARABIC_DIGITS, ch => {
    const c = ch.charCodeAt(0)
    const base = c >= 0x06f0 ? 0x06f0 : c >= 0x0966 ? 0x0966 : 0x0660
    return String.fromCharCode(48 + (c - base))
  })
}

function norm(s: string): string { return s.replace(/\s+/g, ' ').trim() }
export function wordCount(s: string): number { return norm(s).split(' ').filter(Boolean).length }

// ---------------------------------------------------------------- quantities

const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 }
const NUMBER_RE = new RegExp('(?<![A-Za-z0-9_.])([$€£]?)(\\d[\\d,]*(?:\\.\\d+)?)(?:\\s?(%|percent|thousand|million|billion|k|m|b|x)(?![A-Za-z]))?', 'gi')
const WORD_VALUES: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, million: 1e6, billion: 1e9,
  third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
}
const VAGUE_QUANTITY = ['handful', 'several', 'hundreds', 'thousands', 'millions', 'billions', 'tens', 'dozen', 'dozens', 'multiple', 'numerous', 'countless', 'myriad', 'various', 'many', 'couple', 'double', 'doubled', 'doubling', 'triple', 'tripled', 'tripling', 'quadrupled', 'halved', 'halving', 'half', 'quarter', 'quarterly', 'threefold', 'twofold', 'fourfold', 'tenfold', 'manyfold', 'scores', 'plenty']

interface Quantities { keys: Set<string>; raw: Map<string, string>; vague: Set<string> }

function quantities(text: string): Quantities {
  const s = foldText(text)
  const keys = new Set<string>()
  const raw = new Map<string, string>()
  const add = (k: string, r: string) => { keys.add(k); if (!raw.has(k)) raw.set(k, r) }
  NUMBER_RE.lastIndex = 0
  let m: RegExpExecArray | null
  let rest = s
  while ((m = NUMBER_RE.exec(s))) {
    const core = m[2].replace(/,+$/, '').replace(/,/g, '')
    let value = Number(core)
    if (!isFinite(value)) continue
    const unit = (m[3] || '').toLowerCase()
    const pct = unit === '%' || unit === 'percent'
    if (SCALE[unit]) value *= SCALE[unit]
    value = Math.round(value * 1e6) / 1e6
    add(`${value}${pct ? '%' : ''}`, m[0].trim())
    rest = rest.replace(m[0], ' ')
  }
  const lower = rest.toLowerCase()
  const re = /[a-z]+/g
  while ((m = re.exec(lower))) {
    const w = m[0]
    if (WORD_VALUES[w] !== undefined) add(String(WORD_VALUES[w]), w)
  }
  const vague = new Set<string>()
  VAGUE_QUANTITY.forEach(w => { if (new RegExp(`\\b${w}\\b`).test(lower)) vague.add(w) })
  return { keys, raw, vague }
}

// ---------------------------------------------------------------- vocabulary

const STOPWORDS = new Set('a an the and or of to in on for with by from at as is was were be been it its this that these those their our your into over under across per via using use used while than then also so but not no more most less new all each any both own other such who whom which what when where how'.split(' '))
const PRODUCTS = ['google', 'amazon', 'microsoft', 'apple', 'meta', 'facebook', 'netflix', 'uber', 'airbnb', 'oracle', 'ibm', 'intel', 'nvidia', 'tesla', 'stripe', 'shopify', 'salesforce', 'sap', 'epic', 'cerner', 'quickbooks', 'workday', 'hubspot', 'looker', 'photoshop', 'illustrator', 'slack', 'notion', 'asana', 'trello', 'zendesk', 'tableau', 'datadog', 'splunk', 'okta', 'twilio', 'github', 'gitlab', 'bitbucket', 'confluence', 'servicenow', 'netsuite', 'sharepoint', 'powerpoint', 'outlook', 'excel', 'oracle', 'linkedin', 'ai', 'ml', 'llm', 'gpt', 'chatgpt', 'openai', 'copilot', 'mckinsey', 'deloitte', 'accenture']
const TITLES = ['lead', 'manager', 'director', 'head', 'chief', 'principal', 'owner', 'founder', 'cofounder', 'vp', 'president', 'supervisor', 'captain', 'officer', 'ceo', 'cto', 'cfo', 'coo', 'executive', 'senior', 'staff', 'mentor', 'consultant']
const SCOPE_WORDS = ['global', 'worldwide', 'entire', 'whole', 'companywide', 'company-wide', 'organization-wide', 'organisation-wide', 'enterprise-wide', 'department', 'nationwide', 'international', 'c-suite', 'executive', 'firmwide', 'firm-wide']
const OUTCOME_WORDS = ['significant', 'significantly', 'substantial', 'substantially', 'dramatic', 'dramatically', 'massive', 'massively', 'savings', 'award', 'awarded', 'awards', 'recognized', 'recognised', 'recognition', 'certified', 'certification', 'record', 'ranked', 'ranking', 'eliminated', 'eliminating', 'eliminate', 'resulting', 'resulted', 'flawless', 'prestigious', 'exceptional', 'outstanding', 'unprecedented', 'world-class', 'bestselling', 'top-performing', 'promoted']
const OUTCOME_PHRASES = /\bsav(?:ing|ed|es) (?:the |their |our )?(?:company|business|organi[sz]ation|team|firm|client)\b|\bfirst place\b|\branked (?:first|#?1)\b/i
const LEAD_CLASS = /\b(?:led|lead(?:s|ing)?|manag(?:e|ed|es|ing|er)|own(?:ed|ing|er|ership)|spearhead(?:ed|ing)?|drove|driv(?:e|es|en|ing)|direct(?:ed|ing|or)|head(?:ed|ing)?|found(?:ed|er|ing)|oversaw|oversee(?:s|ing)?|supervis(?:e|ed|es|ing|or)|orchestrat(?:e|ed|ing)|pioneer(?:ed|ing)?|champion(?:ed|ing)?|captain(?:ed)?|chair(?:ed)?|administer(?:ed)?|ran)\b/gi
const NEGATORS = ['not', 'no', 'never', 'without', 'failed', 'unable', 'cannot', "didn't", "wasn't", "couldn't", "don't", "doesn't", 'neither', 'nor', 'lack', 'lacked', 'lacking']
const UP = ['increase', 'increased', 'increasing', 'grow', 'grew', 'grown', 'growing', 'raise', 'raised', 'raising', 'expand', 'expanded', 'inflate', 'inflated', 'rise', 'rose']
const DOWN = ['reduce', 'reduced', 'reducing', 'cut', 'decrease', 'decreased', 'decreasing', 'lower', 'lowered', 'lowering', 'shrink', 'shrank', 'drop', 'dropped', 'decline', 'declined', 'slash', 'slashed', 'minimize', 'minimized', 'reduction']
const IRREGULAR_VERBS = new Set(['led', 'built', 'ran', 'cut', 'wrote', 'made', 'drove', 'grew', 'won', 'took', 'set', 'got', 'taught', 'sold', 'spoke', 'held', 'kept', 'brought', 'began', 'chose', 'found', 'gave', 'put', 'read', 'sent', 'oversaw', 'shipped', 'spun', 'cut', 'hired', 'trained', 'saw', 'met', 'paid', 'drew', 'dealt', 'fixed'])
const AMBIGUOUS_TERMS = new Set(['rest', 'spring', 'express', 'swift', 'go', 'r', 'c', 'rails', 'spark', 'rust', 'ruby', 'scala', 'bash', 'jest', 'sass', 'vite', 'git', 'enterprise', 'retail', 'insurance', 'banking', 'gaming', 'startup', 'logistics', 'pci', 'java'])
const BUSINESS_EXTRA = ['agile', 'scrum', 'kanban', 'roadmap', 'stakeholder management', 'cross-functional', 'budgeting', 'forecasting', 'compliance', 'project management', 'product management', 'strategic planning', 'client relations']

function stem(w: string): string {
  let s = w.toLowerCase().replace(/['’]s$/, '')
  if (s.length > 5) s = s.replace(/(ations?|ation|ments?|ings?|ing|edly|ed|ers?|ies|es|ly|s)$/, '')
  else if (s.length > 3) s = s.replace(/(ed|es|s)$/, '')
  return s
}
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  const sa = stem(a), sb = stem(b)
  if (sa === sb) return true
  if (sa.length >= 5 && sb.length >= 5 && sa.slice(0, 5) === sb.slice(0, 5)) return true
  return false
}

interface Tok { raw: string; lower: string; index: number; capital: boolean; internal: boolean; first: boolean }

function tokens(line: string): Tok[] {
  const body = foldText(line).replace(BULLET, '')
  const out: Tok[] = []
  const re = /[A-Za-z0-9][A-Za-z0-9.+#/&'’-]*/g
  let m: RegExpExecArray | null
  let n = 0
  while ((m = re.exec(body))) {
    const raw = m[0].replace(/['’]s$/i, '').replace(/[.'’/&+-]+$/, '')
    if (!raw) continue
    out.push({
      raw, lower: raw.toLowerCase(), index: m.index, first: n === 0 && true,
      capital: /^[A-Z]/.test(raw),
      internal: /[a-z][A-Z]|[A-Za-z]\d|\d[A-Za-z]|[A-Za-z]\.[A-Za-z]|^[A-Z]{2,}$|[A-Za-z][+#]/.test(raw),
    })
    n++
  }
  return out
}

function isPlainVerb(lower: string): boolean {
  return IRREGULAR_VERBS.has(lower) || /^[a-z]{3,}(ed|ing)$/.test(lower)
}

function termSet(s: string): Set<string> {
  const set = new Set<string>()
  const all = Array.from(new Set([...TECH_TERMS, ...INDUSTRY_TERMS, ...BUSINESS_EXTRA]))
  all.forEach(term => {
    if (term === 'rest') { if (/\bREST(?:ful)?\b/.test(s)) set.add(term); return }
    if (!containsTerm(s, term)) return
    if (AMBIGUOUS_TERMS.has(term)) {
      const shown = DISPLAY[term] || term
      const esc = shown.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
      const re = term === 'go' ? /\bGo(?:lang)?\b/ : new RegExp(`(?:^|[^A-Za-z0-9])${esc}(?![A-Za-z0-9])`)
      if (!re.test(s)) return
      if (['spring', 'express', 'swift'].indexOf(term) >= 0 && new RegExp(`^\\s*(?:[-*\\u2022]\\s*)?${esc}\\b`).test(s) && !/\b(Boot|MVC|framework|\.js)\b/.test(s)) return
    }
    set.add(term)
  })
  return set
}

// ---------------------------------------------------------------- per-fragment fact checks

function factChecks(orig: string, cand: string, opts: GuardOptions, add: (rule: string, msg: string) => void, warn: (msg: string) => void, prefix: string): void {
  const allow = opts.allow ? sanitizeAllow(opts.allow) : ''
  const oq = quantities(orig)
  const cq = quantities(cand)
  const aq = quantities(allow)
  oq.keys.forEach(k => { if (!cq.keys.has(k)) add('lost-number', `${prefix}The number "${oq.raw.get(k)}" from the original is missing. Every number must be kept exactly and stay on its own line.`) })
  cq.keys.forEach(k => {
    if (oq.keys.has(k) || aq.keys.has(k)) return
    const r = cq.raw.get(k) || k
    const year = /^\d{4}$/.test(r) && Number(r) >= 1950 && Number(r) <= 2100
    if (year) add('new-year', `${prefix}The year "${r}" is not in the original. Do not add dates.`)
    else add('new-number', `${prefix}The number "${r}" is not in the original. Do not invent figures or counts.`)
  })
  cq.vague.forEach(w => { if (!oq.vague.has(w) && !aq.vague.has(w)) add('new-number', `${prefix}The quantity word "${w}" is not in the original. Do not invent counts, multipliers or amounts.`) })

  const lo = foldText(orig).toLowerCase()
  const lc = foldText(cand).toLowerCase()
  const la = foldText(allow).toLowerCase()
  const origToks = tokens(orig + ' ' + allow)
  const candToks = tokens(cand)
  const known = (w: string) => origToks.some(t => sameWord(t.lower, w))
  const wordIn = (hay: string, w: string) => new RegExp(`(?:^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`).test(hay)

  // technologies and industries
  const oTech = termSet(orig + '\n' + allow)
  const cTech = termSet(cand)
  cTech.forEach(t => { if (!oTech.has(t)) add('new-technology', `${prefix}"${DISPLAY[t] || t}" is not in the original. Do not add tools, skills, methods or industries.`) })
  const dropped: string[] = []
  termSet(orig).forEach(t => { if (!cTech.has(t)) dropped.push(DISPLAY[t] || t) })
  if (dropped.length) {
    if (opts.mustShrink) warn(`Dropped while shortening: ${dropped.join(', ')}.`)
    else dropped.forEach(d => add('lost-technology', `${prefix}"${d}" from the original is missing. Keep every named tool.`))
  }
  const techLower = new Set<string>()
  oTech.forEach(t => techLower.add((DISPLAY[t] || t).toLowerCase()))
  cTech.forEach(t => techLower.add((DISPLAY[t] || t).toLowerCase()))

  // names: novel capitalised or technical tokens, and known product names in any case
  candToks.forEach((t, i) => {
    if (STOPWORDS.has(t.lower) || /^[$€£]?\d/.test(t.raw)) return
    const parts = t.lower.split(/[-/]/).filter(Boolean)
    parts.forEach((p, pi) => {
      if (STOPWORDS.has(p) || known(p) || techLower.has(p)) return
      if (p.length > 4 && Array.from(techLower).some(tl => tl.length >= 3 && p.indexOf(tl) === 0 && p.length - tl.length <= 3)) return
      const rawPart = t.raw.split(/[-/]/)[pi] || ''
      const isProduct = PRODUCTS.indexOf(p) >= 0
      const cap = /^[A-Z]/.test(rawPart) && !(t.first && pi === 0 && isPlainVerb(p) && i === 0)
      const internal = /[a-z][A-Z]|[A-Za-z]\d|\d[A-Za-z]|^[A-Z]{2,}$/.test(rawPart)
      if (isProduct || internal || (cap && !(i === 0 && pi === 0 && isPlainVerb(p)))) add('new-name', `${prefix}"${rawPart || p}" is not in the original. Do not add names, employers, tools, products or acronyms.`)
    })
  })
  origToks.forEach(t => {
    if (STOPWORDS.has(t.lower) || /^[$€£]?\d/.test(t.raw) || techLower.has(t.lower)) return
    const idx = origToks.indexOf(t)
    const nameLike = (t.capital && !(idx === 0 && isPlainVerb(t.lower))) || t.internal || PRODUCTS.indexOf(t.lower) >= 0
    if (!nameLike) return
    if (idx === 0 && !t.internal && PRODUCTS.indexOf(t.lower) < 0) return
    if (!candToks.some(c => sameWord(c.lower, t.lower) || c.lower.split(/[-/]/).some(p => sameWord(p, t.lower)))) {
      add('lost-name', `${prefix}"${t.raw}" from the original is missing. Keep every employer, school, product and proper name.`)
    }
  })

  // titles, scope words, outcomes
  const check = (words: string[], rule: string, message: (w: string) => string) => {
    words.forEach(w => { if (wordIn(lc, w) && !wordIn(lo + ' ' + la, w) && !known(w)) add(rule, prefix + message(w)) })
  }
  check(TITLES, 'new-title', w => `"${w}" is a title or seniority that is not in the original. Do not raise the role level.`)
  check(SCOPE_WORDS, 'scope-inflation', w => `"${w}" widens the scope beyond the original. Do not inflate scope.`)
  check(OUTCOME_WORDS, 'invented-outcome', w => `"${w}" claims an outcome that is not in the original. Do not invent results.`)
  const phrase = lc.match(OUTCOME_PHRASES)
  if (phrase && !OUTCOME_PHRASES.test(lo + ' ' + la)) add('invented-outcome', `${prefix}"${phrase[0]}" claims an outcome that is not in the original.`)
  const oLead = (lo.match(LEAD_CLASS) || [])
  const cLead = (lc.match(LEAD_CLASS) || [])
  if (cLead.length && !oLead.length && !(la.match(LEAD_CLASS) || []).length) {
    add('scope-inflation', `${prefix}"${cLead[0]}" claims leadership or ownership the original does not convey. Keep the original strength of the verb.`)
  }

  // meaning reversal
  const hasAny = (hay: string, list: string[]) => list.some(w => wordIn(hay, w))
  const origNeg = hasAny(lo, NEGATORS)
  if (!origNeg && hasAny(lc, NEGATORS)) add('negation', `${prefix}The output adds a negation ("not", "no", "never", "without"). Do not change the meaning.`)
  const oDown = hasAny(lo, DOWN), oUp = hasAny(lo, UP), cDown = hasAny(lc, DOWN), cUp = hasAny(lc, UP)
  if (oDown && !oUp && cUp && !cDown) add('reversal', `${prefix}The output flips the direction of the change (original reduces, output increases).`)
  if (oUp && !oDown && cDown && !cUp) add('reversal', `${prefix}The output flips the direction of the change (original increases, output reduces).`)
}

/** Digits that merely refer to a position ("bullet 2", "role 3") are not facts. */
function sanitizeAllow(allow: string): string {
  return foldText(allow).replace(/\b(bullets?|points?|lines?|roles?|jobs?|items?|sections?|pages?|steps?|number|no\.?|#)\s*#?\d+\b/gi, ' ')
}

// ---------------------------------------------------------------- formatting

const PREAMBLE = /^\s*(?:here(?:'s| is| are)\b|sure\b\s*[,!.:]|certainly\b\s*[,!.:]|of course\b|okay\b\s*[,.!:]|ok\b\s*[,.!:]|absolutely\b\s*[,!.:]|i(?:'ve| have)\b|i (?:rewrote|revised|updated|changed)\b|rewritten\b\s*[:\-]|revised\b\s*(?:version|text|bullet)?\s*[:\-]|updated version\b|below is\b|as requested\b|great\b\s*[,!.]|no problem\b|happy to\b|let me\b|this (?:version|rewrite|bullet) )/i
const TRAILING_CHATTER = /\n\s*(?:let me know|hope this|feel free|i can also|notes?:|explanation:|changes made:|why:)/i
const FIRST_PERSON_RE = /\b(?:I|I'm|I've|I'd|I'll|me|my|mine|myself|we|our|ours)\b|\bus\b/g

function countFirstPerson(s: string): number { return (s.match(FIRST_PERSON_RE) || []).length }

/** Role/date lines are locked: only lines with a date range that are not bullets. */
function isLockedLine(line: string): boolean {
  const t = line.trim()
  if (!t || BULLET.test(line) || t.length > 140) return false
  return DATE_RANGE.test(t)
}

// ---------------------------------------------------------------- public

export function verifyRewrite(original: string, candidate: string, opts: GuardOptions = {}): GuardResult {
  const violations: Violation[] = []
  const warnings: string[] = []
  const add = (rule: string, message: string) => { if (!violations.some(v => v.rule === rule && v.message === message)) violations.push({ rule, message }) }
  const orig = (typeof original === 'string' ? original : '').replace(/\r\n/g, '\n')
  const cand = (typeof candidate === 'string' ? candidate : '').replace(/\r\n/g, '\n')
  const kind = opts.kind || 'text'
  const maxGrowth = opts.maxGrowth && opts.maxGrowth > 0 ? opts.maxGrowth : 1.5

  const trimmed = cand.trim()
  const origTrim = orig.trim()
  if (!trimmed) { add('empty', 'The output was empty. Return the rewritten text.'); return { ok: false, violations } }
  if (trimmed === OUT_OF_SCOPE || /^OUT_OF_SCOPE\b/.test(trimmed)) { add('out-of-scope', 'The output was OUT_OF_SCOPE, which is not a rewrite.'); return { ok: false, violations } }
  const identical = norm(foldText(trimmed)) === norm(foldText(origTrim))
  if (identical && !opts.allowUnchanged) add('identical', 'The output is identical to the original. Change it or the edit is pointless.')
  if (identical) return { ok: violations.length === 0, violations, warnings: warnings.length ? warnings : undefined }

  // format
  if (PREAMBLE.test(trimmed)) add('preamble', 'Remove the preamble or commentary. Return only the replacement text.')
  if (TRAILING_CHATTER.test(trimmed)) add('commentary', 'Remove trailing commentary. Return only the replacement text.')
  if (/```|\*\*|__[^_]+__|^\s{0,3}#{1,6}\s/m.test(trimmed) || (!/`/.test(origTrim) && /`/.test(trimmed))) add('markdown', 'Remove markdown formatting (code fences, backticks, bold, headings).')
  if (/^["'“‘].*["'”’]$/.test(trimmed.replace(/\n/g, ' ')) && !/^["'“‘]/.test(origTrim)) add('quotes', 'Remove the quotation marks around the output.')
  if (kind === 'bullet') {
    if (/\n/.test(trimmed)) add('multi-line', 'A bullet must be exactly one line. Remove line breaks.')
    if (BULLET.test(trimmed)) add('bullet-marker', 'Do not include the bullet marker. Return only the bullet text.')
    const op = /[.!?]$/.test(origTrim)
    const cp = /[.!?]$/.test(trimmed)
    if (op !== cp) add('trailing-period', op ? 'The original ends with a period; keep that consistent.' : 'The original has no trailing period; do not add one.')
  }

  // first person
  const fpCand = countFirstPerson(trimmed)
  if (kind === 'bullet' ? fpCand > 0 : fpCand > countFirstPerson(orig)) add('first-person', 'Remove first-person words (I, my, we, our).')

  // size and user limits
  const o = norm(origTrim).length
  const c = norm(trimmed).length
  if (o > 0) {
    const limit = Math.max(o * maxGrowth, o + 24)
    if (c > limit) add('too-long', `The output is ${c} characters against ${o} in the original. Stay within ${Math.round(maxGrowth * 100)}% of the original.`)
    if (opts.mustShrink && c >= o) add('not-shorter', `The output must be shorter than the original (${o} characters) but is ${c}.`)
    if (!opts.mustShrink && o >= 40 && c < o * 0.3) add('too-short', 'The output drops most of the original. Keep the facts.')
  }
  if (opts.maxWords && wordCount(trimmed) > opts.maxWords) add('max-words', `The output has ${wordCount(trimmed)} words; the limit is ${opts.maxWords}.`)
  if (opts.maxChars && c > opts.maxChars) add('max-chars', `The output has ${c} characters; the limit is ${opts.maxChars}.`)
  if (opts.maxLines && trimmed.split('\n').filter(l => l.trim()).length > opts.maxLines) add('max-lines', `The output has more than ${opts.maxLines} line(s).`)

  const oLines = origTrim.split('\n')
  const cLines = trimmed.split('\n')
  const multi = oLines.length > 1 || cLines.length > 1

  // locked header/date lines must survive verbatim
  const locked = oLines.filter(isLockedLine).map(l => norm(l))
  if (locked.length) {
    const have = new Set(cLines.map(l => norm(l)))
    locked.forEach(l => { if (!have.has(l)) add('structure', `The role or date line "${l.slice(0, 50)}" must not change.`) })
  }

  if (opts.structure === 'strict') {
    if (oLines.length !== cLines.length) {
      add('line-count', `The target has ${oLines.length} lines; the output has ${cLines.length}. Keep the same number of lines.`)
    } else {
      oLines.forEach((line, i) => {
        const a = line.replace(/\s+$/, '')
        const b = cLines[i].replace(/\s+$/, '')
        const am = a.match(BULLET)
        const bm = b.match(BULLET)
        if (am) {
          if (!bm || norm(am[0]) !== norm(bm[0])) add('bullet-marker', `Line ${i + 1} must keep its bullet marker "${norm(am[0])}".`)
        } else if (norm(a) !== norm(b) && a.trim()) {
          add('structure', `Line ${i + 1} ("${a.trim().slice(0, 40)}") is a heading or role line and must not change.`)
        }
        if (bm && !am) add('bullet-marker', `Line ${i + 1} gained a bullet marker.`)
      })
    }
  }

  // facts: per original line when lines pair up one to one, otherwise as one block
  if (multi && oLines.length === cLines.length) {
    oLines.forEach((line, i) => {
      if (norm(line) === norm(cLines[i])) return
      if (!line.trim() || isLockedLine(line)) return
      factChecks(line.replace(BULLET, ''), cLines[i].replace(BULLET, ''), opts, add, w => warnings.push(w), `Line ${i + 1}: `)
    })
  } else {
    factChecks(multi ? origTrim : origTrim.replace(BULLET, ''), trimmed, opts, add, w => warnings.push(w), '')
  }

  // drift: a rewrite shares its substance with the original
  const cw = new Set<string>(), ow = new Set<string>()
  const content = (s: string, into: Set<string>) => s.toLowerCase().split(/[^a-z0-9]+/).forEach(w => { if (w.length >= 4 && !STOPWORDS.has(w)) into.add(w.slice(0, 5)) })
  content(origTrim, ow); content(trimmed, cw)
  if (ow.size >= 4 && cw.size >= 3) {
    let shared = 0
    cw.forEach(w => { if (ow.has(w)) shared++ })
    if (shared / Math.min(ow.size, cw.size) < 0.34) add('off-topic', 'The output does not stay close to the original text. Rewrite the same content, do not replace it.')
  }

  return { ok: violations.length === 0, violations, warnings: warnings.length ? warnings : undefined }
}

export { stem as _stem }
