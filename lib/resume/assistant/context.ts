import { BULLET, DATE_RANGE, headingFor, isHeaderCandidate, parseResume } from '../parse'

export type TargetKind = 'selection' | 'bullet' | 'role' | 'section' | 'document'

export interface Target {
  kind: TargetKind
  from: number
  to: number
  text: string
  label: string
  roleHeader?: string
  section?: string
  ambiguous?: string[]
  /** Set when the prompt named a role or section that does not exist in the resume (the target is then NOT usable). */
  unresolved?: string
}

export interface DocInput {
  text: string
  selection?: { from: number; to: number }
  cursor?: number
}

// ---------------------------------------------------------------- structure index

interface Bullet { from: number; to: number; lineFrom: number; text: string; marker: boolean; role?: Role; index: number }
interface Role {
  from: number
  to: number
  header: string
  headerLines: string[]
  bullets: Bullet[]
  section: string
  index: number
  hasContent: boolean
  recency: number
}
interface Section { key: string; headingFrom: number; headingTo: number; from: number; to: number; title: string; inlineFrom?: number }
interface Index { text: string; roles: Role[]; bullets: Bullet[]; sections: Section[] }

interface Line { start: number; end: number; text: string }

const TITLE_RE = /\b(engineer|engineering|developer|intern|manager|analyst|designer|scientist|consultant|director|lead|architect|assistant|associate|coordinator|specialist|researcher|administrator|technician|officer|founder|instructor|tutor|president|head|programmer|fellow|cashier|server|barista|clerk|representative|volunteer|supervisor|teller|trainer|nurse|sales|agent|senior|junior|staff|principal|software|technical|ta)\b/i
const MONTHS_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?$/i
const COMPANY_NOISE = new Set(['corp', 'corporation', 'inc', 'llc', 'ltd', 'company', 'group', 'present', 'current', 'university', 'college', 'the', 'and', 'with'])
const STOP = new Set([
  'make', 'this', 'that', 'these', 'those', 'them', 'with', 'from', 'into', 'about', 'resume', 'bullet', 'bullets', 'point', 'points', 'line', 'lines', 'role', 'roles', 'job', 'jobs',
  'stronger', 'shorter', 'better', 'shorten', 'tighten', 'strengthen', 'improve', 'rewrite', 'rephrase', 'polish', 'more', 'less', 'please', 'fix', 'your', 'have', 'does', 'what', 'work',
  'experience', 'section', 'sections', 'quantify', 'numbers', 'metrics', 'tailor', 'check', 'review', 'make', 'wording', 'sound', 'sounds', 'bit', 'little', 'much', 'very', 'just', 'only',
  'position', 'positions', 'concise', 'impact', 'impactful', 'every', 'everything', 'where', 'there', 'which', 'would', 'could', 'should', 'their', 'then', 'than', 'when', 'under', 'over',
])

function splitLines(text: string): Line[] {
  const out: Line[] = []
  let pos = 0
  for (const raw of text.split('\n')) {
    const trimmed = raw.replace(/\s+$/, '')
    out.push({ start: pos, end: pos + trimmed.length, text: trimmed })
    pos += raw.length + 1
  }
  return out
}

function isBlank(l: Line): boolean { return l.text.trim() === '' }

function recencyOf(header: string, index: number): number {
  if (/\b(present|current|now|ongoing)\b/i.test(header)) return 100000 - index
  const years = (header.match(/\b(19|20)\d{2}\b/g) || []).map(Number)
  if (years.length) return Math.max.apply(null, years) * 10 - index * 0.01
  return -index
}

