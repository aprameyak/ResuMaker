'use client'

import { memo } from 'react'
import { diffRows } from '../../ide/diff'

const MAX_ROWS = 400

/** Plain before/after line diff. Removed lines carry "-", added lines "+"; changed words are underlined. */
const DiffView = memo(function DiffView({ before, after, context = 2, label = 'Changes' }: { before: string; after: string; context?: number; label?: string }) {
  const { rows, coarse, stats } = diffRows(before, after)
  // keep changed rows and a little context around them
  const keep = new Array<boolean>(rows.length).fill(false)
  rows.forEach((r, i) => {
    if (r.type !== 'eq') for (let k = Math.max(0, i - context); k <= Math.min(rows.length - 1, i + context); k++) keep[k] = true
  })
  const out: Array<{ row: (typeof rows)[number] } | { gap: number }> = []
  let hidden = 0
  rows.forEach((r, i) => {
    if (keep[i]) {
      if (hidden) { out.push({ gap: hidden }); hidden = 0 }
      out.push({ row: r })
    } else hidden++
  })
  if (hidden) out.push({ gap: hidden })
  const shown = out.slice(0, MAX_ROWS)

  return (
    <div className="ide-diff" role="group" aria-label={label}>
      <p className="ide-diff-stats muted">
        {stats.added} added, {stats.removed} removed{coarse ? ' (document too large for a fine diff; showing the whole changed block)' : ''}
      </p>
      {stats.added === 0 && stats.removed === 0 ? <p className="muted">No differences.</p> : (
        <pre className="ide-diff-body">
          {shown.map((o, i) => {
            if ('gap' in o) return <div key={i} className="ide-diff-gap">{o.gap} unchanged line{o.gap === 1 ? '' : 's'}</div>
            const r = o.row
            const sign = r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '
            return (
              <div key={i} className={`ide-diff-row ide-diff-${r.type}`}>
                <span className="ide-diff-sign" aria-hidden="true">{sign}</span>
                <span className="ide-diff-text">
                  {r.type !== 'eq' && <span className="ide-sr">{r.type === 'add' ? 'Added: ' : 'Removed: '}</span>}
                  {r.segs ? r.segs.map((s, j) => (s.changed ? <mark key={j}>{s.text}</mark> : <span key={j}>{s.text}</span>)) : (r.text || ' ')}
                </span>
              </div>
            )
          })}
          {out.length > MAX_ROWS && <div className="ide-diff-gap">{out.length - MAX_ROWS} more rows not shown</div>}
        </pre>
      )}
    </div>
  )
})

export default DiffView
