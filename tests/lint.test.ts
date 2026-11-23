import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lintResume, applyFixes } from '../lib/resume'
import { studentResume, messyResume, twoLineResume } from './fixtures'

const NOW = new Date('2026-11-23')
const by = (text: string, rule: string) => lintResume(text, NOW).filter(p => p.rule === rule)

test('every problem range points at exactly the text it describes', () => {
  const text = `Ana Ruiz\nana@example.com\n\nEXPERIENCE\nDev, Acme  Jan 2020 - Dec 2021\n- Responsible for managing the billing service\n- I built a cache in Javascript with Github\n- Worked on the the dashboard\n`
  const slice = (rule: string) => { const p = by(text, rule)[0]; return text.slice(p.from, p.to) }
  assert.equal(slice('responsible-for'), 'Responsible for managing')
  assert.equal(slice('first-person'), 'I b')
  assert.equal(slice('capitalization'), 'Javascript')
  assert.equal(slice('weak-opener'), 'Worked on')
  assert.equal(slice('repeated-word'), 'the the')
})

test('fixes apply cleanly and the result is lint-clean for those rules', () => {
  const text = `Ana Ruiz\nana@example.com\n\nEXPERIENCE\nDev, Acme  Jan 2020 - Dec 2021\n- Responsible for managing the billing service\n- I built a cache in Javascript with Github\n`
  const fixed = applyFixes(text, lintResume(text, NOW))
  assert.match(fixed, /- Managed the billing service/)
  assert.match(fixed, /- Built a cache in JavaScript with GitHub/)
  const left = lintResume(fixed, NOW).map(p => p.rule)
  for (const rule of ['responsible-for', 'first-person', 'capitalization']) assert.ok(!left.includes(rule), rule)
  assert.equal(applyFixes(fixed, lintResume(fixed, NOW)), fixed, 'fixing is idempotent')
})

test('date order and future dates are caught, "Present" is not an error', () => {
  const bad = 'Sam\ns@x.com\nEXPERIENCE\nEngineer, Co  Mar 2022 - Jan 2021\n- Built things for the company\n'
  const p = by(bad, 'date-order')
  assert.equal(p.length, 1)
  assert.equal(p[0].severity, 'error')
  assert.equal(bad.slice(p[0].from, p[0].to), 'Mar 2022 - Jan 2021')
  assert.equal(by('Sam\ns@x.com\nEXPERIENCE\nEngineer, Co  Mar 2021 - Present\n- Built things for the company\n', 'date-order').length, 0)
  assert.equal(by('Sam\ns@x.com\nEXPERIENCE\nEngineer, Co  Mar 2031 - Present\n- Built things for the company\n', 'future-start').length, 1)
})

test('role-level checks: numbers, bullet count, repeated verbs', () => {
  const t = 'Sam\ns@x.com\nEXPERIENCE\nEngineer, Co  Mar 2021 - Present\n- Built the API for payments\n- Built the UI for payments\n'
  assert.equal(by(t, 'no-numbers').length, 1)
  assert.equal(by(t, 'repeated-verb').length, 1)
  assert.equal(by('Sam\ns@x.com\nEXPERIENCE\nEngineer, Co  Mar 2021 - Present\n- Cut latency by 40% on the API\n', 'few-bullets').length, 1)
  const withNumbers = 'Sam\ns@x.com\nEXPERIENCE\nEngineer, Co  Mar 2021 - Present\n- Cut latency by 40% on the API\n- Shipped 3 releases in one quarter\n'
  assert.equal(by(withNumbers, 'no-numbers').length, 0)
})

test('document-level checks', () => {
  assert.equal(by('Sam\nNo contact here\nEXPERIENCE\nEngineer, Co  2020 - 2021\n- Did a thing\n', 'no-email').length, 1)
  assert.equal(by('just some text with no headings', 'no-sections').length, 1)
  assert.deepEqual(lintResume('', NOW), [])
  assert.deepEqual(lintResume('   \n\n', NOW), [])
})

test('good resumes are not drowned in noise', () => {
  for (const text of [studentResume, messyResume, twoLineResume]) {
    const problems = lintResume(text, NOW)
    assert.ok(problems.filter(p => p.severity === 'error').length === 0, 'no false errors')
    assert.ok(problems.length <= 8, `too noisy: ${problems.map(p => p.rule).join(',')}`)
  }
})

test('lint never throws and ranges stay inside the document', () => {
  let x = 7
  const rnd = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  const alphabet = 'abc XYZ019\n•-–|,.():/@ Responsible for I the Javascript'
  for (let i = 0; i < 400; i++) {
    let s = i % 3 === 0 ? 'EXPERIENCE\n' : ''
    const len = Math.floor(rnd() * 500)
    for (let j = 0; j < len; j++) s += alphabet[Math.floor(rnd() * alphabet.length)]
    const problems = lintResume(s, NOW)
    for (const p of problems) {
      assert.ok(p.from >= 0 && p.to <= s.length && p.from <= p.to, `bad range ${p.from}-${p.to} of ${s.length}`)
      if (p.fix) assert.ok(p.fix.from >= 0 && p.fix.to <= s.length)
    }
    assert.doesNotThrow(() => applyFixes(s, problems))
  }
})
