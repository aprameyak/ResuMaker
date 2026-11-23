'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorState, StateEffect, StateField, RangeSetBuilder, EditorSelection } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, drawSelection, Decoration, ViewPlugin } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import { history, historyKeymap, defaultKeymap, isolateHistory } from '@codemirror/commands'
import { setDiagnostics } from '@codemirror/lint'
import type { Diagnostic } from '@codemirror/lint'
import { BULLET, headingFor } from '../../../lib/resume/parse'
import type { DiagData } from '../../ide/analysis'
import type { TextChange } from '../../ide/proposals'

/** Pastes above this size are applied in animation-frame chunks so the main thread stays responsive. */
const LARGE_PASTE = 40_000
const PASTE_CHUNK = 12_000

export interface EditorInfo { line: number; col: number; from: number; to: number; length: number }
export interface Range { from: number; to: number }
export type HighlightKind = 'target' | 'criteria'

export interface EditorHandle {
  getText(): string
  getSelection(): { from: number; to: number }
  /** One undoable transaction; the history treats it as its own step. */
  applyChanges(changes: readonly TextChange[], userEvent?: string): void
  replaceAll(text: string, userEvent?: string): void
  select(from: number, to: number): void
  setDiagnostics(list: readonly DiagData[]): void
  setHighlight(kind: HighlightKind, ranges: readonly Range[]): void
  focus(): void
}

interface Props {
  initialText: string
  onChange(text: string, changedChars: number): void
  onInfo(info: EditorInfo): void
  onSave(): void
}

const setHl = StateEffect.define<{ kind: HighlightKind; ranges: Range[] }>()

function highlightField(kind: HighlightKind): Extension {
  const mark = Decoration.mark({ class: kind === 'target' ? 'ide-hl-target' : 'ide-hl-criteria' })
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(deco, tr) {
      deco = deco.map(tr.changes)
      for (const e of tr.effects) {
        if (e.is(setHl) && e.value.kind === kind) {
          const len = tr.state.doc.length
          const ranges = e.value.ranges
            .map(r => ({ from: Math.max(0, Math.min(len, r.from)), to: Math.max(0, Math.min(len, r.to)) }))
            .filter(r => r.to > r.from)
            .sort((a, b) => a.from - b.from)
            .slice(0, 800)
          deco = Decoration.set(ranges.map(r => mark.range(r.from, r.to)), true)
        }
      }
      return deco
    },
    provide: f => EditorView.decorations.from(f),
  })
}

const headingLine = Decoration.line({ class: 'ide-line-heading' })
const bulletMark = Decoration.mark({ class: 'ide-bullet-mark' })

function resumeDecorations(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>()
  let last = -1
  for (const { from, to } of view.visibleRanges) {
    let pos = from
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos)
      if (line.from > last) {
        last = line.from
        const text = line.text
        if (text.length <= 60 && headingFor(text.trim())) {
          b.add(line.from, line.from, headingLine)
        } else if (text.length < 5000) {
          const m = text.match(BULLET)
          if (m) {
            const markerLen = m[0].length - 1
            const lead = m[0].length - m[0].trimStart().length
            if (markerLen > lead) b.add(line.from + lead, line.from + markerLen, bulletMark)
          }
        }
      }
      pos = line.to + 1
    }
  }
  return b.finish()
}