function buildIndex(text: string): Index {
  const lines = splitLines(text)
  const sections: Section[] = []
  const roles: Role[] = []
  const bullets: Bullet[] = []

  let section = 'header'
  let current: Role | null = null
  let lastBullet: Bullet | null = null
  let sectionStartIdx = -1

  const closeSection = (endLineIdx: number) => {
    if (sectionStartIdx < 0) return
    const s = sections[sectionStartIdx]
    let last = endLineIdx - 1
    while (last >= 0 && isBlank(lines[last])) last--
    if (s.inlineFrom !== undefined) {
      s.from = s.inlineFrom
      s.to = Math.max(s.inlineFrom, last >= 0 ? lines[last].end : s.headingTo)
      return
    }
    const firstBody = lines.findIndex(l => l.start > s.headingTo && !isBlank(l))
    if (firstBody >= 0 && lines[firstBody].start <= (lines[last] ? lines[last].start : -1)) {
      s.from = lines[firstBody].text.length ? lines[firstBody].start + (lines[firstBody].text.length - lines[firstBody].text.trimStart().length) : lines[firstBody].start
      s.to = lines[last].end
    } else {
      s.from = s.headingTo
      s.to = s.headingTo
    }
  }

  const newRole = (line: Line, sec: string): Role => {
    const r: Role = {
      from: line.start + (line.text.length - line.text.trimStart().length),
      to: line.end, header: line.text.trim(), headerLines: [line.text.trim()], bullets: [], section: sec,
      index: roles.length, hasContent: false, recency: 0,
    }
    roles.push(r)
    return r
  }

  const nextNonBlank = (i: number): Line | undefined => {
    for (let k = i + 1; k < lines.length; k++) if (!isBlank(lines[k])) return lines[k]
    return undefined
  }

  lines.forEach((line, i) => {
    if (isBlank(line)) return
    const t = line.text.trim()
    const heading = headingFor(t)
    const inline = !heading ? t.match(/^([A-Za-z &]{3,30}?)\s*:\s*(\S.*)$/) : null
    const inlineKey = inline ? headingFor(inline[1]) : null
    if (heading || inlineKey) {
      closeSection(i)
      section = (heading || inlineKey) as string
      sections.push({ key: section, headingFrom: line.start + (line.text.length - line.text.trimStart().length), headingTo: line.end, from: line.end, to: line.end, title: heading ? t : inline![1], inlineFrom: heading ? undefined : line.end - inline![2].length })
      sectionStartIdx = sections.length - 1
      current = null
      lastBullet = null
      return
    }

    const bm = line.text.match(BULLET)
    const roleSection = section === 'experience' || section === 'projects'

    if (bm) {
      const from = line.start + bm[0].length
      const b: Bullet = { from, to: line.end, lineFrom: line.start, text: text.slice(from, line.end), marker: true, role: current || undefined, index: bullets.length }
      if (b.to < b.from) return
      bullets.push(b)
      lastBullet = b
      if (roleSection && current) {
        current.bullets.push(b)
        current.hasContent = true
        current.to = line.end
      }
      return
    }

    // non-bullet line
    const indented = /^\s{2,}/.test(line.text)
    const lowerStart = /^[a-z]/.test(t)
    if (lastBullet && (indented || lowerStart) && !DATE_RANGE.test(t) && lastBullet.to <= line.start) {
      lastBullet.to = line.end
      lastBullet.text = text.slice(lastBullet.from, lastBullet.to)
      if (current) current.to = line.end
      return
    }

    if (!roleSection) {
      // plain prose line (summary, header, skills, education): a pseudo bullet without marker
      if (section !== 'header') {
        const from = line.start + (line.text.length - line.text.trimStart().length)
        const b: Bullet = { from, to: line.end, lineFrom: line.start, text: text.slice(from, line.end), marker: false, index: bullets.length }
        bullets.push(b)
      }
      return
    }

    const cand = isHeaderCandidate(t)
    const nxt = nextNonBlank(i)
    const nextCand = nxt ? isHeaderCandidate(nxt.text.trim()) && !BULLET.test(nxt.text) : false

    const asBody = () => {
      const from = line.start + (line.text.length - line.text.trimStart().length)
      const b: Bullet = { from, to: line.end, lineFrom: line.start, text: text.slice(from, line.end), marker: false, role: current || undefined, index: bullets.length }
      bullets.push(b)
      if (current) { current.bullets.push(b); current.hasContent = true; current.to = line.end }
      lastBullet = null
    }

    if (!current) { current = newRole(line, section); lastBullet = null; return }

    if (section === 'projects') {
      const sentence = /[.!?]$/.test(t)
      if (current.hasContent ? (!sentence && !lowerStart) : false) { current = newRole(line, section); lastBullet = null; return }
      if (!current.hasContent && !sentence && !lowerStart && current.headerLines.length >= 1) { current = newRole(line, section); lastBullet = null; return }
      asBody()
      return
    }

    // experience
    if (!current.hasContent) {
      const hasDate = /\b(19|20)\d{2}\b|\bpresent\b|\bcurrent\b/i.test(current.header)
      const headerHasCand = current.headerLines.some(h => isHeaderCandidate(h))
      const complete = hasDate && headerHasCand
      if (!complete) {
        if ((cand || !headerHasCand) && current.headerLines.length < 4) {
          current.headerLines.push(t)
          current.header = current.headerLines.join(' ')
          current.to = line.end
          return
        }
        asBody()
        return
      }
      if (cand || nextCand) { current = newRole(line, section); lastBullet = null; return }
      asBody()
      return
    }
    if (cand || (!cand && nextCand)) { current = newRole(line, section); lastBullet = null; return }
    asBody()
  })
  closeSection(lines.length)

  roles.forEach(r => { r.recency = recencyOf(r.header, r.index) })
  return { text, roles, bullets, sections }
}

