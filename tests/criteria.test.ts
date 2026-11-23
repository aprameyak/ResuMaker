import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCriteria, evaluateCriteria, compareReports, CRITERIA_PRESETS } from '../lib/resume'
import { studentResume, messyResume, minimalResume, pipeResume, twoLineResume, noHeadingsResume } from './fixtures'

const NOW = new Date('2026-11-23')

function run(rule: string, text: string, pages?: number) {
  const { criteria, errors } = parseCriteria(rule)
  assert.deepEqual(errors, [], `rule should parse: ${rule}`)
  assert.equal(criteria.length, 1)
  const report = evaluateCriteria(text, criteria, { now: NOW, pages })
  return report.results[0]
}
const slices = (text: string, r: { locations: Array<{ from: number; to: number }> }) =>
  r.locations.map(l => text.slice(l.from, l.to))

const sample = `Ana Ruiz
ana@example.com

SUMMARY
Engineer who ships. I love small tools.

EXPERIENCE
Developer, Acme  Jan 2020 - Dec 2021
- Built a billing service in Python that handled 3M invoices a month with zero downtime across regions and teams and more words here
- Worked on the dashboard
- Led a migration to Kubernetes

Intern, Beta Corp  Sept 2018 - 06/2019
- My team shipped the importer

EDUCATION
State University
B.S. Computer Science, 2018

SKILLS
Python, SQL, K8s
`

test('max/min bullets per role', () => {
  const fail = run('max bullets per role: 2', sample)
  assert.equal(fail.pass, false)
  assert.deepEqual(slices(sample, fail), ['Developer, Acme  Jan 2020 - Dec 2021'])
  assert.equal(run('max bullets per role: 3', sample).pass, true)
  const under = run('min bullets per role: 2', sample)
  assert.equal(under.pass, false)
  assert.deepEqual(slices(sample, under), ['Intern, Beta Corp  Sept 2018 - 06/2019'])
  assert.equal(run('min bullets per role: 1', sample).pass, true)
})

test('bullet length points at the exact over-long bullet', () => {
  const r = run('max bullet length: 100', sample)
  assert.equal(r.pass, false)
  assert.equal(r.locations.length, 1)
  assert.ok(slices(sample, r)[0].startsWith('Built a billing service'))
  assert.ok(slices(sample, r)[0].endsWith('more words here'))
  assert.equal(run('max bullet length: 400 characters', sample).pass, true)
})

test('words per bullet', () => {
  const max = run('max words per bullet: 10', sample)
  assert.equal(max.pass, false)
  assert.equal(max.locations.length, 1)
  const min = run('min words per bullet: 5', sample)
  assert.equal(min.pass, false)
  assert.deepEqual(slices(sample, min), ['Worked on the dashboard'])
  assert.equal(run('min words per bullet: 3', sample).pass, true)
  assert.equal(run('max words per bullet: 40', sample).pass, true)
})

test('bullets with numbers percentage', () => {
  // 4 experience bullets, 1 has a digit => 25%
  const r = run('bullets with numbers: 50%', sample)
  assert.equal(r.pass, false)
  assert.equal(r.locations.length, 3)
  assert.match(r.detail, /25%/)
  assert.equal(run('bullets with numbers: 25%', sample).pass, true)
  assert.equal(run('bullets with numbers: 100%', 'Experience\n').pass, true)
})

test('must include uses aliases; must not include finds phrases with offsets', () => {
  assert.equal(run('must include: kubernetes, python', sample).pass, true)
  assert.equal(run('must include: k8s', 'SKILLS\nKubernetes, Go').pass, true)
  const miss = run('must include: Python, Rust, Terraform', sample)
  assert.equal(miss.pass, false)
  assert.match(miss.detail, /Rust, Terraform/)
  assert.equal(run('must include: js', 'I know JavaScript.').pass, true)

  const bad = run('must not include: Dashboard, SANDBOX', sample)
  assert.equal(bad.pass, false)
  assert.deepEqual(slices(sample, bad), ['dashboard'])
  assert.equal(run('must not include: rust', 'Trusted by many; trust me').pass, true)
  const phrase = run('must not include: references  available', 'ok\nReferences available on request')
  assert.deepEqual(slices('ok\nReferences available on request', phrase), ['References available'])
})

