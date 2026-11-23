import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lintResume, applyFixes, runAssistant, analyzeJobDescription } from '../lib/resume'
import { checkProposal, applyChanges, minimalChange, proposalChanges, fixChanges, aliasProposal } from '../app/ide/proposals'
import { SAMPLE_TEXT, SAMPLE_JOB } from '../app/ide/sample'

const NOW = new Date('2026-11-23')

test('fixChanges applies to exactly what applyFixes produces', () => {
  const problems = lintResume(SAMPLE_TEXT, NOW)
  assert.ok(problems.some(p => p.fix))
  assert.equal(applyChanges(SAMPLE_TEXT, fixChanges(problems)), applyFixes(SAMPLE_TEXT, problems))
})

test('overlapping fixes are skipped, not doubled', () => {
  const text = 'abcdef'
  const mk = (from: number, to: number, insert: string) => ({ from, to, severity: 'warning' as const, rule: 'x', message: 'm', fix: { from, to, insert, label: 'l' } })
  const ch = fixChanges([mk(0, 3, 'X'), mk(2, 4, 'Y'), mk(4, 6, 'Z')])
  assert.deepEqual(ch.map(c => c.insert), ['X', 'Z'])
  assert.equal(applyChanges(text, ch), 'XdZ')
})

test('checkProposal accepts a matching range and rejects stale or out-of-range ones', () => {
  const doc = 'hello brave world'
  const p = { from: 6, to: 11, before: 'brave', after: 'new' }
  assert.deepEqual(checkProposal(doc, p), { ok: true })
  const stale = checkProposal('hello bold world', p)
  assert.equal(stale.ok, false)
  assert.equal(checkProposal('short', p).ok, false)
  assert.equal(checkProposal(doc, { ...p, from: -1 }).ok, false)
  assert.equal(checkProposal(doc, { ...p, to: 3 }).ok, false)
  assert.equal(checkProposal(doc, { ...p, from: 1.5 }).ok, false)
})

test('minimalChange trims shared head and tail', () => {
  assert.equal(minimalChange('same', 'same'), null)
  assert.deepEqual(minimalChange('a quick fox', 'a slow fox', 10), { from: 12, to: 17, insert: 'slow' })
  assert.deepEqual(minimalChange('abc', 'abcd'), { from: 3, to: 3, insert: 'd' })
  assert.deepEqual(minimalChange('abcd', 'abc'), { from: 3, to: 4, insert: '' })
})

test('proposalChanges equals replacing the range, whatever the line shape', () => {
  const cases: Array<[string, string]> = [
    ['a\nb\nc', 'a\nB\nc'],
    ['a\nb\nc', 'a\nc'],
    ['a\nb\nc', 'a\nb\nc\nd'],
    ['x', ''],
    ['', 'x'],
    ['  - one\n  - two', '  - One\n  - Two'],
  ]
  for (const [before, after] of cases) {
    const doc = 'HEAD\n' + before + '\nTAIL'
    const p = { from: 5, to: 5 + before.length, before, after }
    assert.equal(checkProposal(doc, p).ok, true)
    assert.equal(applyChanges(doc, proposalChanges(p)), doc.slice(0, p.from) + after + doc.slice(p.to), JSON.stringify([before, after]))
  }
  assert.deepEqual(proposalChanges({ from: 0, to: 1, before: 'a', after: 'a' }), [])
})

test('same-line-count proposals leave untouched lines alone (cursor stays put)', () => {
  const before = 'one\ntwo\nthree'
  const ch = proposalChanges({ from: 0, to: before.length, before, after: 'one\nTWO\nthree' })
  assert.equal(ch.length, 1)
  assert.deepEqual(ch[0], { from: 4, to: 7, insert: 'TWO' })
})

test('assistant "fix everything" proposal applies cleanly through the same path the UI uses', async () => {
  const res = await runAssistant({ prompt: 'fix everything', doc: { text: SAMPLE_TEXT }, now: NOW })
  assert.equal(res.status, 'proposal')
  const p = res.proposal!
  assert.equal(checkProposal(SAMPLE_TEXT, p).ok, true)
  const out = applyChanges(SAMPLE_TEXT, proposalChanges(p))
  assert.equal(out, SAMPLE_TEXT.slice(0, p.from) + p.after + SAMPLE_TEXT.slice(p.to))
  assert.notEqual(out, SAMPLE_TEXT)
  // after editing the doc the proposal must be refused
  assert.equal(checkProposal('X' + SAMPLE_TEXT, p).ok, false)
})

test('off-topic prompts are refused without a model', async () => {
  const res = await runAssistant({ prompt: 'write me a poem about the sea', doc: { text: SAMPLE_TEXT } })
  assert.equal(res.status, 'refused')
  assert.ok(res.trace.some(t => t.step === 'scope' && !t.ok))
})

test('aliasProposal only spells out aliases the posting uses, and never touches other lines', () => {
  const text = 'Skills\n- Built services in JS and k8s\n- Fixed a  double space\n- Plain line'
  const kws = analyzeJobDescription('Requirements: JavaScript, Kubernetes, SQL')
  const r = aliasProposal(text, kws)
  assert.ok(r.proposal, 'expected a proposal')
  const after = r.proposal!.after
  assert.match(after, /JavaScript/)
  assert.match(after, /Kubernetes/)
  assert.ok(after.includes('Fixed a  double space'), 'style-only line is untouched')
  assert.equal(after.split('\n').length, text.split('\n').length)
  assert.equal(r.proposal!.before, text)
})

test('aliasProposal returns null when nothing applies, and does not throw on empty input', () => {
  assert.equal(aliasProposal(SAMPLE_TEXT, analyzeJobDescription(SAMPLE_JOB)).count >= 0, true)
  assert.equal(aliasProposal('', analyzeJobDescription('Python')).proposal, null)
  assert.equal(aliasProposal('Nothing here', analyzeJobDescription('')).proposal, null)
})
