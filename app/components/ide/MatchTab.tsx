'use client'

import { useId, useMemo, useState } from 'react'
import { matchKeywords } from '../../../lib/resume'
import { aliasProposal, checkProposal, keywordsFor } from '../../ide/proposals'
import type { AliasProposal, RangeProposal, Check } from '../../ide/proposals'
import DiffView from './DiffView'

interface Props {
  text: string
  liveText: string
  jobText: string
  onJobText(v: string): void
  onSample(): void
  onApply(p: RangeProposal): Check
}

export default function Match({ text, liveText, jobText, onJobText, onSample, onApply }: Props) {
  const id = useId()
  const [alias, setAlias] = useState<AliasProposal | null>(null)
  const [msg, setMsg] = useState('')

  const result = useMemo(() => {
    if (!jobText.trim()) return null
    try {
      const kws = keywordsFor(jobText)
      return { kws, match: matchKeywords(text, kws) }
    } catch { return null }
  }, [text, jobText])

  const propose = () => {
    if (!result) return
    setMsg('')
    const a = aliasProposal(liveText, result.kws)
    setAlias(a)
    if (!a.proposal) setMsg(a.skipped ? `No alias-only changes. ${a.skipped} line${a.skipped === 1 ? '' : 's'} also need style fixes; use the Problems tab.` : 'Nothing to spell out. Your wording already matches the posting where it can.')
  }

  const stale = alias?.proposal ? checkProposal(liveText, alias.proposal) : null

  return (
    <div className="ide-pad">
      <label htmlFor={`${id}-job`} className="label">Job posting</label>
      <textarea
        id={`${id}-job`}
        className="input ide-mono"
        rows={6}
        value={jobText}
        onChange={e => { onJobText(e.target.value); setAlias(null); setMsg('') }}
        placeholder="Paste the job posting here. It stays in this browser."
        data-testid="ide-job-text"
      />
      {!jobText.trim() && <p className="muted ide-small"><button type="button" className="link" onClick={onSample}>Use a sample posting</button> to see how matching works.</p>}

      {result && (
        <>
          <p className="ide-big" data-testid="ide-coverage" aria-live="polite">Keyword coverage: {result.match.coverage}%</p>
          <p className="muted ide-small">Coverage counts posting keywords your resume already contains, weighted by how central each is. It does not change your resume.</p>
          <div className="ide-two">
            <div>
              <h3 className="ide-h3">Found ({result.match.matched.length})</h3>
              <ul className="ide-chips" data-testid="ide-found">
                {result.match.matched.map(k => <li key={k}>{k}</li>)}
                {result.match.matched.length === 0 && <li className="muted">None</li>}
              </ul>
            </div>
            <div>
              <h3 className="ide-h3">Missing ({result.match.missing.length})</h3>
              <p className="ide-small"><strong>Add only if true for you.</strong> Nothing is inserted automatically.</p>
              <ul className="ide-chips" data-testid="ide-missing">
                {result.match.missing.map(k => <li key={k}>{k}</li>)}
                {result.match.missing.length === 0 && <li className="muted">None</li>}
              </ul>
            </div>
          </div>

          <h3 className="ide-h3">Spell out aliases</h3>
          <p className="muted ide-small">Rewrites short forms the posting spells out (for example JS to JavaScript) so keyword matching finds them. You review the diff first.</p>
          <button type="button" className="btn-secondary ide-btn" onClick={propose} data-testid="ide-alias-btn">Spell out aliases</button>
          {msg && <p className="ide-small" role="status">{msg}</p>}
          {alias?.proposal && (
            <div className="ide-proposal" data-testid="ide-alias-proposal">
              <p><strong>{alias.count} line{alias.count === 1 ? '' : 's'} would change.</strong></p>
              <ul className="ide-list-plain ide-small">{alias.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              {alias.skipped > 0 && <p className="muted ide-small">{alias.skipped} other line{alias.skipped === 1 ? '' : 's'} also need style fixes and were left out.</p>}
              <DiffView before={alias.proposal.before} after={alias.proposal.after} label="Alias changes" />
              {stale && !stale.ok && <p className="ide-warn" role="alert">{stale.reason}</p>}
              <div className="ide-row">
                <button type="button" className="btn ide-btn" disabled={!stale || !stale.ok} onClick={() => { const r = onApply(alias.proposal!); if (r.ok) { setAlias(null); setMsg('Applied. Undo with Ctrl/Cmd+Z in the editor.') } }} data-testid="ide-alias-apply">Apply</button>
                <button type="button" className="btn-secondary ide-btn" onClick={() => setAlias(null)}>Reject</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
