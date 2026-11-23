'use client'

import { useMemo } from 'react'
import type { Problem } from '../../../lib/resume'
import { countBySeverity } from '../../ide/analysis'

const LIMIT = 300
const ORDER: Array<Problem['severity']> = ['error', 'warning', 'info']
const TITLE: Record<Problem['severity'], string> = { error: 'Errors', warning: 'Warnings', info: 'Suggestions' }

function lineStarts(text: string): number[] {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1)
  return starts
}

function lineOf(starts: number[], offset: number): number {
  let lo = 0, hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo + 1
}

interface Props {
  problems: Problem[]
  text: string
  stale: boolean
  onJump(from: number, to: number): void
  onFix(p: Problem): void
  onFixAll(): void
}

export default function ProblemsTab({ problems, text, stale, onJump, onFix, onFixAll }: Props) {
  const starts = useMemo(() => lineStarts(text), [text])
  const counts = countBySeverity(problems)
  const fixable = problems.filter(p => p.fix).length
  let remaining = LIMIT

  return (
    <div className="ide-pad">
      <div className="ide-row">
        <p aria-live="polite" data-testid="ide-problem-summary">
          {problems.length === 0
            ? 'No problems found.'
            : `${counts.error} error${counts.error === 1 ? '' : 's'}, ${counts.warning} warning${counts.warning === 1 ? '' : 's'}, ${counts.info} suggestion${counts.info === 1 ? '' : 's'}.`}
        </p>
        <button type="button" className="btn-secondary ide-btn" onClick={onFixAll} disabled={fixable === 0 || stale} data-testid="ide-fix-all">
          Fix all ({fixable})
        </button>
      </div>
      <p className="muted ide-small">Fix all applies only the one-click fixes, in a single step you can undo with Ctrl/Cmd+Z. Other problems need your judgement.</p>
      {ORDER.map(sev => {
        const list = problems.filter(p => p.severity === sev)
        if (!list.length) return null
        const shown = list.slice(0, Math.max(0, remaining))
        remaining -= shown.length
        return (
          <section key={sev} aria-label={TITLE[sev]}>
            <h3 className="ide-h3">{TITLE[sev]} ({list.length})</h3>
            <ul className="ide-list">
              {shown.map((p, i) => (
                <li key={`${p.from}-${p.rule}-${i}`} className="ide-item">
                  <button type="button" className="ide-item-main" onClick={() => onJump(p.from, p.to)} data-testid="ide-problem">
                    <span className="ide-item-meta">Line {lineOf(starts, p.from)} · {p.rule}</span>
                    <span>{p.message}</span>
                  </button>
                  {p.fix && (
                    <button type="button" className="btn-secondary ide-btn ide-btn-sm" onClick={() => onFix(p)} disabled={stale} aria-label={`${p.fix.label}. Line ${lineOf(starts, p.from)}`}>
                      {p.fix.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {list.length > shown.length && <p className="muted ide-small">{list.length - shown.length} more not listed. Fix the ones above first.</p>}
          </section>
        )
      })}
    </div>
  )
}
