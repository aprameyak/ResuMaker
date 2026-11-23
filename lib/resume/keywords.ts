import type { Keywords } from './types'
import { TECH_TERMS, BUSINESS_TERMS, INDUSTRY_TERMS, ALIASES, DISPLAY } from './dictionary'

const MAX_INPUT = 20_000

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
}

function termRegex(term: string): RegExp {
  const body = escapeRe(term).replace(/\\ /g, '[\\s-]+')
  return new RegExp(`(?<![A-Za-z0-9+#.])${body}(?![A-Za-z0-9+#]|\\.[A-Za-z0-9])`, 'i')
}

const VARIANTS: Record<string, string[]> = Object.assign(Object.create(null), {
  mentoring: ['mentored', 'mentor', 'mentors'],
  communication: ['communicated', 'communicating'],
  collaboration: ['collaborated', 'collaborating'],
  documentation: ['documented'],
  forecasting: ['forecasted'],
  budgeting: ['budgeted'],
  leadership: ['led a team', 'led teams'],
})

const TERM_PATTERNS = new Map<string, RegExp>()
const ALL_TERMS = Array.from(new Set([...TECH_TERMS, ...BUSINESS_TERMS, ...INDUSTRY_TERMS]))
const ALIAS_BY_CANON = new Map<string, string[]>()
for (const [alias, canon] of Object.entries(ALIASES)) {
  ALIAS_BY_CANON.set(canon, [...(ALIAS_BY_CANON.get(canon) || []), alias])
}

function patternsFor(term: string): RegExp[] {
  const forms = [term, ...(ALIAS_BY_CANON.get(term) || []), ...(VARIANTS[term] || [])]
  return forms.map(f => {
    let re = TERM_PATTERNS.get(f)
    if (!re) {
      re = termRegex(f)
      TERM_PATTERNS.set(f, re)
    }
    return re
  })
}

// Go the language: capital G only, and it must sit in a list/label/bullet position, so prose like
// "Go-getters" or "go above and beyond" does not match. Lowercase "go" counts after "in/using/with" at a clause end.
const GO_PATTERN = /(?:^|[\s,;|/(\[•*:·])Go(?=\s*(?:[,;|/)\]•]|$|\band\b|\bor\b|\.(?:\s|$)))/m
const GO_LOWER = /\b(?:in|using|with)\s+go(?=\s*(?:[,;|/)]|$|\band\b|\bor\b|\.(?:\s|$)))/mi
export function containsTerm(text: string, term: string): boolean {
  if (term === 'go') return GO_PATTERN.test(text) || GO_LOWER.test(text) || /\bgolang\b/i.test(text)
  if (term.length === 1) {
    const single = new RegExp(`(?:^|[\\s,;(/])${escapeRe(term.toUpperCase())}(?=$|[\\s,;)/]|\\.(?:\\s|$))`)
    return single.test(text)
  }
  return patternsFor(term).some(re => re.test(text))
}

export function displayTerm(term: string): string {
  return DISPLAY[term] || term
}

const PREFERRED_CUE = /\b(preferred|nice to have|nice-to-have|bonus|a plus|is a plus|plus:|desirable|ideally|good to have|optional)\b/i
const REQUIRED_CUE = /\b(required|requirements?|must have|must-have|minimum qualifications?|basic qualifications?|you have|you bring|what you'll need|what we're looking for)\b/i

function countOccurrences(text: string, term: string): number {
  let n = 0
  for (const re of patternsFor(term)) {
    const global = new RegExp(re.source, 'gi')
    n += (text.match(global) || []).length
  }
  return n
}

export function analyzeJobDescription(description: string): Keywords {
  const text = (description || '').slice(0, MAX_INPUT)
  const lines = text.split(/\r?\n/)
  const essential = new Map<string, number>()
  const preferred = new Map<string, number>()
  const skills = new Set<string>()
  const industry = new Set<string>()

  let zone: 'required' | 'preferred' | 'neutral' | 'skip' = 'neutral'

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const isHeading = line.length < 60 && !/[.]$/.test(line) && !/^[•\-*]/.test(line)
    if (isHeading) {
      if (/^(benefits|perks|compensation|salary|pay|equal opportunity|what we offer|our benefits)/i.test(line)) zone = 'skip'
      else if (PREFERRED_CUE.test(line)) zone = 'preferred'
      else if (REQUIRED_CUE.test(line)) zone = 'required'
      else if (/^(about|responsibilities|benefits|perks|what you'll do|who we are|why join)/i.test(line)) zone = 'neutral'
    }
    if (zone === 'skip') continue
    const lineZone = PREFERRED_CUE.test(line) && !isHeading ? 'preferred' : zone

    for (const term of ALL_TERMS) {
      if (!containsTerm(line, term)) continue
      const isIndustry = INDUSTRY_TERMS.includes(term) && !TECH_TERMS.includes(term)
      if (isIndustry) {
        industry.add(term)
        continue
      }
      if (TECH_TERMS.includes(term)) skills.add(term)
      const bucket = lineZone === 'preferred' ? preferred : essential
      bucket.set(term, (bucket.get(term) || 0) + 1)
    }
  }

    for (const term of Array.from(preferred.keys())) {
    if (essential.has(term)) preferred.delete(term)
  }

  const rank = (m: Map<string, number>) =>
    Array.from(m.entries()).sort((a, b) => b[1] - a[1] || countOccurrences(text, b[0]) - countOccurrences(text, a[0])).map(([t]) => t)

  return {
    essential: rank(essential).map(displayTerm),
    preferred: rank(preferred).map(displayTerm),
    skills: Array.from(skills).map(displayTerm),
    industry: Array.from(industry).map(displayTerm),
  }
}

export interface MatchResult {
  matched: string[]
  missing: string[]
  coverage: number
}

export function matchKeywords(resumeText: string, keywords: Keywords): MatchResult {
  const text = resumeText || ''
  const seen = new Set<string>()
  const matched: string[] = []
  const missing: string[] = []
  const weighted: Array<[string, number]> = [
    ...keywords.essential.map(k => [k, 3] as [string, number]),
    ...keywords.skills.map(k => [k, 2] as [string, number]),
    ...keywords.preferred.map(k => [k, 1] as [string, number]),
    ...keywords.industry.map(k => [k, 1] as [string, number]),
  ]
  let total = 0
  let hit = 0
  for (const [term, weight] of weighted) {
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    total += weight
    const canon = ALIASES[key] || key
    if (containsTerm(text, canon) || containsTerm(text, key)) {
      matched.push(term)
      hit += weight
    } else {
      missing.push(term)
    }
  }
  return { matched, missing, coverage: total ? Math.round((hit / total) * 100) : 0 }
}
