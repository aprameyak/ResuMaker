import type { ParsedResume, Education, Experience, Project } from './types'

const SECTION_ALIASES: Record<string, string[]> = {
  summary: ['summary', 'professional summary', 'profile', 'objective', 'career objective', 'about', 'about me'],
  education: ['education', 'academic background', 'academics', 'education and training', 'education & training'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'relevant experience', 'internships', 'clinical experience', 'clinical rotations', 'volunteer experience', 'research experience', 'teaching experience', 'leadership experience', 'internship experience', 'professional background'],
  skills: ['skills', 'technical skills', 'core competencies', 'competencies', 'technologies', 'skills and tools', 'skills & tools', 'key skills', 'technical proficiencies', 'core skills'],
  projects: ['projects', 'personal projects', 'selected projects', 'academic projects', 'side projects', 'key projects'],
}

const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?'
const DATE_PART = `(?:${MONTH}\\s+\\d{4}|\\d{1,2}\\/\\d{4}|(?:spring|summer|fall|winter)\\s+\\d{4}|\\d{4})`
export const DATE_RANGE = new RegExp(`(${DATE_PART})\\s*(?:-|–|—|to)\\s*(${DATE_PART}|present|current|now|ongoing)`, 'i')
const SINGLE_DATE = new RegExp(`\\b${DATE_PART}\\b`, 'i')
export const BULLET = /^\s*(?:[•●▪■◦○·*\-–—>►✓✔➢➤➔‣∙⁃◆❖▶✦]|\d+[.)])\s+/
const GPA = /\bgpa\s*[:\-]?\s*(\d(?:\.\d{1,2})?)(?:\s*\/\s*\d(?:\.\d)?)?/i
const TITLE_WORDS = /\b(engineer|developer|intern|manager|analyst|designer|scientist|consultant|director|lead|architect|assistant|associate|coordinator|specialist|researcher|administrator|technician|officer|founder|co-founder|ta|instructor|tutor|president|head|programmer|fellow|cashier|server|barista|clerk|representative|driver|cook|volunteer|waiter|receptionist|supervisor|teller|tutor|trainer|nurse|mechanic|sales|agent)\b/i
const SCHOOL_WORDS = /\b(university|college|institute|school|academy|polytechnic)\b/i
const DEGREE = /\b(b\.?\s?s\.?c?\.?|m\.?\s?s\.?c?\.?|b\.?a\.?|m\.?a\.?|m\.?b\.?a\.?|ph\.?d\.?|bachelor(?:'s)?|master(?:'s)?|associate(?:'s)?|doctorate|b\.?eng|m\.?eng|b\.?tech|m\.?tech)\b(?:\s+of\s+(?:science|arts|engineering|business administration|fine arts|technology))?/i
const SOFT_SKILLS = new Set([
  'leadership', 'communication', 'teamwork', 'collaboration', 'problem solving', 'problem-solving', 'time management',
  'adaptability', 'creativity', 'critical thinking', 'mentoring', 'public speaking', 'project management',
  'organization', 'negotiation', 'customer service', 'customer support', 'teamwork', 'multitasking', 'attention to detail', 'work ethic', 'conflict resolution', 'decision making',
])

function normalizeHeading(line: string): string {
  return line.toLowerCase().replace(/[:：]+\s*$/, '').replace(/[^a-z&\s]/g, '').replace(/\s+/g, ' ').trim()
}

export function headingFor(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 45 || BULLET.test(trimmed)) return null
  const key = normalizeHeading(trimmed)
  for (const [section, names] of Object.entries(SECTION_ALIASES)) {
    if (names.includes(key)) return section
  }
  return null
}


// An all-caps line that is not a known section name (CERTIFICATIONS, AWARDS, LANGUAGES ...) still ends the
// current section. It must stand alone: blank line (or start) before it, short, and not followed by a role header.
const ALL_CAPS = new RegExp("^[\\p{Lu}][\\p{Lu}\\s&/,'’-]*$", 'u')
const LETTER_G = new RegExp('\\p{L}', 'gu')
export function isUnknownHeading(lines: string[], i: number): boolean {
  const t = (lines[i] || '').trim().replace(/[:：]+$/, '').trim()
  if (!t || t.length > 40 || BULLET.test(t) || headingFor(t)) return false
  if (!ALL_CAPS.test(t) || (t.match(LETTER_G) || []).length < 3) return false
  if (isHeaderCandidate(t)) return false
  if (i > 0 && (lines[i - 1] || '').trim()) return false
  for (let j = i + 1; j < lines.length; j++) {
    const n = (lines[j] || '').trim()
    if (!n) continue
    return BULLET.test(n) || !isHeaderCandidate(n)
  }
  return true
}

function cleanLine(line: string): string {
  return line.replace(/ /g, ' ').replace(/[​‌‍﻿]/g, '').replace(/\t/g, '  ').replace(/\s+$/g, '')
}

function splitSections(text: string): Record<string, string[]> {
  const sections: Record<string, string[]> = { header: [] }
  let current = 'header'
  const rawLines = text.split(/\r?\n/)
  for (let i = 0; i < rawLines.length; i++) {
    const line = cleanLine(rawLines[i])
    const heading = headingFor(line)
    if (!heading && current !== 'header' && isUnknownHeading(rawLines, i)) {
      current = 'other'
      if (!sections[current]) sections[current] = []
      continue
    }
    if (heading) {
      current = heading
      if (!sections[current]) sections[current] = []
      continue
    }
    const inline = line.match(/^\s*([A-Za-z &]{3,30}?)\s*:\s*(\S.*)$/)
    if (inline) {
      const inlineHeading = headingFor(inline[1])
      if (inlineHeading) {
        current = inlineHeading
        if (!sections[current]) sections[current] = []
        sections[current].push(inline[2])
        continue
      }
    }
    if (!sections[current]) sections[current] = []
    sections[current].push(line)
  }
  return sections
}

function extractDates(line: string): { dates: string; rest: string } {
  const range = line.match(DATE_RANGE)
  if (range) {
    return { dates: `${range[1].trim()} - ${range[2].trim()}`, rest: line.replace(range[0], ' ') }
  }
  const single = line.match(SINGLE_DATE)
  if (single) return { dates: single[0].trim(), rest: line.replace(single[0], ' ') }
  return { dates: '', rest: line }
}

function splitParts(text: string): string[] {
  return text
    .replace(/[()]/g, ' ')
    .split(/\s+(?:\||—|–|-|@|at)\s+|\s*\|\s*|\s{3,}|,\s+(?=[A-Z])/)
    .map(p => p.replace(/^[\s,\-–—|]+|[\s,\-–—|]+$/g, ''))
    .filter(Boolean)
}

function isBulletLine(line: string): boolean {
  return BULLET.test(line)
}

function stripBullet(line: string): string {
  return line.replace(BULLET, '').trim()
}

function collectBullets(lines: string[]): string[] {
  const out: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (isBulletLine(t)) {
      out.push(stripBullet(t))
    } else if (out.length && /^[a-z(]/.test(t)) {
      out[out.length - 1] += ' ' + t
    } else if (out.length && !/[.!?]$/.test(out[out.length - 1]) && t.length < 120) {
      out[out.length - 1] += ' ' + t
    } else {
      out.push(t)
    }
  }
  return out
}

function parseEducation(lines: string[]): Education[] {
  const entries: Education[] = []
  let current: Education | null = null
  const push = () => {
    if (current && (current.institution || current.degree)) entries.push(current)
    current = null
  }

  for (const line of lines) {
    const t = stripBullet(line.trim())
    if (!t) continue
    const { dates, rest } = extractDates(t)
    const gpa = t.match(GPA)
    const hasSchool = SCHOOL_WORDS.test(rest)
    const degree = rest.match(DEGREE)

    if (hasSchool && (!current || current.institution)) {
      push()
      current = { institution: '', degree: '', field: '', dates: '' }
    }
    if (!current) current = { institution: '', degree: '', field: '', dates: '' }

    if (dates && !current.dates) current.dates = dates
    if (gpa && !current.gpa) current.gpa = gpa[1]

    const cleaned = rest.replace(GPA, ' ')
    if (hasSchool && !current.institution) {
      const parts = splitParts(cleaned)
      const school = parts.find(p => SCHOOL_WORDS.test(p)) || parts[0] || ''
      current.institution = school
      const remainder = parts.filter(p => p !== school).join(', ')
      if (remainder && !current.degree) assignDegree(current, remainder)
    } else if (degree && !current.degree) {
      assignDegree(current, cleaned)
    } else if (!current.institution && cleaned.trim()) {
      current.institution = splitParts(cleaned)[0] || cleaned.trim()
    }
  }
  push()
  return entries
}

function assignDegree(entry: Education, text: string) {
  const match = text.match(DEGREE)
  if (!match) return
  const end = (match.index ?? 0) + match[0].length
  entry.degree = match[0].trim() + (text[end] === '.' && /[A-Za-z]$/.test(match[0]) && /^[A-Z]\.?[A-Za-z]?$/.test(match[0].replace(/\./g, '').slice(0, 1) + '') ? '.' : '')
  const after = text
    .slice(end)
    .replace(/^[.\s,:\-–—]+/, '')
    .replace(/^(?:in|of)\s+/i, '')
  const field = after.split(/[|,(]/)[0].replace(/\s+/g, ' ').trim()
  if (field && /^[A-Za-z][A-Za-z&\s]+$/.test(field) && field.split(' ').length <= 6) entry.field = field
}

interface RawEntry {
  header: string[]
  body: string[]
}

export function isHeaderCandidate(t: string): boolean {
  if (isBulletLine(t) || t.length > 100 || /[.!?]$/.test(t)) return false
  if (DATE_RANGE.test(t)) return true
  if (SINGLE_DATE.test(t) && t.length < 80) return true
  return TITLE_WORDS.test(t) && t.split(/\s+/).length <= 10
}

function finishEntry(raw: RawEntry): Experience {
  const joined = raw.header.join('   ')
  const { dates, rest } = extractDates(joined)
  const parts = splitParts(rest)
  let position = ''
  let company = ''
  for (const part of parts) {
    if (!position && TITLE_WORDS.test(part)) position = part
    else if (!company) company = part
  }
  if (!position && !company && parts[0]) company = parts[0]
  return { company, position, dates, responsibilities: collectBullets(raw.body) }
}

function headerComplete(header: string[]): boolean {
  if (header.length >= 3) return true
  const e = finishEntry({ header, body: [] })
  return Boolean(e.dates && e.position && e.company)
}

function parseExperience(lines: string[]): Experience[] {
  const raws: RawEntry[] = []
  let current: RawEntry | null = null
  const items = lines.map(l => l.trim()).filter(Boolean)

  items.forEach((t, i) => {
    const next = items[i + 1]
    const nameBeforeHeader =
      !isBulletLine(t) && t.length < 60 && !/[.!?,;:]$/.test(t) && /^[A-Z0-9]/.test(t) &&
      next !== undefined && isHeaderCandidate(next) && !isHeaderCandidate(t) &&
      (!current || current.body.length > 0 || headerComplete(current.header))

    if (isHeaderCandidate(t) || nameBeforeHeader) {
      if (current && !current.body.length && !headerComplete(current.header)) {
        current.header.push(t)
      } else {
        current = { header: [t], body: [] }
        raws.push(current)
      }
      return
    }

    if (!current) {
      current = { header: [t], body: [] }
      raws.push(current)
    } else {
      current.body.push(t)
    }
  })
  return raws.map(finishEntry).filter(e => e.company || e.position || e.responsibilities.length)
}

function parseSkills(lines: string[]): { technical: string[]; soft: string[] } {
  const technical: string[] = []
  const soft: string[] = []
  const seen = new Set<string>()
  const add = (skill: string, forceSoft: boolean) => {
    const s = skill.replace(/^[\s•\-*]+|[\s.]+$/g, '').trim()
    if (!s || s.length > 50) return
    const key = s.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    ;(forceSoft || SOFT_SKILLS.has(key) ? soft : technical).push(s)
  }

  for (const line of lines) {
    const t = stripBullet(line.trim())
    if (!t) continue
    const labelMatch = t.match(/^([A-Za-z][A-Za-z &/+\-]{1,40}):\s*(.+)$/)
    const label = labelMatch ? labelMatch[1].toLowerCase() : ''
    const body = labelMatch ? labelMatch[2] : t
    const labelIsSoft = /soft|interpersonal|personal/.test(label)
    for (const item of body.split(/[,;|•·]|\s{3,}/)) add(item, labelIsSoft)
  }
  return { technical, soft }
}

function parseProjects(lines: string[]): Project[] {
  const projects: Project[] = []
  let current: Project | null = null
  const desc: string[] = []

  const flush = () => {
    if (current) {
      current.description = desc.splice(0).join(' ').replace(/\s+/g, ' ').trim()
      projects.push(current)
    }
    current = null
    desc.length = 0
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (!isBulletLine(t) && (!current || (desc.length > 0 && t.length < 90 && /^[A-Z0-9]/.test(t) && !/[.]$/.test(t)))) {
      flush()
      const { rest } = extractDates(t)
      const techMatch = rest.match(/\(([^)]+)\)\s*$/) || rest.match(/\s[|–—-]\s(.+)$/)
      const name = rest.replace(/\(([^)]+)\)\s*$/, '').split(/\s+[|–—-]\s+/)[0].trim()
      current = { name, description: '', technologies: [] }
      if (techMatch) current.technologies = techMatch[1].split(/[,;|]/).map(s => s.trim()).filter(Boolean)
      continue
    }
    const text = stripBullet(t)
    const tech = text.match(/^(?:tech(?:nologies)?|built with|stack|tools)\s*[:\-]\s*(.+)$/i)
    if (current && tech) {
      current.technologies = tech[1].split(/[,;|]/).map(s => s.trim()).filter(Boolean)
    } else if (current) {
      desc.push(text)
    }
  }
  flush()
  return projects
}

export function parseResume(text: string): ParsedResume {
  const input = (text || '').slice(0, 200_000)
  const sections = splitSections(input)
  const summaryLines = sections.summary || []
  const headerLines = sections.header || []

  const summary = summaryLines.map(l => l.trim()).filter(Boolean).join(' ')

  return {
    summary: summary || '',
    education: parseEducation(sections.education || []),
    experience: parseExperience(sections.experience || []),
    skills: parseSkills(sections.skills || []),
    projects: parseProjects(sections.projects || []),
  }
}

export interface ResumeHeader {
  name: string
  contact: string[]
}

export function parseHeader(text: string): ResumeHeader {
  const lines: string[] = []
  for (const raw of (text || '').slice(0, 200_000).split(/\r?\n/)) {
    const line = cleanLine(raw).trim()
    if (headingFor(line) || /^\s*[A-Za-z &]{3,30}?\s*:\s*\S/.test(line) && headingFor(line.split(':')[0])) break
    if (line) lines.push(line)
    if (lines.length >= 4) break
  }
  const [name = '', ...rest] = lines
  const contact = rest.flatMap(l => l.split(/\s*[|•·]\s*|\s{3,}/)).map(c => c.trim()).filter(Boolean)
  return { name, contact }
}
