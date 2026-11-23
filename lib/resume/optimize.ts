import type { Keywords, OptimizationResult, Change } from './types'
import { ALIASES, DISPLAY } from './dictionary'
import { containsTerm, matchKeywords } from './keywords'
import { lineFixes } from './suggest'

const AMBIGUOUS = new Set(['node', 'node js', 'ml', 'oop', 'go', 'mongo'])

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
}

export function optimizeResume(content: string, keywords: Keywords): OptimizationResult {
  const changes: Change[] = []
  const wanted = [...keywords.essential, ...keywords.skills, ...keywords.preferred, ...keywords.industry]
  const wantedCanon = new Set(wanted.map(k => (ALIASES[k.toLowerCase()] || k.toLowerCase())))

  const out = (content || '').split(/\r?\n/).map(line => {
    let next = line
    const indent = line.match(/^\s*(?:[•●▪■◦○·*\-–—>]\s+)?/)?.[0] ?? ''
    const body = line.slice(indent.length)

    const fixed = lineFixes(body)
    if (fixed.text !== body) {
      changes.push({ original: body, replacement: fixed.text, explanation: fixed.reasons.join(' ') })
      next = indent + fixed.text
    }

    for (const [alias, canon] of Object.entries(ALIASES)) {
      if (!wantedCanon.has(canon)) continue
      const full = DISPLAY[canon] || canon
      if (alias.length < 2 || AMBIGUOUS.has(alias)) continue
      if (containsTerm(next, canon) && new RegExp(`(?<![A-Za-z0-9.])${escapeRe(full)}(?![A-Za-z0-9])`, 'i').test(next)) continue
      const re = new RegExp(`(?<![A-Za-z0-9.+#])${escapeRe(alias)}(?![A-Za-z0-9+#]|\\.[A-Za-z0-9])`, 'gi')
      if (re.test(next) && alias.toLowerCase() !== canon) {
        const replaced = next.replace(re, full)
        changes.push({
          original: next.trim(),
          replacement: replaced.trim(),
          explanation: `The job posting says "${full}"; spelled out so keyword matching finds it.`,
        })
        next = replaced
      }
    }
    return next
  })

  const optimized = out.join('\n')
  const match = matchKeywords(optimized, keywords)
  return { optimized, changes, missing: match.missing, matched: match.matched }
}