// ---------------------------------------------------------------- helpers

function clamp(n: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, n)) }
function oneLine(s: string, max = 60): string {
  const c = s.replace(/\s+/g, ' ').trim()
  return c.length > max ? c.slice(0, max - 1).trimEnd() + '…' : c
}
function stripDates(s: string): string {
  return s.replace(DATE_RANGE, ' ').replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').replace(/[\s,|—–-]+$/g, '').trim()
}
function roleLabel(r: Role): string { return oneLine(stripDates(r.header)) || oneLine(r.header) }
function roleTarget(idx: Index, r: Role, ambiguous?: string[]): Target {
  const from = r.from
  const to = Math.max(r.to, from)
  const t: Target = { kind: 'role', from, to, text: idx.text.slice(from, to), label: roleLabel(r), roleHeader: oneLine(r.header, 160), section: r.section }
  if (ambiguous && ambiguous.length > 1) t.ambiguous = ambiguous
  return t
}
function bulletTarget(idx: Index, b: Bullet, ambiguous?: string[]): Target {
  const role = b.role
  const pos = role ? role.bullets.indexOf(b) + 1 : 0
  const sec = role ? role.section : sectionAt(idx, b.from)?.key
  const t: Target = {
    kind: 'bullet', from: b.from, to: b.to, text: idx.text.slice(b.from, b.to),
    label: role ? `Bullet ${pos} of ${roleLabel(role)}` : 'Bullet',
  }
  if (role) t.roleHeader = oneLine(role.header, 160)
  if (sec) t.section = sec
  if (ambiguous && ambiguous.length > 1) t.ambiguous = ambiguous
  return t
}
function sectionAt(idx: Index, pos: number): Section | undefined {
  let found: Section | undefined
  for (const s of idx.sections) if (s.headingFrom <= pos) found = s
  return found
}
function sectionTarget(idx: Index, s: Section): Target {
  const from = s.to > s.from ? s.from : s.headingTo
  const to = Math.max(s.to, from)
  return { kind: 'section', from, to, text: idx.text.slice(from, to), label: `${s.title.replace(/:$/, '')} section`, section: s.key }
}
function documentTarget(text: string): Target {
  return { kind: 'document', from: 0, to: text.length, text, label: 'Whole resume' }
}
function roleAt(idx: Index, pos: number): Role | undefined {
  return idx.roles.find(r => pos >= r.from && pos <= r.to)
}
function bulletAt(idx: Index, pos: number): Bullet | undefined {
  return idx.bullets.find(b => pos >= b.lineFrom && pos <= b.to)
}

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2
  const m = a.length, n = b.length
  const d: number[] = []
  for (let j = 0; j <= n; j++) d.push(j)
  for (let i = 1; i <= m; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return d[n]
}