test('start bullets with a verb', () => {
  const r = run('start bullets with a verb', sample)
  assert.equal(r.pass, false)
  assert.deepEqual(slices(sample, r), ['Worked', 'My'])
  assert.equal(run('Start Bullets With A Verb', twoLineResume).pass, true)
  const odd = run('start bullets with a verb', 'EXPERIENCE\nDev, X  Jan 2020 - Feb 2020\n- 40% faster builds\n- The team grew\n- Responsible for QA\n- Cut costs\n')
  assert.equal(odd.locations.length, 3)
})

test('wrapped bullets are measured as one bullet', () => {
  const text = 'EXPERIENCE\nDev, X  Jan 2020 - Feb 2020\n- Designed idempotent retry logic that cut duplicate charges to\n  near zero across 3 regions\n'
  const r = run('max bullet length: 70', text)
  assert.equal(r.pass, false)
  assert.equal(slices(text, r)[0], 'Designed idempotent retry logic that cut duplicate charges to\n  near zero across 3 regions')
})

test('no first person', () => {
  const r = run('no first person', sample)
  assert.equal(r.pass, false)
  assert.deepEqual(slices(sample, r), ['I', 'My'])
  assert.equal(run('no first person', twoLineResume).pass, true)
  assert.equal(run('no first person', 'Software Engineer I\n- Built it').pass, true)
  assert.equal(run('no first person', "I've shipped a lot").pass, false)
})

test('max pages estimates from lines and accepts a measured override', () => {
  const long = Array.from({ length: 120 }, (_, i) => `line ${i}`).join('\n')
  const r = run('max pages: 2', long)
  assert.equal(r.pass, false)
  assert.match(r.detail, /3 pages/)
  assert.equal(run('max pages: 3', long).pass, true)
  assert.equal(run('max pages: 1', long, 1).pass, true)
  assert.equal(run('max pages: 1', 'short', undefined).pass, true)
  assert.equal(run('max pages: 1', '\n\n\n' + 'x\n'.repeat(54)).pass, true)
  assert.equal(run('max pages: 1', 'x\n'.repeat(55)).pass, false)
  assert.equal(run('max pages: 1', 'x', 2).pass, false)
})

test('max summary words', () => {
  const r = run('max summary words: 5', sample)
  assert.equal(r.pass, false)
  assert.equal(slices(sample, r)[0], 'Engineer who ships. I love small tools.')
  assert.equal(run('max summary words: 7', sample).pass, true)
  assert.equal(run('max summary words: 1', twoLineResume).pass, true)
  const inline = run('max summary words: 2', 'Summary: one two three four')
  assert.equal(inline.pass, false)
})

test('date format Mon YYYY flags exact dates', () => {
  const r = run('date format: Mon YYYY', sample)
  assert.equal(r.pass, false)
  assert.deepEqual(slices(sample, r), ['Sept 2018', '06/2019', '2018'])
  assert.equal(run('date format: Mon YYYY', studentResume).pass, true)
  assert.equal(run('date format: mon yyyy', messyResume).pass, false)
  // dates in bullets and summary are not header dates
  assert.equal(run('date format: Mon YYYY', 'EXPERIENCE\nDev, X  Jan 2020 - Feb 2020\n- Shipped in 2019\n').pass, true)
})

test('require sections', () => {
  assert.equal(run('require sections: experience, education, skills', sample).pass, true)
  const r = run('require sections: experience, projects, summary', studentResume)
  assert.equal(r.pass, false)
  assert.match(r.detail, /summary/)
  assert.equal(run('require sections: work experience', sample).pass, true)
  assert.equal(run('require sections: skills', minimalResume).pass, true)
  assert.equal(run('require sections: experience', noHeadingsResume).pass, false)
})

