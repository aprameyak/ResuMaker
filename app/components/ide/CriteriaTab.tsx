'use client'

import { useId } from 'react'
import type { CriteriaReport, CriteriaParseError, CriterionResult } from '../../../lib/resume'
import { CRITERIA_PRESETS } from '../../../lib/resume'

interface Props {
  text: string
  onText(v: string): void
  preset: string
  onPreset(key: string): void
  canUndoPreset: boolean
  onUndoPreset(): void
  errors: CriteriaParseError[]
  report: CriteriaReport | null
  pages: number
  onShow(r: CriterionResult): void
}

export default function CriteriaTab({ text, onText, preset, onPreset, canUndoPreset, onUndoPreset, errors, report, pages, onShow }: Props) {
  const id = useId()
  return (
    <div className="ide-pad">
      <p className="muted ide-small">
        Write your own rules, one per line (for example <code>max pages: 1</code> or <code>must not include: references</code>).
        They are checked against the text with fixed rules. Nothing is sent anywhere.
      </p>
      <div className="ide-row">
        <label htmlFor={`${id}-preset`} className="label ide-label-inline">Preset</label>
        <select id={`${id}-preset`} className="input ide-select" value={preset} onChange={e => onPreset(e.target.value)} data-testid="ide-preset">
          <option value="">Custom (your text)</option>
          {Object.keys(CRITERIA_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        {canUndoPreset && <button type="button" className="link ide-small" onClick={onUndoPreset}>Undo preset</button>}
      </div>
      <label htmlFor={`${id}-text`} className="label">Criteria</label>
      <textarea
        id={`${id}-text`}
        className="input ide-mono"
        rows={7}
        value={text}
        spellCheck={false}
        onChange={e => onText(e.target.value)}
        aria-describedby={errors.length ? `${id}-errs` : undefined}
        aria-invalid={errors.length > 0}
        data-testid="ide-criteria-text"
      />
      {errors.length > 0 && (
        <ul id={`${id}-errs`} className="ide-errors" role="alert" data-testid="ide-criteria-errors">
          {errors.map((e, i) => <li key={i}>Line {e.line}: {e.message}</li>)}
        </ul>
      )}
      <h3 className="ide-h3">Results</h3>
      {!report ? <p className="muted">No valid criteria yet.</p> : (
        <>
          <p data-testid="ide-criteria-score">Score {report.score}. {report.passed} of {report.total} pass. Measured length: {pages} {pages === 1 ? 'page' : 'pages'}.</p>
          <ul className="ide-list" data-testid="ide-criteria-results">
            {report.results.map(r => (
              <li key={r.criterion.id} className="ide-item">
                <div className="ide-item-main ide-item-static">
                  <span className="ide-item-meta"><strong>{r.pass ? 'Pass' : 'Fail'}</strong> · {r.criterion.text}</span>
                  <span>{r.detail}</span>
                </div>
                {!r.pass && r.locations.length > 0 && (
                  <button type="button" className="btn-secondary ide-btn ide-btn-sm" onClick={() => onShow(r)} data-testid="ide-criteria-show">
                    Show {r.locations.length} place{r.locations.length === 1 ? '' : 's'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
