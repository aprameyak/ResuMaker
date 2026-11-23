'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { runAssistant } from '../../../lib/resume'
import type { AssistantResult } from '../../../lib/resume'
import { getModel } from '../../ide/model'
import { checkProposal } from '../../ide/proposals'
import type { Check, RangeProposal } from '../../ide/proposals'
import { pushPrompt, stepHistory } from '../../ide/state'
import DiffView from './DiffView'
import type { Range } from './Editor'

const EXAMPLES = ['fix everything', 'does it pass my criteria', 'add numbers', 'tailor to the job', 'make this stronger']

const STATUS_LABEL: Record<AssistantResult['status'], string> = {
  proposal: 'Proposal',
  'needs-info': 'Needs more information',
  refused: 'Refused (outside resume editing)',
  report: 'Report',
  failed: 'No change made',
  unchanged: 'Nothing to change',
}

interface Props {
  getDoc(): { text: string; selection?: { from: number; to: number }; cursor?: number }
  liveText: string
  jobText: string
  criteriaText: string
  prompts: string[]
  onPrompts(list: string[]): void
  onApply(p: RangeProposal): Check
  onHighlight(ranges: Range[]): void
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
function asArray(v: unknown): unknown[] { return Array.isArray(v) ? v : [] }
function str(v: unknown): string { return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '' }

function ReportView({ report }: { report: unknown }) {
  const r = asRecord(report)
  if (!r) return null
  const lint = asRecord(r.lint)
  const crit = asRecord(r.criteria)
  const problems = asArray(r.problems)
  const matched = asArray(r.matched)
  const missing = asArray(r.missing)
  const aliases = asArray(r.aliasSpellings)
  const unmet = asArray(r.unmet)
  const stats = asRecord(r.stats)
  return (
    <div className="ide-report" data-testid="ide-assistant-report">
      {lint && (
        <>
          <h4 className="ide-h4">Built-in checks</h4>
          <p>{str(lint.errors)} error(s), {str(lint.warnings)} warning(s), {str(lint.info)} suggestion(s).</p>
          {asArray(lint.problems).length > 0 && (
            <ul className="ide-list-plain">{asArray(lint.problems).map((p, i) => { const x = asRecord(p); return x ? <li key={i}>{str(x.message)}{x.text ? ` ("${str(x.text)}")` : ''}</li> : null })}</ul>
          )}
        </>
      )}
      {stats && <p className="muted ide-small">{str(stats.words)} words, {str(stats.lines)} lines.</p>}
      {crit && (
        <>
          <h4 className="ide-h4">Your criteria</h4>
          {crit.score !== undefined && <p>Score {str(crit.score)}. {str(crit.passed)} of {str(crit.total)} pass.</p>}
          {asArray(crit.results).length > 0 && (
            <ul className="ide-list-plain">{asArray(crit.results).map((x, i) => { const y = asRecord(x); return y ? <li key={i}><strong>{y.pass ? 'Pass' : 'Fail'}</strong> {str(y.text)}: {str(y.detail)}</li> : null })}</ul>
          )}
          {asArray(crit.parseErrors).length > 0 && (
            <ul className="ide-list-plain">{asArray(crit.parseErrors).map((x, i) => { const y = asRecord(x); return y ? <li key={i}>Line {str(y.line)}: {str(y.message)}</li> : null })}</ul>
          )}
        </>
      )}
      {r.coverage !== undefined && <p>Keyword coverage: {str(r.coverage)}%.</p>}
      {matched.length > 0 && <p><strong>Found:</strong> {matched.map(str).join(', ')}</p>}
      {missing.length > 0 && <p><strong>Missing (add only if true for you):</strong> {missing.map(str).join(', ')}</p>}
      {aliases.length > 0 && (
        <>
          <h4 className="ide-h4">Wording the posting spells out</h4>
          <ul className="ide-list-plain">{aliases.map((a, i) => { const x = asRecord(a); return x ? <li key={i}>{str(x.before)} to {str(x.after)}</li> : null })}</ul>
        </>
      )}
      {str(r.note) && <p className="muted ide-small">{str(r.note)}</p>}
      {problems.length > 0 && (
        <ul className="ide-list-plain">{problems.map((p, i) => { const x = asRecord(p); return x ? <li key={i}>{str(x.message)}</li> : null })}</ul>
      )}
      {unmet.length > 0 && (
        <>
          <h4 className="ide-h4">Unmet checks</h4>
          <ul className="ide-list-plain">{unmet.map((u, i) => <li key={i}>{str(u)}</li>)}</ul>
        </>
      )}
    </div>
  )
}

export default function AssistantTab({ getDoc, liveText, jobText, criteriaText, prompts, onPrompts, onApply, onHighlight }: Props) {
  const id = useId()
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState('')
  const [histIdx, setHistIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [lastPrompt, setLastPrompt] = useState('')
  const [applied, setApplied] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const seq = useRef(0)
  const model = useMemo(() => getModel(), [])
  const highlight = useRef(onHighlight)
  highlight.current = onHighlight

  useEffect(() => () => highlight.current([]), [])

  const proposal = result?.proposal ?? null
  const check: Check | null = proposal ? checkProposal(liveText, proposal) : null

  const run = async (text: string) => {
    const p = text.trim()
    if (!p || running) return
    const mine = ++seq.current
    setRunning(true)
    setApplied('')
    setResult(null)
    onHighlight([])
    setLastPrompt(p)
    onPrompts(pushPrompt(prompts, p))
    setHistIdx(-1)
    let res: AssistantResult
    try {
      const doc = getDoc()
      res = await runAssistant({
        prompt: p,
        doc: { text: doc.text, selection: doc.selection, cursor: doc.cursor },
        jobDescription: jobText,
        criteriaText,
        model: model ?? undefined,
        maxIterations: 3,
      })
    } catch (e) {
      res = { status: 'failed', message: 'The assistant stopped unexpectedly. Nothing was changed.', trace: [{ step: 'error', ok: false, detail: e instanceof Error ? e.message : String(e) }] }
    }
    if (mine !== seq.current) return
    setResult(res)
    setAnswers(new Array(res.questions?.length ?? 0).fill(''))
    setRunning(false)
    if (res.proposal) onHighlight([{ from: res.proposal.from, to: res.proposal.to }])
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void run(prompt)
      return
    }
    const el = e.currentTarget
    if (e.key === 'ArrowUp' && el.selectionStart === el.selectionEnd && !el.value.slice(0, el.selectionStart).includes('\n') && prompts.length) {
      e.preventDefault()
      const next = stepHistory(histIdx, prompts.length, 'up')
      if (histIdx === -1) setDraft(prompt)
      setHistIdx(next)
      setPrompt(prompts[next])
    } else if (e.key === 'ArrowDown' && histIdx >= 0 && el.selectionStart === el.selectionEnd && !el.value.slice(el.selectionEnd).includes('\n')) {
      e.preventDefault()
      const next = stepHistory(histIdx, prompts.length, 'down')
      setHistIdx(next)
      setPrompt(next === -1 ? draft : prompts[next])
    }
  }

  const apply = () => {
    if (!proposal) return
    const r = onApply(proposal)
    if (r.ok) {
      setApplied('Applied. Undo with Ctrl/Cmd+Z in the editor.')
      setResult(prev => (prev ? { ...prev, proposal: undefined } : prev))
      onHighlight([])
    } else {
      setApplied(r.reason)
    }
  }

  const reject = () => {
    setResult(prev => (prev ? { ...prev, proposal: undefined } : prev))
    setApplied('Proposal rejected. Nothing was changed.')
    onHighlight([])
  }

  return (
    <div className="ide-pad">
      <p className="ide-honest" data-testid="ide-model-status">
        {model
          ? 'A language model is connected. Every rewrite is checked against your original facts and your criteria before you see it.'
          : 'No language model is connected. The assistant can run fixes, check your criteria, report keyword coverage, ask for real numbers, and refuse off-topic requests. It cannot reword or rewrite text yet. It only works on your resume and never changes it without your approval.'}
      </p>
      <label htmlFor={`${id}-prompt`} className="label">Ask about your resume</label>
      <textarea
        id={`${id}-prompt`}
        className="input"
        rows={2}
        value={prompt}
        onChange={e => { setPrompt(e.target.value); setHistIdx(-1) }}
        onKeyDown={onKey}
        placeholder='For example: "fix everything", "does it pass my criteria", "shorten my Acme job"'
        data-testid="ide-assistant-input"
      />
      <div className="ide-row">
        <button type="button" className="btn ide-btn" onClick={() => void run(prompt)} disabled={running || !prompt.trim()} data-testid="ide-assistant-run">
          {running ? 'Working' : 'Run'}
        </button>
        <span className="muted ide-small">Ctrl/Cmd+Enter to run. Up arrow recalls earlier prompts. Select text first to target it.</span>
      </div>
      <ul className="ide-chips ide-examples" aria-label="Example prompts">
        {EXAMPLES.map(x => <li key={x}><button type="button" className="ide-chip-btn" onClick={() => { setPrompt(x); void run(x) }}>{x}</button></li>)}
      </ul>

      <div role="status" aria-live="polite" aria-atomic="true" className="ide-live" data-testid="ide-assistant-status">
        {running && <p>Working on it.</p>}
        {result && (
          <>
            <p><strong>{STATUS_LABEL[result.status]}.</strong> <span data-testid="ide-assistant-message">{result.message}</span></p>
          </>
        )}
        {applied && <p data-testid="ide-assistant-applied">{applied}</p>}
      </div>

      {result && (
        <>
          {result.questions && result.questions.length > 0 && (
            <div data-testid="ide-assistant-questions">
              <h4 className="ide-h4">Questions</h4>
              <ol className="ide-list-plain">
                {result.questions.map((q, i) => (
                  <li key={i}>
                    <label htmlFor={`${id}-q${i}`}>{q}</label>
                    {model && <input id={`${id}-q${i}`} className="input" value={answers[i] ?? ''} onChange={e => setAnswers(a => a.map((x, j) => (j === i ? e.target.value : x)))} />}
                  </li>
                ))}
              </ol>
              {model ? (
                <button type="button" className="btn-secondary ide-btn" onClick={() => void run(`${lastPrompt}. ${answers.filter(a => a.trim()).join('. ')}`)} disabled={!answers.some(a => a.trim())}>Run again with these answers</button>
              ) : (
                <p className="muted ide-small">Without a connected model the assistant cannot work your answers into the wording. Edit the bullet by hand with the real figures.</p>
              )}
            </div>
          )}

          {result.report !== undefined && <ReportView report={result.report} />}

          {proposal && (
            <div className="ide-proposal" data-testid="ide-assistant-proposal">
              <h4 className="ide-h4">Proposed change (characters {proposal.from} to {proposal.to})</h4>
              <DiffView before={proposal.before} after={proposal.after} label="Proposed change" />
              {check && !check.ok && <p className="ide-warn" role="alert" data-testid="ide-stale">{check.reason}</p>}
              <div className="ide-row">
                <button type="button" className="btn ide-btn" onClick={apply} disabled={!check || !check.ok} data-testid="ide-assistant-apply">Apply</button>
                <button type="button" className="btn-secondary ide-btn" onClick={reject} data-testid="ide-assistant-reject">Reject</button>
              </div>
            </div>
          )}

          <h4 className="ide-h4">Pipeline</h4>
          <ol className="ide-trace" data-testid="ide-assistant-trace">
            {result.trace.map((t, i) => (
              <li key={i}><span className="ide-trace-step">{t.step}</span> <span className="ide-trace-ok">{t.ok ? 'ok' : 'flagged'}</span> <span className="ide-trace-detail">{t.detail}</span></li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