test('lint criteria use lintResume', () => {
  const dated = 'Ana\nana@example.com\n\nEXPERIENCE\nDev, Acme  Dec 2021 - Jan 2020\n- Built things\n'
  const e = run('no lint errors', dated)
  assert.equal(e.pass, false)
  assert.equal(slices(dated, e)[0], 'Dec 2021 - Jan 2020')
  assert.equal(run('no lint errors', studentResume).pass, true)
  const w = run('no lint warnings', studentResume)
  assert.equal(w.pass, false)
  assert.ok(w.locations.length > 0)
  assert.equal(run('no lint warnings', twoLineResume).pass, false) // no email
})

test('parse: comments, blanks, case, inline comments', () => {
  const { criteria, errors } = parseCriteria(`
# a comment
   # indented comment

MAX   Bullets Per Role : 05   # trailing note
must include: C#, c++, node.js
No First Person
`)
  assert.deepEqual(errors, [])
  assert.deepEqual(criteria.map(c => c.id), ['max bullets per role: 5', 'must include: c#, c++, node.js', 'no first person'])
  assert.deepEqual(criteria[1].params.terms, ['C#', 'c++', 'node.js'])
  assert.equal(criteria[0].kind, 'max-bullets-per-role')
  assert.deepEqual(criteria[0].params, { max: 5 })
})