function words(p: string): string[] {
  return p.split(/[^a-z0-9.+#]+/).map(w => w.replace(/^[.+#]+|[.+#]+$/g, '')).filter(Boolean)
}

function containsPhrase(p: string, phrase: string): boolean {
  if (!phrase) return false
  const i = p.indexOf(phrase)
  if (i < 0) return false
  const before = i === 0 ? ' ' : p[i - 1]
  const after = i + phrase.length >= p.length ? ' ' : p[i + phrase.length]
  return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)
}

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9&.+# ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function roleScore(role: Role, p: string, pWords: string[], parsed: ReturnType<typeof safeParse>): number {
  let best = 0
  let extra = 0
  const header = normKey(role.header)
  const keys: Array<{ k: string; w: number }> = []
  const addName = (name: string, w: number) => {
    const n = normKey(name)
    if (n.length < 3) return
    const stripped = n.replace(/\b(corp|corporation|inc|llc|ltd|co|company|group)$/, '').trim()
    keys.push({ k: n, w })
    if (stripped && stripped !== n) keys.push({ k: stripped, w })
    const first = stripped.split(' ')[0]
    if (first && first.length >= 4 && stripped.split(' ').length > 1 && !COMPANY_NOISE.has(first) && !TITLE_RE.test(first)) keys.push({ k: first, w: w - 1 })
  }
  parsed.experience.forEach(e => {
    if (e.company && header.includes(normKey(e.company))) addName(e.company, 3)
    if (e.position && header.includes(normKey(e.position))) {
      const pos = normKey(e.position).replace(/\b(i{1,3}|iv|v|\d+)$/, '').trim()
      if (pos.length >= 3) keys.push({ k: pos, w: 3 })
    }
  })
  parsed.projects.forEach(pr => { if (pr.name && header.includes(normKey(pr.name))) addName(pr.name, 3) })
  header.split(' ').forEach(tok => {
    if (tok.length >= 4 && !MONTHS_RE.test(tok) && !/^\d+$/.test(tok) && !TITLE_RE.test(tok) && !COMPANY_NOISE.has(tok) && !STOP.has(tok)) keys.push({ k: tok, w: 2 })
  })
  const uniq = new Map<string, number>()
  keys.forEach(x => uniq.set(x.k, Math.max(uniq.get(x.k) || 0, x.w)))
  const deduped = Array.from(uniq.entries()).map(([k, w]) => ({ k, w }))
  for (const { k, w } of deduped) {
    if (containsPhrase(p, k)) { best = Math.max(best, w); extra += 0.1; continue }
    if (k.indexOf(' ') < 0 && k.length >= 5 && pWords.some(pw => pw.length >= 5 && !STOP.has(pw) && lev(pw, k) <= 1)) { best = Math.max(best, w - 0.5); extra += 0.05 }
  }
  const years = p.match(/\b(19|20)\d{2}\b/g) || []
  years.forEach(y => { if (role.header.indexOf(y) >= 0) best = Math.max(best, 2) })
  return best > 0 ? best + extra : 0
}

function safeParse(text: string) {
  try { return parseResume(text) } catch { return { summary: '', education: [], experience: [], skills: { technical: [], soft: [] }, projects: [] } }
}

const ORD: Record<string, number> = { first: 1, '1st': 1, second: 2, '2nd': 2, third: 3, '3rd': 3, fourth: 4, '4th': 4, fifth: 5, '5th': 5, sixth: 6, '6th': 6, last: -1, final: -1, bottom: -1, top: 1 }

function pickRecent(roles: Role[]): Role {
  return roles.slice().sort((a, b) => b.recency - a.recency)[0]
}

function sectionKeysIn(p: string): string[] {
  const out: string[] = []
  const my = '(?:my|the|this|your|current)'
  if (new RegExp(`\\b${my} (?:professional |career )?(?:summary|objective|profile)\\b|\\b(?:summary|objective|profile) (?:section|paragraph|statement|blurb)\\b|^(?:the )?(?:professional )?summary\\b|\\babout me\\b`).test(p)) out.push('summary')
  if (new RegExp(`\\b${my} (?:technical )?skills?\\b|\\bskills? (?:section|list|line)\\b|^skills\\b|\\bcore competencies\\b`).test(p)) out.push('skills')
  if (new RegExp(`\\b${my} education\\b|\\beducation (?:section|entry|block)\\b|^education\\b`).test(p)) out.push('education')
  if (new RegExp(`\\b${my} (?:personal |side |academic )?projects\\b|\\bprojects? (?:section|list)\\b|^projects\\b`).test(p)) out.push('projects')
  if (new RegExp(`\\b${my} (?:work |professional )?(?:experience|history)\\b(?! (?:at|with|in)\\b)|\\b(?:experience|work history|employment) (?:section|history)\\b|^(?:work )?experience\\b`).test(p)) out.push('experience')
  return out
}

