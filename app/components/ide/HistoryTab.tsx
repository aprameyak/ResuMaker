'use client'

import { useState } from 'react'
import type { Snapshot } from '../../ide/state'
import { describeSnapshot } from '../../ide/state'
import DiffView from './DiffView'

interface Props {
  snapshots: Snapshot[]
  liveText: string
  onSnapshot(): void
  onRestore(s: Snapshot): void
  notice: string
}

function when(t: number): string {
  try { return new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }) } catch { return String(t) }
}

export default function HistoryTab({ snapshots, liveText, onSnapshot, onRestore, notice }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const sel = snapshots.find(s => s.id === open) ?? null

  return (
    <div className="ide-pad">
      <div className="ide-row">
        <button type="button" className="btn-secondary ide-btn" onClick={onSnapshot} data-testid="ide-snapshot">Save snapshot</button>
        <span className="muted ide-small">Ctrl/Cmd+S also saves one. Snapshots are also taken automatically after larger edits. The 30 most recent are kept in this browser.</span>
      </div>
      <p className="ide-small" role="status" data-testid="ide-history-notice">{notice}</p>
      {snapshots.length === 0 ? <p className="muted">No snapshots yet.</p> : (
        <ul className="ide-list" data-testid="ide-history-list">
          {snapshots.map(s => {
            const d = describeSnapshot(s)
            return (
              <li key={s.id} className="ide-item">
                <div className="ide-item-main ide-item-static">
                  <span className="ide-item-meta">{when(s.t)} · {s.auto ? 'automatic' : 'manual'} · {d.size}</span>
                  <span>{d.first}</span>
                </div>
                <button type="button" className="btn-secondary ide-btn ide-btn-sm" aria-pressed={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)} data-testid="ide-history-compare">
                  {open === s.id ? 'Hide diff' : 'Diff'}
                </button>
                <button type="button" className="btn-secondary ide-btn ide-btn-sm" onClick={() => onRestore(s)} data-testid="ide-history-restore">Restore</button>
              </li>
            )
          })}
        </ul>
      )}
      {sel && (
        <div>
          <h3 className="ide-h3">Snapshot compared with the current text</h3>
          <p className="muted ide-small">Lines marked - are in the snapshot only; lines marked + are in the current text only.</p>
          <DiffView before={sel.text} after={liveText} label="Snapshot versus current" />
        </div>
      )}
    </div>
  )
}
