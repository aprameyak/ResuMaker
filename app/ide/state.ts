// Persisted state and pure state helpers. No React, no CodeMirror.
import { KEYS } from './storage'
import type { Store } from './storage'
import { SAMPLE_NAME, SAMPLE_TEXT } from './sample'

export const MAX_SNAPSHOTS = 30
export const MAX_PROMPTS = 20
/** Roughly how many characters must change before an automatic snapshot is taken. */
export const AUTO_SNAPSHOT_CHARS = 300
/** Total characters of snapshot text kept in storage (localStorage is about 5 MB). */
export const HISTORY_BUDGET_CHARS = 1_500_000
export const MAX_AUTO_SNAPSHOT_DOC = 100_000

export interface IdeDoc { name: string; text: string }
export interface Settings { criteriaText: string; preset: string; jobText: string }
export interface Snapshot { id: string; t: number; text: string; auto: boolean; label?: string }

export const DEFAULT_CRITERIA = `# One rule per line. Lines starting with # are comments.
max pages: 1
require sections: experience, education, skills
no first person
start bullets with a verb
no lint errors
`

export const DEFAULT_SETTINGS: Settings = { criteriaText: DEFAULT_CRITERIA, preset: '', jobText: '' }

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ---------------------------------------------------------------- document

export function loadDoc(store: Store): { doc: IdeDoc; fresh: boolean } {
  const v = store.getJSON(KEYS.doc)
  if (isObj(v) && typeof v.text === 'string') {
    return { doc: { name: typeof v.name === 'string' && v.name.trim() ? v.name.slice(0, 80) : 'Untitled resume', text: v.text }, fresh: false }
  }
  return { doc: { name: SAMPLE_NAME, text: SAMPLE_TEXT }, fresh: true }
}

export function saveDoc(store: Store, doc: IdeDoc): boolean {
  return store.setJSON(KEYS.doc, doc)
}

// ---------------------------------------------------------------- settings

export function loadSettings(store: Store): Settings {
  const v = store.getJSON(KEYS.settings)
  if (!isObj(v)) return { ...DEFAULT_SETTINGS }
  return {
    criteriaText: typeof v.criteriaText === 'string' ? v.criteriaText.slice(0, 20_000) : DEFAULT_SETTINGS.criteriaText,
    preset: typeof v.preset === 'string' ? v.preset : '',
    jobText: typeof v.jobText === 'string' ? v.jobText.slice(0, 100_000) : '',
  }
}

export function saveSettings(store: Store, s: Settings): boolean {
  return store.setJSON(KEYS.settings, s)
}

// ---------------------------------------------------------------- history

export function loadHistory(store: Store): Snapshot[] {
  const v = store.getJSON(KEYS.history)
  if (!Array.isArray(v)) return []
  const out: Snapshot[] = []
  for (const s of v) {
    if (isObj(s) && typeof s.id === 'string' && typeof s.t === 'number' && typeof s.text === 'string') {
      out.push({ id: s.id, t: s.t, text: s.text, auto: s.auto === true, label: typeof s.label === 'string' ? s.label : undefined })
    }
  }
  return out.slice(0, MAX_SNAPSHOTS)
}

/** Newest first. Drops the oldest automatic snapshots first, then the oldest overall, until the list fits. */
export function enforceCap(list: Snapshot[], cap = MAX_SNAPSHOTS): Snapshot[] {
  const out = list.slice()
  while (out.length > cap) {
    let idx = -1
    for (let i = out.length - 1; i >= 0; i--) if (out[i].auto) { idx = i; break }
    out.splice(idx >= 0 ? idx : out.length - 1, 1)
  }
  return out
}

export function trimToBudget(list: Snapshot[], budget = HISTORY_BUDGET_CHARS): Snapshot[] {
  const out = list.slice()
  const total = () => out.reduce((n, s) => n + s.text.length, 0)
  while (out.length > 1 && total() > budget) out.pop()
  return out
}

export interface AddResult { list: Snapshot[]; added: boolean; reason?: 'duplicate' | 'empty' }

/** Adds a snapshot at the front. Identical text already in the list is not stored twice. */
export function addSnapshot(list: Snapshot[], text: string, opts: { auto: boolean; label?: string; now?: number; id?: string }): AddResult {
  if (!text.trim()) return { list, added: false, reason: 'empty' }
  if (list.some(s => s.text === text)) return { list, added: false, reason: 'duplicate' }
  const t = opts.now ?? Date.now()
  const snap: Snapshot = { id: opts.id ?? `${t.toString(36)}-${Math.random().toString(36).slice(2, 7)}`, t, text, auto: opts.auto, label: opts.label }
  return { list: enforceCap([snap, ...list]), added: true }
}

export function saveHistory(store: Store, list: Snapshot[]): { ok: boolean; kept: number } {
  let cur = trimToBudget(list)
  for (;;) {
    if (store.setJSON(KEYS.history, cur)) return { ok: true, kept: cur.length }
    if (cur.length <= 1) return { ok: false, kept: 0 }
    cur = cur.slice(0, Math.max(1, Math.floor(cur.length / 2)))
  }
}

export function shouldAutoSnapshot(changedChars: number, docLength: number): boolean {
  return changedChars >= AUTO_SNAPSHOT_CHARS && docLength <= MAX_AUTO_SNAPSHOT_DOC
}

export function describeSnapshot(s: Snapshot): { first: string; size: string; lines: number } {
  const firstLine = s.text.split('\n').find(l => l.trim()) ?? ''
  const n = s.text.length
  return {
    first: firstLine.trim().slice(0, 60) || '(empty)',
    size: n < 1000 ? `${n} chars` : `${(n / 1000).toFixed(1)}k chars`,
    lines: s.text.split('\n').length,
  }
}

// ---------------------------------------------------------------- prompts

export function loadPrompts(store: Store): string[] {
  const v = store.getJSON(KEYS.prompts)
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX_PROMPTS) : []
}

export function savePrompts(store: Store, list: string[]): boolean {
  return store.setJSON(KEYS.prompts, list)
}

/** Newest first, no consecutive-or-older duplicates, capped. */
export function pushPrompt(list: string[], prompt: string, cap = MAX_PROMPTS): string[] {
  const p = prompt.trim()
  if (!p) return list
  return [p, ...list.filter(x => x !== p)].slice(0, cap)
}

/** Up-arrow history navigation. index -1 means "the draft". Returns the next index (clamped). */
export function stepHistory(index: number, length: number, dir: 'up' | 'down'): number {
  if (dir === 'up') return Math.min(length - 1, index + 1)
  return Math.max(-1, index - 1)
}

// ---------------------------------------------------------------- misc

export function fileBaseName(name: string): string {
  return name.replace(/\.[A-Za-z0-9]{1,5}$/, '').replace(/[^\w .-]+/g, '').trim().slice(0, 80) || 'Resume'
}