// ---------------------------------------------------------------- resolver

export function resolveTarget(prompt: string, doc: DocInput): Target {
  const text = doc && typeof doc.text === 'string' ? doc.text : ''
  try {
    return resolveInner(typeof prompt === 'string' ? prompt : '', doc || { text }, text)
  } catch {
    return documentTarget(text)
  }
}

function resolveInner(prompt: string, doc: DocInput, text: string): Target {
  const len = text.length
  const idx = buildIndex(text)

  // 1. explicit selection
  const sel = doc.selection
  let cursor = typeof doc.cursor === 'number' && isFinite(doc.cursor) ? clamp(Math.floor(doc.cursor), 0, len) : undefined
  if (sel && typeof sel.from === 'number' && typeof sel.to === 'number' && isFinite(sel.from) && isFinite(sel.to)) {
    let a = clamp(Math.floor(sel.from), 0, len)
    let b = clamp(Math.floor(sel.to), 0, len)
    if (a > b) { const x = a; a = b; b = x }
    if (b > a) {
      const t: Target = { kind: 'selection', from: a, to: b, text: text.slice(a, b), label: 'Selection' }
      const r = roleAt(idx, a)
      if (r) { t.roleHeader = oneLine(r.header, 160); t.section = r.section }
      else { const s = sectionAt(idx, a); if (s) t.section = s.key }
      return t
    }
    if (cursor === undefined) cursor = a
  }

  const p = prompt.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()
  const pWords = words(p)
  const parsed = safeParse(text)
  const expRoles = idx.roles.filter(r => r.section === 'experience')
  const projRoles = idx.roles.filter(r => r.section === 'projects')
  const wantsProject = /\bprojects?\b/.test(p)
  const rolePool = wantsProject && projRoles.length ? projRoles : expRoles.length ? expRoles : idx.roles

  // named roles (company / title / year / project)
  const scored = idx.roles
    .map(r => ({ r, s: roleScore(r, p, pWords, parsed) }))
    .filter(x => x.s > 0)
  let named: { role: Role; tied: Role[] } | undefined
  if (scored.length) {
    const top = Math.max.apply(null, scored.map(x => x.s))
    const tied = scored.filter(x => Math.abs(x.s - top) < 0.001).map(x => x.r)
    named = { role: pickRecent(tied), tied }
  }
  const ambig = (tied: Role[]) => (tied.length > 1 ? tied.map(r => roleLabel(r)) : undefined)

  // context role for ordinal bullets: named > cursor > most recent
  const contextRole = (): { role: Role; ambiguous?: string[] } | undefined => {
    if (named) return { role: named.role, ambiguous: ambig(named.tied) }
    if (cursor !== undefined) { const r = roleAt(idx, cursor); if (r) return { role: r } }
    if (!rolePool.length) return undefined
    return { role: pickRecent(rolePool), ambiguous: rolePool.length > 1 ? rolePool.map(r => roleLabel(r)) : undefined }
  }

  // 2a. ordinals: "second bullet", "last role", and two-part references ("second bullet of the second job")
  const ORD_WORDS = 'first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|sixth|6th|last|final|top|bottom'
  const bulletRef = p.match(new RegExp(`\\b(${ORD_WORDS})\\s+(?:one\\s+)?(?:bullet|point|line)s?\\b|\\b(?:bullet|point|line)\\s*(?:#|number|no\\.?)?\\s*(\\d{1,2})\\b`))
  const roleOrd = (txt: string, pool: Role[]): Role | undefined => {
    const m = txt.match(new RegExp(`\\b(${ORD_WORDS})\\s+(?:role|job|position|project|internship|gig)\\b`))
    if (!m) return undefined
    const n = ORD[m[1]]
    return n === -1 ? pool[pool.length - 1] : pool[n - 1]
  }
  const roleRecency = (txt: string, pool: Role[]): Role | undefined => {
    const m = txt.match(/\b(most recent|latest|newest|current|present|oldest|earliest|previous|prior)\s+(?:role|job|position|employer|gig|internship)\b/)
    if (!m || !pool.length) return undefined
    const asc = /oldest|earliest/.test(m[1])
    const sorted = pool.slice().sort((x, y) => (asc ? x.recency - y.recency : y.recency - x.recency))
    return /previous|prior/.test(m[1]) ? sorted[1] || sorted[0] : sorted[0]
  }
  if (bulletRef) {
    const n = bulletRef[1] ? ORD[bulletRef[1]] : Number(bulletRef[2])
    const rest = p.replace(bulletRef[0], ' ')
    const pool = wantsProject && projRoles.length ? projRoles : rolePool
    const qualified = roleOrd(rest, named && named.tied.length > 1 ? named.tied : pool) || roleRecency(rest, pool)
    const secKey = sectionKeysIn(rest).filter(k => k !== 'experience')[0]
    if (!qualified && secKey && !named) {
      const sec = idx.sections.find(x => x.key === secKey)
      if (sec) {
        const inSec = idx.bullets.filter(b => b.from >= sec.headingTo && b.from <= Math.max(sec.to, sec.headingTo))
        const b = n === -1 ? inSec[inSec.length - 1] : inSec[n - 1]
        if (b) return bulletTarget(idx, b)
        return sectionTarget(idx, sec)
      }
    }
    const ctx = qualified ? { role: qualified, ambiguous: undefined as string[] | undefined } : contextRole()
    if (ctx && ctx.role.bullets.length) {
      const bl = ctx.role.bullets
      const b = n === -1 ? bl[bl.length - 1] : bl[n - 1]
      if (b) return bulletTarget(idx, b, ctx.ambiguous)
      return roleTarget(idx, ctx.role, ctx.ambiguous)
    }
    const flat = idx.bullets.filter(b => b.marker)
    const b = n === -1 ? flat[flat.length - 1] : flat[n - 1]
    if (b) return bulletTarget(idx, b)
  }
  const om = p.match(new RegExp(`\\b(${ORD_WORDS})\\s+(?:one\\s+)?(role|job|position|project|section)\\b`))
  if (om) {
    const n = ORD[om[1]]
    if (om[2] === 'section') {
      const sec = n === -1 ? idx.sections[idx.sections.length - 1] : idx.sections[n - 1]
      if (sec) return sectionTarget(idx, sec)
    } else {
      const pool = om[2] === 'project' ? (projRoles.length ? projRoles : rolePool) : named && named.tied.length > 1 ? named.tied : rolePool
      const r = n === -1 ? pool[pool.length - 1] : pool[n - 1]
      if (r) return roleTarget(idx, r)
    }
  }

  // 2b. recency words: "most recent job", "current role", "oldest job"
  const recRole = roleRecency(p, rolePool)
  if (recRole) return roleTarget(idx, recRole)

  // 2c. company / title / year / project name
  if (named) {
    if (/\b(bullet|point|line|sentence)\b/.test(p) && !/\b(bullets|points|lines)\b/.test(p) && named.role.bullets.length) {
      // "the Redis bullet at Acme": narrow to a bullet by content when it is unambiguous
      const b = bulletByContent(named.role.bullets, p, pWords)
      if (b) return bulletTarget(idx, b, ambig(named.tied))
    }
    if (named.tied.length > 1) {
      const older = /\b(older|oldest|earlier|earliest|former|previous|prior|old)\b/.test(p)
      const newer = /\b(newer|newest|later|latest|recent|current|new)\b/.test(p)
      if (older !== newer) {
        const sorted = named.tied.slice().sort((x, y) => (older ? x.recency - y.recency : y.recency - x.recency))
        return roleTarget(idx, sorted[0])
      }
    }
    return roleTarget(idx, named.role, ambig(named.tied))
  }
  const eduHit = idx.sections.find(s => s.key === 'education' && parsed.education.some(e => e.institution && containsPhrase(p, normKey(e.institution).split(' ').slice(0, 3).join(' '))))
  if (eduHit) return sectionTarget(idx, eduHit)

  // 2d. section names
  const askedSections = sectionKeysIn(p)
  for (const key of askedSections) {
    const s = idx.sections.find(x => x.key === key)
    if (s) return sectionTarget(idx, s)
  }

  // 2e. a bullet by its content ("the Redis bullet", "the one about caching")
  if (/\b(bullet|point|line|sentence|the one (about|with|on|that))\b/.test(p)) {
    const b = bulletByContent(idx.bullets.filter(x => x.marker || x.role), p, pWords)
    if (b) return bulletTarget(idx, b)
  }

  // 2d'. an explicit name or section that does not exist must never widen to the whole document
  if (askedSections.length) return { ...documentTarget(text), unresolved: `a ${askedSections[0]} section` }
  const nm = p.match(/\b(?:my|the|at|for|in)\s+([a-z][a-z0-9&.'-]*(?:\s[a-z][a-z0-9&.'-]*)?)\s+(?:job|role|position|internship|gig|bullets?|work|experience|stint)\b/)
  if (nm) {
    const GENERIC = /^(first|second|third|fourth|fifth|sixth|last|final|current|latest|most|recent|oldest|earliest|newest|newer|older|previous|prior|past|old|new|whole|entire|full|part|time|full-time|part-time|summer|this|that|these|those|each|every|all|other|another|same|professional|work|your|resume|cv|summary|skills?|education|projects?|experience|internship|volunteer|freelance|paid|teaching|research|relevant|personal|technical|soft|hard|key|main|top|best|worst|weakest|strongest|own|day|real|actual|bottom|middle|and|of|to|a|an|the|my|current|one|two|three)$/
    const toks = nm[1].split(' ')
    if (toks.every(t => !GENERIC.test(t))) return { ...documentTarget(text), unresolved: `a role or employer called "${nm[1]}"` }
  }

  // 2d''. "this bullet ... for the job posting / ATS" with the cursor in a bullet stays on that bullet
  if (cursor !== undefined && /\b(this|that|it)\b/.test(p) && !/\b(resume|r[e\u00e9]sum[e\u00e9]|cv|everything|whole|entire|document|overall|all (my |of my |the )?(bullets|roles|jobs|sections|experience)|every (bullet|role|job)|one[- ]page|pages?)\b/.test(p)) {
    const b = bulletAt(idx, cursor)
    if (b && (b.marker || b.role)) return bulletTarget(idx, b)
    const r = roleAt(idx, cursor)
    if (r) return roleTarget(idx, r)
  }

  // 2f. whole-document words
  if (/\b(resume|r[eé]sum[eé]|cv|everything|whole|entire|document|overall|all (my |of my |the )?(bullets|roles|jobs|sections|experience)|every (bullet|role|job)|one[- ]page|pages?|criteria|ats|job (posting|description)|posting|keywords?)\b/.test(p)) {
    return documentTarget(text)
  }

  // 3. cursor
  if (cursor !== undefined) {
    const b = bulletAt(idx, cursor)
    if (b && (b.marker || b.role)) return bulletTarget(idx, b)
    const r = roleAt(idx, cursor)
    if (r) return roleTarget(idx, r)
    const s = idx.sections.find(x => cursor! >= x.headingFrom && cursor! <= x.headingTo)
    if (s) return sectionTarget(idx, s)
    if (b) return bulletTarget(idx, b)
  }

  // 4. document
  return documentTarget(text)
}

function bulletByContent(bullets: Bullet[], p: string, pWords: string[]): Bullet | undefined {
  const content = pWords.filter(w => w.length >= 4 && !STOP.has(w))
  if (!content.length) return undefined
  const scored = bullets.map(b => {
    const bw = words(b.text.toLowerCase())
    let hits = 0
    content.forEach(w => { if (bw.some(x => x === w || (w.length >= 5 && x.length >= 5 && (x.startsWith(w.slice(0, 5)) || lev(x, w) <= 1)))) hits++ })
    return { b, hits }
  }).filter(x => x.hits > 0)
  if (!scored.length) return undefined
  const top = Math.max.apply(null, scored.map(x => x.hits))
  const best = scored.filter(x => x.hits === top)
  return best.length === 1 ? best[0].b : undefined
}