const resumeSyntax = ViewPlugin.fromClass(class {
  decorations: DecorationSet
  constructor(view: EditorView) { this.decorations = resumeDecorations(view) }
  update(u: ViewUpdate) {
    if (u.docChanged || u.viewportChanged) this.decorations = resumeDecorations(u.view)
  }
}, { decorations: v => v.decorations })

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px', backgroundColor: '#ffffff', color: '#111111' },
  '&.cm-focused': { outline: '2px solid #111111', outlineOffset: '-2px' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace', lineHeight: '1.6', overflow: 'auto' },
  '.cm-content': { padding: '8px 0', caretColor: '#111111' },
  '.cm-line': { padding: '0 12px 0 8px' },
  '.cm-gutters': { backgroundColor: '#f7f7f8', color: '#767676', border: 'none', borderRight: '1px solid #dcdcdc' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 10px', minWidth: '32px' },
  '.cm-cursor': { borderLeftColor: '#111111' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': { backgroundColor: '#d4d4d4' },
  '.ide-line-heading': { fontWeight: '700' },
  '.ide-bullet-mark': { color: '#767676' },
  '.ide-hl-target': { backgroundColor: '#e8e8e8', outline: '1px solid #111111' },
  '.ide-hl-criteria': { backgroundColor: '#efefef', outline: '1px dashed #767676' },
  '.cm-lintRange': { backgroundImage: 'none', paddingBottom: '0', textDecorationLine: 'underline', textDecorationStyle: 'wavy', textUnderlineOffset: '3px' },
  '.cm-lintRange-error': { textDecorationColor: '#a12a2a' },
  '.cm-lintRange-warning': { textDecorationColor: '#8a5a00' },
  '.cm-lintRange-info': { textDecorationColor: '#767676' },
  '.cm-tooltip': { backgroundColor: '#ffffff', border: '1px solid #dcdcdc', borderRadius: '6px', color: '#111111' },
  '.cm-tooltip.cm-tooltip-lint': { padding: '4px 0' },
  '.cm-diagnostic': { padding: '4px 10px', borderLeft: '3px solid #767676', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: '13px', lineHeight: '1.4' },
  '.cm-diagnostic-error': { borderLeftColor: '#a12a2a' },
  '.cm-diagnostic-warning': { borderLeftColor: '#8a5a00' },
  '.cm-diagnostic-info': { borderLeftColor: '#767676' },
  '.cm-diagnosticSource': { color: '#767676', fontSize: '11px' },
  '.cm-diagnosticAction': { backgroundColor: '#ffffff', color: '#111111', border: '1px solid #111111', borderRadius: '6px', padding: '2px 8px', margin: '4px 6px 2px 0', cursor: 'pointer', font: 'inherit', fontSize: '12px' },
  '.cm-diagnosticAction:hover': { backgroundColor: '#f7f7f8' },
})

/** Apply a large paste across animation frames so layout work cannot monopolize the main thread. */
function pasteInChunks(view: EditorView, from: number, to: number, text: string, onDone: () => void) {
  let pos = from
  let i = 0
  let replacing = to > from
  const step = () => {
    if (!view.dom.isConnected) { onDone(); return }
    if (i >= text.length) { onDone(); return }
    const chunk = text.slice(i, i + PASTE_CHUNK)
    const changes = replacing
      ? { from, to, insert: chunk }
      : { from: pos, insert: chunk }
    view.dispatch({
      changes,
      selection: EditorSelection.cursor((replacing ? from : pos) + chunk.length),
      userEvent: 'input.paste',
    })
    pos = (replacing ? from : pos) + chunk.length
    replacing = false
    i += PASTE_CHUNK
    if (i < text.length) requestAnimationFrame(step)
    else onDone()
  }
  requestAnimationFrame(step)
}

const Editor = forwardRef<EditorHandle, Props>(function Editor({ initialText, onChange, onInfo, onSave }, ref) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const cb = useRef({ onChange, onInfo, onSave })
  const quietPaste = useRef(false)
  const pasteChanged = useRef(0)
  cb.current = { onChange, onInfo, onSave }

  useEffect(() => {
    if (!host.current) return
    const state = EditorState.create({
      doc: initialText,
      extensions: [
        history(),
        lineNumbers(),
        drawSelection(),
        EditorView.lineWrapping,
        keymap.of([
          { key: 'Mod-s', preventDefault: true, run: () => { cb.current.onSave(); return true } },
          ...historyKeymap,
          ...defaultKeymap,
        ]),
        resumeSyntax,
        highlightField('target'),
        highlightField('criteria'),
        theme,
        EditorView.contentAttributes.of({ 'aria-label': 'Resume source text', 'aria-multiline': 'true', spellcheck: 'false' }),
        EditorView.domEventHandlers({
          paste(event, view) {
            const text = event.clipboardData?.getData('text/plain')
            if (text == null || text.length < LARGE_PASTE) return false
            event.preventDefault()
            const { from, to } = view.state.selection.main
            const before = view.state.doc.toString()
            const next = before.slice(0, from) + text + before.slice(to)
            const changed = (to - from) + text.length
            // Publish the final text immediately so React shows "Checking..." before chunks finish;
            // the editor catches up across animation frames without a multi-second long task.
            quietPaste.current = true
            pasteChanged.current = changed
            cb.current.onChange(next, changed)
            cb.current.onInfo({ line: 1, col: 1, from: next.length, to: next.length, length: next.length })
            pasteInChunks(view, from, to, text, () => {
              quietPaste.current = false
              pasteChanged.current = 0
              const sel = view.state.selection.main
              const line = view.state.doc.lineAt(sel.head)
              cb.current.onChange(view.state.doc.toString(), 0)
              cb.current.onInfo({ line: line.number, col: sel.head - line.from + 1, from: sel.from, to: sel.to, length: view.state.doc.length })
            })
            return true
          },
        }),
        EditorView.updateListener.of(u => {
          if (u.docChanged) {
            let changed = 0
            u.changes.iterChanges((fa, ta, _fb, _tb, ins) => { changed += (ta - fa) + ins.length })
            if (quietPaste.current) pasteChanged.current += changed
            else cb.current.onChange(u.state.doc.toString(), changed)
          }
          // Keep line/length info live during chunked paste so the status bar can show "Checking..."
          // until the document and React state converge (e2e waits on that).
          if (u.docChanged || u.selectionSet) {
            const sel = u.state.selection.main
            const line = u.state.doc.lineAt(sel.head)
            cb.current.onInfo({ line: line.number, col: sel.head - line.from + 1, from: sel.from, to: sel.to, length: u.state.doc.length })
          }
        }),
      ],
    })
    const view = new EditorView({ state, parent: host.current })
    viewRef.current = view
    const sel = view.state.selection.main
    const line = view.state.doc.lineAt(sel.head)
    cb.current.onInfo({ line: line.number, col: sel.head - line.from + 1, from: sel.from, to: sel.to, length: view.state.doc.length })
    return () => { view.destroy(); viewRef.current = null }
    // the editor is created once; initialText is only the starting document
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    getText: () => viewRef.current?.state.doc.toString() ?? '',
    getSelection: () => {
      const s = viewRef.current?.state.selection.main
      return s ? { from: s.from, to: s.to } : { from: 0, to: 0 }
    },
    applyChanges(changes, userEvent = 'ide.change') {
      const v = viewRef.current
      if (!v || !changes.length) return
      const len = v.state.doc.length
      const safe = changes.filter(c => c.from >= 0 && c.to >= c.from && c.to <= len)
      if (!safe.length) return
      v.dispatch({
        changes: safe.map(c => ({ from: c.from, to: c.to, insert: c.insert })),
        userEvent,
        annotations: isolateHistory.of('full'),
      })
    },
    replaceAll(text, userEvent = 'ide.replace') {
      const v = viewRef.current
      if (!v) return
      const cur = v.state.doc.toString()
      if (cur === text) return
      // keep as much of the old document as possible so the caret and scroll position survive
      let pre = 0
      const max = Math.min(cur.length, text.length)
      while (pre < max && cur.charCodeAt(pre) === text.charCodeAt(pre)) pre++
      let suf = 0
      while (suf < max - pre && cur.charCodeAt(cur.length - 1 - suf) === text.charCodeAt(text.length - 1 - suf)) suf++
      v.dispatch({
        changes: { from: pre, to: cur.length - suf, insert: text.slice(pre, text.length - suf) },
        userEvent,
        annotations: isolateHistory.of('full'),
      })
    },
    select(from, to) {
      const v = viewRef.current
      if (!v) return
      const len = v.state.doc.length
      const a = Math.max(0, Math.min(len, from))
      const b = Math.max(a, Math.min(len, to))
      v.dispatch({ selection: EditorSelection.range(a, b), effects: EditorView.scrollIntoView(a, { y: 'center' }) })
      v.focus()
    },
    setDiagnostics(list) {
      const v = viewRef.current
      if (!v) return
      const len = v.state.doc.length
      const diags: Diagnostic[] = list
        .filter(d => d.from >= 0 && d.to <= len && d.to > d.from)
        .map(d => ({
          from: d.from, to: d.to, severity: d.severity, message: d.message, source: d.source,
          actions: d.actions.map(a => ({
            name: a.name,
            apply(view: EditorView, from: number) {
              // the diagnostic range was mapped through edits; keep the fix at the same offset inside it
              const origin = d.from
              const f = from + (a.change.from - origin)
              const t = from + (a.change.to - origin)
              if (f < 0 || t < f || t > view.state.doc.length) return
              view.dispatch({ changes: { from: f, to: t, insert: a.change.insert }, userEvent: 'ide.fix', annotations: isolateHistory.of('full') })
            },
          })),
        }))
      v.dispatch(setDiagnostics(v.state, diags))
    },
    setHighlight(kind, ranges) {
      viewRef.current?.dispatch({ effects: setHl.of({ kind, ranges: ranges.slice() }) })
    },
    focus() { viewRef.current?.focus() },
  }), [])

  return <div ref={host} className="ide-cm" data-testid="ide-editor" />
})

export default Editor
