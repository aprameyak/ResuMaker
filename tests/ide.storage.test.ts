import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Store, memoryKV, KEYS } from '../app/ide/storage'
import {
  loadDoc, saveDoc, loadSettings, saveSettings, loadHistory, saveHistory, addSnapshot, enforceCap, trimToBudget, MAX_SNAPSHOTS,
  pushPrompt, stepHistory, MAX_PROMPTS, shouldAutoSnapshot, describeSnapshot, fileBaseName, loadPrompts, savePrompts, DEFAULT_SETTINGS,
} from '../app/ide/state'
import type { Snapshot } from '../app/ide/state'
import { SAMPLE_TEXT } from '../app/ide/sample'

const blocked = () => new Store(() => { throw new Error('SecurityError') })

test('blocked storage never throws and reports unavailable', () => {
  const s = blocked()
  assert.equal(s.available, false)
  assert.equal(s.get('x'), null)
  assert.equal(s.set('x', '1'), false)
  assert.equal(s.getJSON('x'), undefined)
  assert.equal(s.setJSON('x', { a: 1 }), false)
  s.remove('x')
  const { doc, fresh } = loadDoc(s)
  assert.equal(fresh, true)
  assert.equal(doc.text, SAMPLE_TEXT)
  assert.deepEqual(loadSettings(s), DEFAULT_SETTINGS)
  assert.deepEqual(loadHistory(s), [])
  assert.deepEqual(loadPrompts(s), [])
})

test('a store whose methods throw later is still safe', () => {
  const kv = memoryKV()
  const s = new Store(() => kv)
  assert.equal(s.available, true)
  kv.setItem = () => { throw new Error('QuotaExceededError') }
  kv.getItem = () => { throw new Error('boom') }
  assert.equal(s.set('a', 'b'), false)
  assert.equal(s.get('a'), null)
  assert.match(s.lastError ?? '', /boom|Quota/)
})

test('document and settings round trip, corrupt data falls back', () => {
  const kv = memoryKV()
  const s = new Store(() => kv)
  assert.equal(saveDoc(s, { name: 'Mine', text: 'hello' }), true)
  assert.deepEqual(loadDoc(s), { doc: { name: 'Mine', text: 'hello' }, fresh: false })
  saveSettings(s, { criteriaText: 'max pages: 1', preset: 'ats-safe', jobText: 'jd' })
  assert.equal(loadSettings(s).preset, 'ats-safe')
  kv.setItem(KEYS.doc, '{not json')
  assert.equal(loadDoc(s).fresh, true)
  kv.setItem(KEYS.doc, JSON.stringify({ name: 5, text: 'x' }))
  assert.equal(loadDoc(s).doc.name, 'Untitled resume')
  kv.setItem(KEYS.settings, JSON.stringify({ criteriaText: 7 }))
  assert.equal(loadSettings(s).criteriaText, DEFAULT_SETTINGS.criteriaText)
  kv.setItem(KEYS.history, JSON.stringify([{ id: 'a', t: 1, text: 'x' }, { bad: true }, null]))
  assert.equal(loadHistory(s).length, 1)
})

const snap = (n: number, auto = true): Snapshot => ({ id: 's' + n, t: n, text: 'text ' + n, auto })

test('addSnapshot dedupes identical text and ignores empty', () => {
  let list: Snapshot[] = []
  let r = addSnapshot(list, 'one', { auto: false, now: 1 })
  assert.equal(r.added, true)
  list = r.list
  r = addSnapshot(list, 'one', { auto: true, now: 2 })
  assert.equal(r.added, false)
  assert.equal(r.reason, 'duplicate')
  assert.equal(addSnapshot(list, '   \n', { auto: false }).reason, 'empty')
  r = addSnapshot(list, 'two', { auto: false, now: 3 })
  assert.deepEqual(r.list.map(s => s.text), ['two', 'one'])
})

test('history is capped at 30 and drops automatic snapshots first', () => {
  let list: Snapshot[] = []
  list = addSnapshot(list, 'manual keeper', { auto: false, now: 0 }).list
  for (let i = 1; i <= 40; i++) list = addSnapshot(list, 'auto ' + i, { auto: true, now: i }).list
  assert.equal(list.length, MAX_SNAPSHOTS)
  assert.ok(list.some(s => s.text === 'manual keeper'), 'the manual snapshot survives')
  assert.equal(list[0].text, 'auto 40')
  const all = Array.from({ length: 35 }, (_, i) => snap(i, false))
  assert.equal(enforceCap(all).length, 30)
  assert.equal(enforceCap(all)[0].id, 's0')
})

test('budget trimming keeps the newest', () => {
  const big = (n: number): Snapshot => ({ id: 'b' + n, t: n, text: 'x'.repeat(1000), auto: true })
  const out = trimToBudget([big(3), big(2), big(1)], 2500)
  assert.deepEqual(out.map(s => s.id), ['b3', 'b2'])
  assert.equal(trimToBudget([big(1)], 10).length, 1)
})

test('saveHistory retries with fewer snapshots when storage is full', () => {
  const kv = memoryKV()
  const s = new Store(() => kv)
  const real = kv.setItem.bind(kv)
  kv.setItem = (k, v) => { if (v.length > 3000) throw new Error('QuotaExceededError'); real(k, v) }
  const list = Array.from({ length: 10 }, (_, i) => ({ id: 'q' + i, t: i, text: 'y'.repeat(500), auto: true }))
  const r = saveHistory(s, list)
  assert.equal(r.ok, true)
  assert.ok(r.kept < 10 && r.kept >= 1)
  assert.equal(loadHistory(s).length, r.kept)
  const dead = saveHistory(blocked(), list)
  assert.equal(dead.ok, false)
})

test('prompt history: newest first, deduped, capped to 20', () => {
  let p: string[] = []
  for (let i = 0; i < 25; i++) p = pushPrompt(p, 'prompt ' + i)
  assert.equal(p.length, MAX_PROMPTS)
  assert.equal(p[0], 'prompt 24')
  p = pushPrompt(p, 'prompt 20')
  assert.equal(p[0], 'prompt 20')
  assert.equal(p.filter(x => x === 'prompt 20').length, 1)
  assert.equal(pushPrompt(p, '   '), p)
  const kv = memoryKV(); const s = new Store(() => kv)
  savePrompts(s, p)
  assert.deepEqual(loadPrompts(s), p)
})

test('stepHistory clamps both ends', () => {
  assert.equal(stepHistory(-1, 3, 'up'), 0)
  assert.equal(stepHistory(2, 3, 'up'), 2)
  assert.equal(stepHistory(0, 3, 'down'), -1)
  assert.equal(stepHistory(-1, 3, 'down'), -1)
})

test('auto snapshot threshold and descriptions', () => {
  assert.equal(shouldAutoSnapshot(10, 500), false)
  assert.equal(shouldAutoSnapshot(500, 500), true)
  assert.equal(shouldAutoSnapshot(500, 500_000), false)
  const d = describeSnapshot({ id: 'x', t: 1, text: '\n\n  Priya N  \nline', auto: false })
  assert.equal(d.first, 'Priya N')
  assert.equal(d.size, '18 chars')
  assert.equal(fileBaseName('My Résumé (final).pdf'), 'My Rsum final')
  assert.equal(fileBaseName('.pdf'), 'Resume')
})
