import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildView, atsText, roundTrip, toDiagnostics, safeLint, parseCriteriaSafe, evaluateSafe, maxPagesRule, headerText, ANALYSIS_LIMIT, MAX_DIAGNOSTICS, countBySeverity,
} from '../app/ide/analysis'
import { SAMPLE_TEXT } from '../app/ide/sample'

test('view model of the sample has header, sections, roles and bullets', () => {
  const v = buildView(SAMPLE_TEXT)
  assert.equal(v.header.name, 'Priya Natarajan')
  assert.ok(v.header.contact.some(c => c.includes('@')))
  assert.equal(v.resume.experience.length, 2)
  assert.equal(v.resume.experience[0].responsibilities.length, 4)
  assert.equal(v.resume.education.length, 1)
  assert.ok(v.resume.skills.technical.includes('Python'))
  assert.equal(v.empty, false)
  assert.deepEqual(v.notes, [])
})

test('empty, whitespace, headingless and garbage input degrade without throwing', () => {
  const e = buildView('')
  assert.equal(e.empty, true)
  assert.equal(atsText(e), '')
  assert.equal(buildView('   \n\n ').empty, true)

  const loose = buildView('Jane Doe\njane@example.com\n\nI do many things.\nAnd more things.')
  assert.equal(loose.header.name, 'Jane Doe')
  assert.ok(loose.loose.length >= 2)
  assert.ok(loose.notes.some(n => /No section headings/.test(n)))
  assert.match(atsText(loose), /I do many things/)

  for (const junk of ['\u0000\u0001\u0002', '((((', '- - - -\n- - -', '\n\n\nEXPERIENCE\n', 'SKILLS:', '###', 'a'.repeat(10_000), '\r\n\r\nEXPERIENCE\r\n- x\r\n']) {
    const v = buildView(junk)
    atsText(v)
    roundTrip(v, atsText(v), junk)
  }
})

test('unknown all-caps sections are kept in the view and the ATS text', () => {
  const text = SAMPLE_TEXT + '\nCERTIFICATIONS\n- AWS Certified Developer\n- CKA\n'
  const v = buildView(text)
  assert.equal(v.other.length, 1)
  assert.equal(v.other[0].title, 'CERTIFICATIONS')
  assert.deepEqual(v.other[0].lines, ['- AWS Certified Developer', '- CKA'])
  const ats = atsText(v)
  assert.match(ats, /CERTIFICATIONS\n- AWS Certified Developer\n- CKA/)
  assert.ok(ats.indexOf('SKILLS') < ats.indexOf('CERTIFICATIONS'))
})

test('ATS text puts the header first and sections in print order', () => {
  const ats = atsText(buildView(SAMPLE_TEXT))
  assert.ok(ats.startsWith(headerText(buildView(SAMPLE_TEXT).header)))
  const order = ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS'].map(h => ats.indexOf(h))
  assert.deepEqual(order, order.slice().sort((a, b) => a - b))
  assert.ok(order.every(i => i >= 0))
})

test('round trip of the sample keeps everything', () => {
  const v = buildView(SAMPLE_TEXT)
  const trip = roundTrip(v, atsText(v), SAMPLE_TEXT)
  assert.equal(trip.ok, true, JSON.stringify(trip))
})

test('round trip flags content that does not survive', () => {
  const v = buildView(SAMPLE_TEXT)
  const trip = roundTrip(v, 'Priya Natarajan\n', SAMPLE_TEXT)
  assert.equal(trip.ok, false)
  assert.ok(trip.rows.find(r => r.label === 'Experience roles' && !r.ok))
  assert.ok(trip.lost.length > 0)
})

test('diagnostics: severity, source, fix actions and clamped ranges', () => {
  const problems = safeLint(SAMPLE_TEXT)
  const d = toDiagnostics(problems, null, SAMPLE_TEXT.length)
  assert.equal(d.length, problems.length)
  assert.ok(d.every(x => x.source === 'lint' && x.from >= 0 && x.to <= SAMPLE_TEXT.length && x.to > x.from))
  const fixable = d.filter(x => x.actions.length)
  assert.equal(fixable.length, problems.filter(p => p.fix).length)
  assert.ok(fixable[0].actions[0].change.insert !== undefined)
  // empty doc and zero-width ranges never produce invalid diagnostics
  assert.deepEqual(toDiagnostics([{ from: 0, to: 0, severity: 'info', rule: 'x', message: 'm' }], null, 0), [])
  const z = toDiagnostics([{ from: 5, to: 5, severity: 'info', rule: 'x', message: 'm' }], null, 5)
  assert.deepEqual([z[0].from, z[0].to], [4, 5])
})

test('criteria diagnostics are info-level with source "criteria" and only for failing results', () => {
  const { criteria, errors } = parseCriteriaSafe('no first person\nmax bullet length: 20\nrequire sections: experience')
  assert.deepEqual(errors, [])
  const report = evaluateSafe(SAMPLE_TEXT, criteria, 1)!
  const d = toDiagnostics([], report, SAMPLE_TEXT.length)
  assert.ok(d.length > 0)
  assert.ok(d.every(x => x.source === 'criteria' && x.severity === 'info'))
  const failing = report.results.filter(r => !r.pass).reduce((n, r) => n + r.locations.length, 0)
  assert.equal(d.length, failing)
})

test('measured pages flow into the max pages rule', () => {
  const { criteria } = parseCriteriaSafe('max pages: 1')
  assert.equal(maxPagesRule(criteria), 1)
  assert.equal(evaluateSafe(SAMPLE_TEXT, criteria, 2)!.results[0].pass, false)
  assert.equal(evaluateSafe(SAMPLE_TEXT, criteria, 1)!.results[0].pass, true)
  assert.equal(evaluateSafe(SAMPLE_TEXT, [], 1), null)
  assert.equal(maxPagesRule([]), null)
})

test('criteria parse errors carry line numbers', () => {
  const { errors } = parseCriteriaSafe('max pages: 1\nbogus rule\nmax pages: x')
  assert.deepEqual(errors.map(e => e.line), [2, 3])
})

test('diagnostics are capped', () => {
  const many = Array.from({ length: 5000 }, (_, i) => ({ from: i, to: i + 1, severity: 'info' as const, rule: 'r', message: 'm' }))
  assert.equal(toDiagnostics(many, null, 6000).length, MAX_DIAGNOSTICS)
})

test('200k characters analyse well inside a second', () => {
  const big = SAMPLE_TEXT.repeat(Math.ceil(ANALYSIS_LIMIT / SAMPLE_TEXT.length) + 1)
  assert.ok(big.length > ANALYSIS_LIMIT)
  const t = Date.now()
  const v = buildView(big)
  const problems = safeLint(big)
  const ats = atsText(v)
  roundTrip(v, ats, big)
  toDiagnostics(problems, null, big.length)
  const ms = Date.now() - t
  assert.ok(ms < 1000, `took ${ms}ms`)
  assert.equal(v.truncated, true)
  assert.ok(v.notes.some(n => /first 200,000/.test(n)))
  const sev = countBySeverity(problems)
  assert.ok(sev.warning > 0)
})

test('exactly the analysis limit still shows the cap note', () => {
  const exact = 'x'.repeat(ANALYSIS_LIMIT)
  const v = buildView(exact)
  assert.equal(v.truncated, true)
  assert.equal(exact.length, ANALYSIS_LIMIT)
  assert.ok(v.notes.some(n => /first 200,000/.test(n)))
})
