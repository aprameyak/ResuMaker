import { BULLET, DATE_RANGE, headingFor, isHeaderCandidate } from './parse'
import { BRAND_FIXES, GERUNDS } from './dictionary'

export type Severity = 'error' | 'warning' | 'info'

export interface Fix {
  from: number
  to: number
  insert: string
  label: string
}

export interface Problem {
  from: number
  to: number
  severity: Severity
  rule: string
  message: string
  fix?: Fix
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const WEAK = /^(worked on|worked with|helped|assisted|duties included|tasks included|in charge of|involved in|participated in)\b/i
const PASSIVE = /\b(?:was|were|been|being)\s+\w+ed\b/i
const EMAIL = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,}/
const LONG_BULLET = 200

function monthIndex(part: string): number | null {
  if (/\b(?:spring|summer|fall|autumn|winter)\b/i.test(part)) return null
  const year = part.match(/\b(\d{4})\b/)
  if (!year) return null
  const named = part.match(/[A-Za-z]{3,}/)
  const numeric = part.match(/^(\d{1,2})\//)
  const month = named ? MONTHS[named[0].slice(0, 3).toLowerCase()] : numeric ? Number(numeric[1]) : 1
  return Number(year[1]) * 12 + (month || 1)
}

function firstWord(text: string): string {
  return (text.match(/^[A-Za-z]+/)?.[0] ?? '').toLowerCase()
}

export function lintResume(text: string, now = new Date()): Problem[] {
  const problems: Problem[] = []
  const source = text || ''
  const lines = source.split('\n')
  const nowIndex = now.getFullYear() * 12 + now.getMonth() + 1

  let offset = 0
  let section = 'header'
  let seenHeading = false
  const present = new Set<string>()
  let headerText = ''

  interface Role { start: number; end: number; bullets: Array<{ from: number; to: number; body: string }> }
  let role: Role | null = null

  const closeRole = () => {
    if (!role) return
    const r: Role = role
    if (r.bullets.length === 1) {
      problems.push({ from: r.start, to: r.end, severity: 'info', rule: 'few-bullets', message: 'Only one bullet for this role. Two to five is typical.' })
    } else if (r.bullets.length > 7) {
      problems.push({ from: r.start, to: r.end, severity: 'info', rule: 'many-bullets', message: `${r.bullets.length} bullets. Past about six, readers skim. Keep the strongest.` })
    }
    if (r.bullets.length >= 2 && !r.bullets.some(b => /\d/.test(b.body))) {
      problems.push({ from: r.start, to: r.end, severity: 'info', rule: 'no-numbers', message: 'No numbers in any bullet for this role. Add scale or impact (users, %, time, money) where it is true.' })
    }
    const seen = new Map<string, number>()
    for (const b of r.bullets) {
      const w = firstWord(b.body)
      if (w.length < 3) continue
      if (seen.has(w)) {
        problems.push({ from: b.from, to: b.from + w.length, severity: 'info', rule: 'repeated-verb', message: `"${b.body.split(/\s/)[0]}" already starts another bullet in this role. Vary the opening verb.` })
      }
      seen.set(w, (seen.get(w) || 0) + 1)
    }
    role = null
  }

  lines.forEach((line, index) => {
    const lineStart = offset
    const lineEnd = lineStart + line.length
    offset += line.length + 1
    const trimmed = line.trim()
    if (!trimmed) return

    const heading = headingFor(trimmed)
    if (heading) {
      closeRole()
      section = heading
      seenHeading = true
      present.add(heading)
      return
    }
    if (!seenHeading) {
      headerText += line + '\n'
      return
    }

    const bullet = line.match(BULLET)
    const isRoleSection = section === 'experience' || section === 'projects'

    if (!bullet) {
      if (section === 'experience' && isHeaderCandidate(trimmed)) {
        const range = line.match(DATE_RANGE)
        if (range) {
          const start = monthIndex(range[1])
          const endPart = range[2]
          const end = /present|current|now|ongoing/i.test(endPart) ? nowIndex : monthIndex(endPart)
          const at = lineStart + (range.index ?? 0)
          const presentEnd = /present|current|now|ongoing/i.test(endPart)
          if (start !== null && end !== null && end < start && !presentEnd) {
            problems.push({ from: at, to: at + range[0].length, severity: 'error', rule: 'date-order', message: 'The end date is before the start date.' })
          } else if (start !== null && start > nowIndex + 12) {
            problems.push({ from: at, to: at + range[0].length, severity: 'warning', rule: 'future-start', message: 'This start date is more than a year away. Is it a typo?' })
          }
        }
        if (!role || role.bullets.length) {
          closeRole()
          role = { start: lineStart + (line.length - line.trimStart().length), end: lineEnd, bullets: [] }
        }
      }
      if (isRoleSection) return
      return
    }

    const bodyStart = lineStart + bullet[0].length
    const body = line.slice(bullet[0].length).trimEnd()
    if (!body) return
    const bodyEnd = bodyStart + body.length
    if (role && section === 'experience') role.bullets.push({ from: bodyStart, to: bodyEnd, body })

    const resp = body.match(/^responsible for\s+(\w+ing)\b/i)
    if (resp) {
      const past = GERUNDS[resp[1].toLowerCase()]
      problems.push({
        from: bodyStart, to: bodyStart + resp[0].length, severity: 'warning', rule: 'responsible-for',
        message: '"Responsible for" describes a duty. Lead with what you did.',
        fix: past ? { from: bodyStart, to: bodyStart + resp[0].length, insert: past, label: `Change to "${past}"` } : undefined,
      })
    } else if (WEAK.test(body)) {
      const m = body.match(WEAK)!
      problems.push({ from: bodyStart, to: bodyStart + m[0].length, severity: 'warning', rule: 'weak-opener', message: `"${m[0]}" hides your contribution. Say what you did and the result.` })
    }

    const first = body.match(/^(?:i|i've|i'm|my)\s+(\S)/i)
    if (first) {
      problems.push({
        from: bodyStart, to: bodyStart + first[0].length, severity: 'warning', rule: 'first-person',
        message: 'Resumes drop first-person pronouns.',
        fix: { from: bodyStart, to: bodyStart + first[0].length, insert: first[1].toUpperCase(), label: 'Remove pronoun' },
      })
    }

    const passive = body.match(PASSIVE)
    if (passive && passive.index !== undefined) {
      problems.push({ from: bodyStart + passive.index, to: bodyStart + passive.index + passive[0].length, severity: 'info', rule: 'passive', message: 'Passive voice. Rewrite so you are the one acting.' })
    }

    if (body.length > LONG_BULLET) {
      problems.push({ from: bodyStart, to: bodyEnd, severity: 'warning', rule: 'long-bullet', message: `${body.length} characters. Bullets past two lines get skimmed. Split or trim.` })
    }

    for (const m of Array.from(body.matchAll(/\b(\w+)\s+\1\b/gi))) {
      if (/^\d+$/.test(m[1]) || m[1].toLowerCase() === 'had') continue
      const at = bodyStart + (m.index ?? 0)
      problems.push({ from: at, to: at + m[0].length, severity: 'warning', rule: 'repeated-word', message: `"${m[1]}" is repeated.`, fix: { from: at, to: at + m[0].length, insert: m[1], label: 'Remove duplicate' } })
    }

    for (const m of Array.from(body.matchAll(/\S {2,}\S/g))) {
      const at = bodyStart + (m.index ?? 0) + 1
      problems.push({ from: at, to: at + m[0].length - 2, severity: 'info', rule: 'extra-space', message: 'Extra spaces.', fix: { from: at, to: at + m[0].length - 2, insert: ' ', label: 'Use one space' } })
    }

    for (const [re, correct] of BRAND_FIXES) {
      for (const m of Array.from(body.matchAll(new RegExp(re.source, 'g')))) {
        if (m[0] === correct) continue
        const at = bodyStart + (m.index ?? 0)
        problems.push({ from: at, to: at + m[0].length, severity: 'warning', rule: 'capitalization', message: `Write "${correct}".`, fix: { from: at, to: at + m[0].length, insert: correct, label: `Change to "${correct}"` } })
      }
    }
  })
  closeRole()

  if (source.trim()) {
    const firstLineEnd = Math.max(1, lines[0]?.length ?? 1)
    if (!headerText.includes('@') || !EMAIL.test(headerText)) {
      problems.push({ from: 0, to: firstLineEnd, severity: 'warning', rule: 'no-email', message: 'No email address found in the header.' })
    }
    for (const needed of ['experience', 'education', 'skills']) {
      if (seenHeading && !present.has(needed)) {
        problems.push({ from: 0, to: firstLineEnd, severity: 'info', rule: 'missing-section', message: `No ${needed[0].toUpperCase()}${needed.slice(1)} section found.` })
      }
    }
    if (!seenHeading) {
      problems.push({ from: 0, to: firstLineEnd, severity: 'info', rule: 'no-sections', message: 'No section headings found (Experience, Education, Skills). Without them the preview and ATS cannot tell sections apart.' })
    }
  }

  return problems.sort((a, b) => a.from - b.from || a.to - b.to)
}

export function applyFixes(text: string, problems: Problem[]): string {
  const fixes = problems.map(p => p.fix).filter((f): f is Fix => Boolean(f)).sort((a, b) => a.from - b.from)
  const chosen: Fix[] = []
  let lastEnd = -1
  for (const f of fixes) {
    if (f.from < lastEnd) continue
    chosen.push(f)
    lastEnd = f.to
  }
  let out = text
  for (const f of chosen.reverse()) out = out.slice(0, f.from) + f.insert + out.slice(f.to)
  return out
}
