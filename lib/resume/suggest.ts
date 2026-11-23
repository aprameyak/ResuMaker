import type { Suggestion } from './types'
import { BRAND_FIXES, GERUNDS } from './dictionary'

const WEAK_OPENERS: Array<[RegExp, string]> = [
  [/^(worked on|worked with)\b/i, 'Start with what you did and the result (e.g. built, shipped, reduced) instead of "worked on".'],
  [/^(helped|assisted)( to| with| in)?\b/i, 'Say what you personally did; "helped" hides your contribution.'],
  [/^(duties included|tasks included|in charge of)\b/i, 'Describe an accomplishment, not a duty.'],
  [/^(involved in|participated in)\b/i, 'Name your specific role instead of "involved in".'],
]

const FIRST_PERSON = /^(?:i|i've|i'm|my)\s+/i
const PASSIVE = /\b(?:was|were|been|being)\s+\w+ed\b/i
const NUMBER = /\d/

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[•●▪■◦○·*\-–—>]|\d+[.)])\s+/, '').trim()
}

export function lineFixes(line: string): { text: string; reasons: string[] } {
  let text = line
  const reasons: string[] = []

  const resp = text.match(/^responsible for\s+(\w+ing)\b/i)
  if (resp) {
    const past = GERUNDS[resp[1].toLowerCase()]
    if (past) {
      text = past + text.slice(resp[0].length)
      reasons.push('"Responsible for ..." is passive; lead with the action verb.')
    }
  }

  if (FIRST_PERSON.test(text)) {
    const stripped = text.replace(FIRST_PERSON, '')
    if (stripped) {
      text = capitalize(stripped)
      reasons.push('Resumes drop first-person pronouns.')
    }
  }

  const doubled = text.replace(/\b(\w+)\s+\1\b/gi, (m, w) => (/^\d+$/.test(w) || w.toLowerCase() === 'had' ? m : w))
  if (doubled !== text) {
    text = doubled
    reasons.push('Repeated word removed.')
  }

  const spaced = text.replace(/[ ]{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1')
  if (spaced !== text) {
    text = spaced
    reasons.push('Extra spacing cleaned up.')
  }

  let branded = text
  for (const [re, fix] of BRAND_FIXES) branded = branded.replace(re, fix)
  if (branded !== text) {
    text = branded
    reasons.push('Fixed capitalization of a technology name so ATS and recruiters recognize it.')
  }

  return { text, reasons }
}

export function analyzeContent(section: string, content: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lines = (content || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const bulletLines = lines.map(l => ({ raw: l, text: stripBullet(l) })).filter(l => l.text)
  let noMetric = 0

  for (const { raw, text } of bulletLines) {
    const fix = lineFixes(text)
    if (fix.text !== text) {
      suggestions.push({
        original: text,
        suggestion: fix.text,
        explanation: fix.reasons.join(' '),
        type: fix.reasons.some(r => /Repeated|spacing|capitalization/.test(r)) ? 'correction' : 'improvement',
      })
      continue
    }

    const isBullet = raw !== text || section === 'experience' || section === 'projects'
    if (!isBullet) continue

    const weak = WEAK_OPENERS.find(([re]) => re.test(text))
    if (weak) {
      suggestions.push({ original: text, suggestion: text, explanation: weak[1], type: 'improvement' })
      continue
    }

    if (PASSIVE.test(text)) {
      suggestions.push({
        original: text,
        suggestion: text,
        explanation: 'Passive voice. Rewrite so you are the one doing the action.',
        type: 'improvement',
      })
      continue
    }

    if (text.length > 220) {
      suggestions.push({
        original: text,
        suggestion: text,
        explanation: 'Over 220 characters. Bullets that wrap past two lines are skimmed; split it or cut detail.',
        type: 'enhancement',
      })
      continue
    }

    if (!NUMBER.test(text) && text.split(/\s+/).length >= 6) noMetric++
    if (!NUMBER.test(text) && text.split(/\s+/).length >= 6 && noMetric <= 2) {
      suggestions.push({
        original: text,
        suggestion: text,
        explanation: 'No number in this bullet. If you can honestly add scale or impact (users, %, time saved, dollars), it will land harder.',
        type: 'enhancement',
      })
    }
  }

  return suggestions.slice(0, 10)
}
