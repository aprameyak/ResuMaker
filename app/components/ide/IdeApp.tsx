'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { flushSync } from 'react-dom'
import { CRITERIA_PRESETS } from '../../../lib/resume'
import type { CriterionResult, Problem } from '../../../lib/resume'
import { extractFileText } from '../../../lib/resume/extract'
import PrintRoot from '../PrintRoot'
import Editor from './Editor'
import type { EditorHandle, EditorInfo } from './Editor'
import Preview, { ResumeDoc } from './Preview'
import Tabs from './Tabs'
import ProblemsTab from './ProblemsTab'
import CriteriaTab from './CriteriaTab'
import MatchTab from './MatchTab'
import AtsTab from './AtsTab'
import HistoryTab from './HistoryTab'
import AssistantTab from './AssistantTab'
import { useDebounced } from './hooks'
import {
  atsText, buildView, countBySeverity, evaluateSafe, maxPagesRule, parseCriteriaSafe, roundTrip, safeLint, toDiagnostics,
} from '../../ide/analysis'
import { pageCount, formatPages } from '../../ide/paging'
import { checkProposal, fixChanges, proposalChanges } from '../../ide/proposals'
import type { Check, RangeProposal } from '../../ide/proposals'
import { browserStore } from '../../ide/storage'
import {
  addSnapshot, DEFAULT_CRITERIA, fileBaseName, loadDoc, loadHistory, loadPrompts, loadSettings, saveDoc, saveHistory, savePrompts, saveSettings, shouldAutoSnapshot,
} from '../../ide/state'
import type { Settings, Snapshot } from '../../ide/state'
import { SAMPLE_JOB, SAMPLE_NAME, SAMPLE_TEXT } from '../../ide/sample'

type MobileView = 'editor' | 'preview' | 'panel'