test('parse errors carry 1-based line numbers and suggestions', () => {
  const src = [
    '# header',            // 1
    'max pages: 1',        // 2
    'max bulets per role: 4', // 3
    'max pages: lots',     // 4
    'max pages 2',         // 5
    'no first person: yes',// 6
    'date format: DD/MM/YYYY', // 7
    'require sections: experience, hobbies', // 8
    'bullets with numbers: 140%', // 9
    'must include:',       // 10
    'max pages: 1',        // 11 duplicate
    'make it pretty',      // 12
  ].join('\n')
  const { criteria, errors } = parseCriteria(src)
  assert.equal(criteria.length, 1)
  assert.deepEqual(errors.map(e => e.line), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  assert.match(errors[0].message, /Did you mean "max bullets per role: 5"/)
  assert.match(errors[1].message, /whole number/)
  assert.match(errors[2].message, /Missing colon.*"max pages: 2"/)
  assert.match(errors[3].message, /takes no value/)
  assert.match(errors[4].message, /Mon YYYY/)
  assert.match(errors[5].message, /hobbies/)
  assert.match(errors[6].message, /above 100/)
  assert.match(errors[7].message, /needs a value/)
  assert.match(errors[8].message, /Duplicate/)
  assert.equal(errors[9].text, 'make it pretty')
  assert.match(errors[9].message, /Did you mean/)
})

test('parse never throws on garbage', () => {
  for (const s of ['', '\n\n', ':', '::::', '#', 'max pages:', '\u0000\u0001', 'x'.repeat(100000), null as unknown as string, undefined as unknown as string]) {
    const r = parseCriteria(s)
    assert.ok(Array.isArray(r.criteria) && Array.isArray(r.errors))
  }
  assert.equal(parseCriteria('\r\nmax pages: 1\r\n').criteria.length, 1)
})

test('presets parse with zero errors and evaluate sanely', () => {
  assert.deepEqual(Object.keys(CRITERIA_PRESETS).sort(), ['ats-safe', 'one-page-student', 'swe-industry'])
  const fixtures = { studentResume, messyResume, minimalResume, pipeResume, twoLineResume, noHeadingsResume }
  for (const [name, src] of Object.entries(CRITERIA_PRESETS)) {
    const { criteria, errors } = parseCriteria(src)
    assert.deepEqual(errors, [], name)
    assert.ok(criteria.length >= 5, name)
    for (const [fname, text] of Object.entries(fixtures)) {
      const rep = evaluateCriteria(text, criteria, { now: NOW })
      assert.equal(rep.total, criteria.length, `${name}/${fname}`)
      assert.equal(rep.passed + rep.failed, rep.total)
      assert.ok(Number.isInteger(rep.score) && rep.score >= 0 && rep.score <= 100)
    }
  }
  const student = parseCriteria(CRITERIA_PRESETS['one-page-student']).criteria
  const good = evaluateCriteria(studentResume, student, { now: NOW })
  const bad = evaluateCriteria(noHeadingsResume, student, { now: NOW })
  assert.ok(good.score >= 70, `student score ${good.score}`)
  assert.ok(bad.results.find(r => r.criterion.id.startsWith('require sections'))!.pass === false)
  const failedIds = good.results.filter(r => !r.pass).map(r => r.criterion.id)
  assert.ok(failedIds.includes('start bullets with a verb'), 'student resume has "Worked on" bullet')
})

test('empty criteria score 100; empty resume does not throw', () => {
  const rep = evaluateCriteria('anything', [])
  assert.deepEqual([rep.score, rep.total, rep.passed, rep.failed], [100, 0, 0, 0])
  const { criteria } = parseCriteria(Object.values(CRITERIA_PRESETS).join('\n'))
  const r = evaluateCriteria('', criteria, { now: NOW })
  assert.equal(r.total, criteria.length)
  for (const x of r.results) assert.deepEqual(x.locations.filter(l => l.to > 0), [])
})

test('compareReports finds regressions and fixes by stable id', () => {
  const { criteria } = parseCriteria('no first person\nmax pages: 1\nmust include: python\nstart bullets with a verb')
  const before = evaluateCriteria(sample, criteria, { now: NOW })
  const edited = sample.replace('- My team shipped the importer', '- Shipped the importer').replace('Python, SQL, K8s', 'SQL, K8s').replace('in Python', 'in Go').replace('I love', 'Loves')
  const after = evaluateCriteria(edited, parseCriteria('  NO   first person  # again\nmax pages: 1\nmust include: Python\nstart bullets with a verb').criteria, { now: NOW })
  const cmp = compareReports(before, after)
  assert.ok(cmp.fixed.includes('no first person'))
  assert.deepEqual(cmp.regressed, ['must include: python'])
  assert.equal(cmp.scoreDelta, after.score - before.score)
  assert.deepEqual(compareReports(before, before), { regressed: [], fixed: [], scoreDelta: 0 })
})

test('fuzz: never throws and every range is in bounds', () => {
  const { criteria } = parseCriteria(Object.values(CRITERIA_PRESETS).join('\n') + '\nmust include: go, c, r\nmin words per bullet: 3\nmax words per bullet: 5\nbullets with numbers: 10%\nmax summary words: 3\nno lint warnings')
  const alphabet = ['•', '- ', '\n', '\r\n', '  ', 'EXPERIENCE', 'Skills:', 'Summary', 'I ', 'my ', 'Jan 2020', ' - ', 'Present', '06/2019', '40%', 'Built ', 'Go', 'k8s', '😀', '\u0000', '#', '(', ')', '\\', '.', 'x', 'Engineer', ', Acme']
  let seed = 12345
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
  for (let i = 0; i < 400; i++) {
    let s = ''
    const n = Math.floor(rnd() * 60)
    for (let j = 0; j < n; j++) s += alphabet[Math.floor(rnd() * alphabet.length)]
    const rep = evaluateCriteria(s, criteria, { now: NOW })
    assert.equal(rep.total, criteria.length)
    for (const r of rep.results) {
      for (const l of r.locations) {
        assert.ok(Number.isInteger(l.from) && Number.isInteger(l.to) && l.from >= 0 && l.from <= l.to && l.to <= s.length, JSON.stringify(s))
      }
    }
  }
})

test('performance: 200k chars across every criterion stays fast', () => {
  const block = studentResume + '\n'
  const text = block.repeat(Math.ceil(200_000 / block.length)).slice(0, 200_000)
  const { criteria } = parseCriteria(Object.values(CRITERIA_PRESETS).join('\n') + '\nmust include: kubernetes, terraform\nmust not include: redis\nno lint warnings')
  const start = performance.now()
  const rep = evaluateCriteria(text, criteria, { now: NOW })
  const ms = performance.now() - start
  assert.equal(rep.total, criteria.length)
  assert.ok(ms < 3000, `took ${ms}ms`)
  for (const r of rep.results) assert.ok(r.locations.length <= 500)
})