export default function IdeApp() {
  const [store] = useState(() => browserStore())
  const [initial] = useState(() => loadDoc(store))
  const [name, setName] = useState(initial.doc.name)
  const [text, setText] = useState(initial.doc.text)
  const [settings, setSettings] = useState<Settings>(() => loadSettings(store))
  const [history, setHistory] = useState<Snapshot[]>(() => loadHistory(store))
  const [prompts, setPrompts] = useState<string[]>(() => loadPrompts(store))
  const [tab, setTab] = useState('problems')
  const [mobile, setMobile] = useState<MobileView>('editor')
  const [info, setInfo] = useState<EditorInfo>({ line: 1, col: 1, from: 0, to: 0, length: initial.doc.text.length })
  const [measured, setMeasured] = useState(0)
  const [historyNotice, setHistoryNotice] = useState('')
  const [topNotice, setTopNotice] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [shownCriterion, setShownCriterion] = useState<string | null>(null)
  const [prevCriteria, setPrevCriteria] = useState<{ text: string; preset: string } | null>(null)
  const [printOverride, setPrintOverride] = useState<ReturnType<typeof buildView> | null>(null)

  const ed = useRef<EditorHandle>(null)
  const changedRef = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const historyRef = useRef(history)
  historyRef.current = history
  const nameRef = useRef(name)
  nameRef.current = name
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // ---------------------------------------------------------------- analysis (debounced so typing stays smooth)
  const dText = useDebounced(text, text.length > 50_000 ? 700 : 250)
  // Treat editor/doc length drift as stale too (chunked large paste updates the editor before React state).
  const stale = dText !== text || info.length !== text.length
  const view = useMemo(() => buildView(dText), [dText])
  const problems = useMemo(() => safeLint(dText), [dText])
  const ats = useMemo(() => atsText(view), [view])
  const trip = useMemo(() => (tab === 'ats' ? roundTrip(view, ats, dText) : null), [tab, view, ats, dText])
  const parsedCriteria = useMemo(() => parseCriteriaSafe(settings.criteriaText), [settings.criteriaText])
  const contentH = view.empty ? 0 : measured
  const pages = pageCount(contentH)
  const report = useMemo(
    () => evaluateSafe(dText, parsedCriteria.criteria, contentH > 0 ? pages : undefined),
    [dText, parsedCriteria, contentH, pages],
  )
  const maxPages = maxPagesRule(parsedCriteria.criteria)
  const counts = countBySeverity(problems)

  // ---------------------------------------------------------------- editor <-> analysis
  useEffect(() => {
    const h = ed.current
    if (!h || h.getText() !== dText) return
    h.setDiagnostics(toDiagnostics(problems, report, dText.length))
  }, [problems, report, dText])

  useEffect(() => {
    const h = ed.current
    if (!h) return
    if (!shownCriterion || !report) { h.setHighlight('criteria', []); return }
    const r = report.results.find(x => x.criterion.id === shownCriterion)
    h.setHighlight('criteria', r && !r.pass && h.getText() === dText ? r.locations : [])
  }, [report, shownCriterion, dText])

  const onChange = useCallback((t: string, changed: number) => {
    changedRef.current += changed
    setText(t)
    setConfirmClear(false)
  }, [])

  // ---------------------------------------------------------------- history
  const commitHistory = useCallback((list: Snapshot[]) => {
    historyRef.current = list
    setHistory(list)
    const r = saveHistory(store, list)
    if (store.available && !r.ok) setHistoryNotice('Could not store history: browser storage is full.')
    else if (r.kept < list.length) setHistoryNotice(`Storage is limited, so only the ${r.kept} most recent snapshots are kept.`)
  }, [store])

  const snapshot = useCallback((auto: boolean, label?: string, quiet = false) => {
    const current = ed.current?.getText() ?? ''
    const r = addSnapshot(historyRef.current, current, { auto, label })
    if (r.added) {
      commitHistory(r.list)
      if (!quiet) setHistoryNotice(auto ? 'Automatic snapshot saved.' : 'Snapshot saved.')
    } else if (!quiet) {
      setHistoryNotice(r.reason === 'empty' ? 'Nothing to save yet.' : 'This text is already in your history.')
    }
    return r.added
  }, [commitHistory])

  // ---------------------------------------------------------------- persistence (every access is guarded inside Store)
  const save = useCallback(() => {
    const current = ed.current?.getText()
    if (current === undefined) return
    const ok = saveDoc(store, { name: nameRef.current, text: current })
    if (!ok && store.available) setTopNotice('Could not save: browser storage is full. Use Download .txt to keep a copy.')
    if (shouldAutoSnapshot(changedRef.current, current.length)) {
      changedRef.current = 0
      snapshot(true, undefined, false)
    }
  }, [store, snapshot])

  useEffect(() => {
    const t = setTimeout(save, 600)
    return () => clearTimeout(t)
  }, [text, name, save])

  useEffect(() => {
    const t = setTimeout(() => saveSettings(store, settings), 400)
    return () => clearTimeout(t)
  }, [settings, store])

  useEffect(() => {
    const flush = () => { save(); saveSettings(store, settingsRef.current) }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [save, store])

  useEffect(() => { document.title = `${name || 'Resume'} - Resume editor` }, [name])

  // Ctrl/Cmd+S outside the editor also saves a snapshot (inside it, the editor keymap handles it first)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        snapshot(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [snapshot])

  // The print copy is rebuilt from the live text right before printing, so it is never a debounce behind.
  useEffect(() => {
    const before = () => flushSync(() => setPrintOverride(buildView(ed.current?.getText() ?? '')))
    const after = () => setPrintOverride(null)
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])

  // ---------------------------------------------------------------- actions
  const jump = useCallback((from: number, to: number) => {
    setMobile('editor')
    ed.current?.select(from, to)
  }, [])

  const fixOne = (p: Problem) => { if (p.fix) ed.current?.applyChanges([p.fix], 'ide.fix') }
  const fixAll = () => ed.current?.applyChanges(fixChanges(problems), 'ide.fixall')

  const applyProposal = useCallback((p: RangeProposal): Check => {
    const h = ed.current
    if (!h) return { ok: false, reason: 'The editor is not ready.' }
    const c = checkProposal(h.getText(), p)
    if (!c.ok) return c
    h.applyChanges(proposalChanges(p), 'ide.proposal')
    return c
  }, [])

  const replaceDoc = (next: string, nextName: string, label: string) => {
    snapshot(false, label, true)
    ed.current?.replaceAll(next, 'ide.replace')
    setName(nextName)
    changedRef.current = 0
  }

  const doImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setTopNotice(`Reading ${file.name}...`)
    try {
      const t = await extractFileText(file)
      if (!t.trim()) { setTopNotice(`No text found in ${file.name}. A scanned PDF has no text layer; paste the text instead.`); return }
      replaceDoc(t, fileBaseName(file.name), 'Before import')
      setTopNotice(`Imported ${file.name}.`)
    } catch (err) {
      setTopNotice(err instanceof Error ? err.message : 'Could not read that file.')
    }
  }

  const download = () => {
    try {
      const out = atsText(buildView(ed.current?.getText() ?? ''))
      const url = URL.createObjectURL(new Blob([out], { type: 'text/plain;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileBaseName(name)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setTopNotice('Could not create the download.')
    }
  }

  const print = () => {
    const prev = document.title
    document.title = fileBaseName(name)
    try { window.print() } finally { document.title = prev }
  }

  const clearDoc = () => {
    if (!confirmClear) { setConfirmClear(true); return }
    setConfirmClear(false)
    replaceDoc('', 'Untitled resume', 'Before clear')
    setTopNotice('Cleared. The previous text is in History.')
  }

  const loadSample = () => {
    replaceDoc(SAMPLE_TEXT, SAMPLE_NAME, 'Before sample')
    setTopNotice('Sample loaded. The previous text is in History.')
  }

  const setPreset = (key: string) => {
    if (!key) { setSettings(s => ({ ...s, preset: '' })); return }
    setPrevCriteria({ text: settings.criteriaText, preset: settings.preset })
    setSettings(s => ({ ...s, preset: key, criteriaText: CRITERIA_PRESETS[key] ?? s.criteriaText }))
  }

  const showCriterion = (r: CriterionResult) => {
    setShownCriterion(r.criterion.id)
    const first = r.locations[0]
    if (first) jump(first.from, first.to)
  }

  const restore = (s: Snapshot) => {
    snapshot(false, 'Before restore', true)
    ed.current?.replaceAll(s.text, 'ide.restore')
    setHistoryNotice('Restored. Undo with Ctrl/Cmd+Z in the editor.')
  }

  const getDoc = () => {
    const h = ed.current
    const t = h?.getText() ?? ''
    const sel = h?.getSelection() ?? { from: 0, to: 0 }
    return { text: t, selection: sel.from !== sel.to ? sel : undefined, cursor: sel.to }
  }

  const printView = printOverride ?? view
  const pane = (id: MobileView) => `ide-pane ide-pane-${id}${mobile === id ? '' : ' ide-pane-off'}`

  const tabs = [
    {
      id: 'problems', label: 'Problems', badge: problems.length ? String(problems.length) : undefined,
      panel: <ProblemsTab problems={problems} text={dText} stale={stale} onJump={jump} onFix={fixOne} onFixAll={fixAll} />,
    },
    {
      id: 'criteria', label: 'Criteria', badge: report ? `${report.passed}/${report.total}` : undefined,
      panel: (
        <CriteriaTab
          text={settings.criteriaText}
          onText={v => { setSettings(s => ({ ...s, criteriaText: v, preset: '' })); setPrevCriteria(null) }}
          preset={settings.preset}
          onPreset={setPreset}
          canUndoPreset={prevCriteria !== null}
          onUndoPreset={() => { if (prevCriteria) { setSettings(s => ({ ...s, criteriaText: prevCriteria.text, preset: prevCriteria.preset })); setPrevCriteria(null) } }}
          errors={parsedCriteria.errors}
          report={report}
          pages={pages}
          onShow={showCriterion}
        />
      ),
    },
    {
      id: 'match', label: 'Match',
      panel: (
        <MatchTab
          text={dText}
          liveText={text}
          jobText={settings.jobText}
          onJobText={v => setSettings(s => ({ ...s, jobText: v }))}
          onSample={() => setSettings(s => ({ ...s, jobText: SAMPLE_JOB }))}
          onApply={applyProposal}
        />
      ),
    },
    { id: 'ats', label: 'ATS view', panel: <AtsTab ats={ats} trip={trip} /> },
    {
      id: 'history', label: 'History', badge: history.length ? String(history.length) : undefined,
      panel: <HistoryTab snapshots={history} liveText={text} onSnapshot={() => snapshot(false)} onRestore={restore} notice={historyNotice} />,
    },
    {
      id: 'assistant', label: 'Assistant',
      panel: (
        <AssistantTab
          getDoc={getDoc}
          liveText={text}
          jobText={settings.jobText}
          criteriaText={settings.criteriaText || DEFAULT_CRITERIA}
          prompts={prompts}
          onPrompts={list => { setPrompts(list); savePrompts(store, list) }}
          onApply={applyProposal}
          onHighlight={r => ed.current?.setHighlight('target', r)}
        />
      ),
    },
  ]

  return (
    <div className="ide" data-view={mobile}>
      <div className="ide-topbar">
        <input
          className="input ide-name"
          value={name}
          maxLength={80}
          onChange={e => setName(e.target.value)}
          aria-label="Document name"
        />
        <div className="ide-actions" role="toolbar" aria-label="Document actions">
          <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" onChange={doImport} hidden aria-label="Import file" data-testid="ide-import" />
          <button type="button" className="btn-secondary ide-btn" onClick={() => fileInput.current?.click()}>Import file</button>
          <button type="button" className="btn ide-btn" onClick={print} data-testid="ide-print">Save as PDF</button>
          <button type="button" className="btn-secondary ide-btn" onClick={download} data-testid="ide-download">Download .txt</button>
          <button type="button" className="btn-secondary ide-btn" onClick={loadSample} data-testid="ide-sample">Sample</button>
          <button type="button" className="btn-secondary ide-btn" onClick={clearDoc} data-testid="ide-clear">{confirmClear ? 'Confirm clear' : 'New / Clear'}</button>
        </div>
      </div>

      {(!store.available || topNotice) && (
        <div className="ide-notices" role="status">
          {!store.available && <p data-testid="ide-storage-notice">Browser storage is unavailable, so nothing is saved between visits. Use Download .txt to keep a copy.</p>}
          {topNotice && <p data-testid="ide-top-notice">{topNotice}</p>}
        </div>
      )}

      <div className="ide-seg" role="group" aria-label="Show">
        {(['editor', 'preview', 'panel'] as MobileView[]).map(v => (
          <button key={v} type="button" aria-pressed={mobile === v} className="ide-seg-btn" onClick={() => setMobile(v)} data-testid={`ide-seg-${v}`}>
            {v === 'editor' ? 'Editor' : v === 'preview' ? 'Preview' : 'Panel'}
          </button>
        ))}
      </div>

      <div className="ide-main">
        <div className="ide-left">
          <section className={pane('editor')} aria-label="Editor">
            <Editor ref={ed} initialText={initial.doc.text} onChange={onChange} onInfo={setInfo} onSave={() => snapshot(false)} />
            <div className="ide-status" data-testid="ide-status">
              <span>Ln {info.line}, Col {info.col}</span>
              <span data-testid="ide-status-problems">{problems.length} problem{problems.length === 1 ? '' : 's'}{counts.error ? ` (${counts.error} error${counts.error === 1 ? '' : 's'})` : ''}</span>
              <span data-testid="ide-status-pages">{formatPages(contentH)}</span>
              <span data-testid="ide-status-score">{report ? `Criteria ${report.score}` : 'No criteria'}</span>
              <span className="muted">{stale ? 'Checking...' : ''}</span>
            </div>
          </section>
          <section className={pane('panel')} aria-label="Tools">
            <Tabs tabs={tabs} active={tab} onChange={setTab} idPrefix="ide" label="Resume tools" />
          </section>
        </div>
        <section className={pane('preview')} aria-label="Preview">
          <Preview view={view} onMeasure={setMeasured} contentHeightPx={contentH} maxPages={maxPages} />
        </section>
      </div>

      <PrintRoot>
        <div className="ide-print"><ResumeDoc view={printView} /></div>
      </PrintRoot>
    </div>
  )
}
