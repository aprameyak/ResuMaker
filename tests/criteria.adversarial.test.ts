import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCriteria, evaluateCriteria, compareReports, CRITERIA_PRESETS } from '../lib/resume'

// BUG:   asserts the CORRECT behaviour, fails until criteria.ts (or the shared parse/lint/keywords code) is fixed.
// NOTE:  documents debatable current behaviour, passes.
// HOLDS: attack that the implementation survived, passes.

const NOW = new Date('2026-11-23')

function run(rule: string, text: string, pages?: number) {
  const { criteria, errors } = parseCriteria(rule)
  assert.deepEqual(errors, [], `rule should parse: ${rule}`)
  assert.equal(criteria.length, 1)
  const r = evaluateCriteria(text, criteria, { now: NOW, pages }).results[0]
  return Object.assign(r, { slices: r.locations.map(l => text.slice(l.from, l.to)) })
}

const HEAD = 'Ana Ruiz\nana@example.com\n\n'
const JOB = 'Dev, Acme  Jan 2020 - Dec 2021'

// ------------------------------------------------------------------ BUGS

test('BUG: capitalised / unindented wrapped bullet line splits the role and truncates the bullet', () => {
  // PDF paste: wrapped line starts with a digit or proper noun and has no indent.
  const t = `${HEAD}EXPERIENCE\n${JOB}\n- Reduced latency across the platform by\n40% through caching\n- Built things\n- Led things\n`
  // one role, three bullets
  assert.equal(run('min bullets per role: 3', t).pass, true, 'one role with 3 bullets was reported as 2 roles')
  // first bullet is 70+ chars once the wrapped line is included
  assert.equal(run('max bullet length: 50', t).pass, false, 'bullet was measured without its wrapped second line')
})

test('BUG: a non-bullet line after bullets ("Environment: Linux") becomes a phantom role', () => {
  const t = `${HEAD}EXPERIENCE\n${JOB}\n- Built things\n- Led things\nEnvironment: Linux\n`
  assert.equal(run('min bullets per role: 2', t).pass, true, 'phantom role "Environment: Linux" with 0 bullets')
  const t2 = `${HEAD}EXPERIENCE\n${JOB}\n- Built things\n- Led things\nTools used: Linux and Git\n`
  assert.equal(run('min bullets per role: 2', t2).pass, true)
})

test('BUG: an unrecognised heading (CERTIFICATIONS) inside the experience flow becomes a role', () => {
  const t = `${HEAD}EXPERIENCE\n${JOB}\n- Built things\n- Led things\n- Ran things\n\nCERTIFICATIONS\n- BLS certified\n`
  assert.equal(run('min bullets per role: 2', t).pass, true, 'CERTIFICATIONS was counted as a 1-bullet role')
})

test('BUG: "Clinical Experience" is not recognised as an experience section', () => {
  const t = `Maria\nm@x.com\n\nCLINICAL EXPERIENCE\nRN, Mercy Hospital  Jan 2020 - Dec 2021\n- Administered medications\n`
  assert.equal(run('require sections: experience', t).pass, true)
})

test('BUG: no first person flags the US state ME', () => {
  assert.equal(run('no first person', 'Ana\nPortland, ME 04101\n- Built things').pass, true)
})

test('BUG: no first person flags the domain me.com and a name like Remy', () => {
  assert.equal(run('no first person', 'Ana\nana@me.com\n- Built things').pass, true, 'me.com')
  assert.equal(run('no first person', 'Rémy Dupont\n- Built things').pass, true, 'Rémy (JS \\b treats é as non-word)')
  assert.equal(run('no first person', 'Ana\nhttps://my-portfolio.dev\n').pass, true, 'my-portfolio.dev')
})

test('BUG: no first person flags Roman numeral I ("Phase I and II trials")', () => {
  assert.equal(run('no first person', 'EXPERIENCE\n- Coordinated Phase I and II clinical trials').pass, true)
  assert.equal(run('no first person', 'EXPERIENCE\n- Treated Type I and Type II diabetes').pass, true)
})

test('BUG: no first person misses a capitalised pronoun ("I Led the team")', () => {
  assert.equal(run('no first person', 'EXPERIENCE\n- I Led the team').pass, false)
})

test('BUG: must include: go misses Go in a skills line with a label or bullet', () => {
  for (const line of ['Languages: Go, Python', '- Go', 'Python | Go | SQL', 'Python; Go']) {
    assert.equal(run('must include: go', 'SKILLS\n' + line).pass, true, line)
  }
})

test('BUG: trailing period on the last must-include term is kept in the term', () => {
  const r = run('must include: python, sql.', 'Python, SQL')
  assert.equal(r.pass, true, r.detail)
})

test('BUG: must include: constructor / __proto__ hit Object.prototype via ALIASES and cannot be evaluated', () => {
  assert.equal(run('must include: constructor', 'Used constructor injection in Java').pass, true)
  assert.equal(run('must include: constructor', 'no such word').detail.startsWith('Missing'), true)
  assert.equal(run('must include: __proto__', 'x').detail.startsWith('Could not evaluate'), false)
})

test('BUG: lint reports a date-order error for "Mar 2020 - Spring 2020" and "Sep 2019 - Fall 2019"', () => {
  for (const range of ['Mar 2020 - Spring 2020', 'Sep 2019 - Fall 2019']) {
    const t = `${HEAD}EXPERIENCE\nDev, Acme  ${range}\n- Built\n- Ran\n\nEDUCATION\nU\n\nSKILLS\nA`
    assert.equal(run('no lint errors', t).pass, true, range)
  }
})

test('BUG: lint (no lint errors / warnings) is quadratic on one long header token', () => {
  const t = 'x'.repeat(40_000) // ~1.3 s today; 200k chars takes ~18 s
  for (const rule of ['no lint errors', 'no lint warnings']) {
    const start = Date.now()
    run(rule, t)
    assert.ok(Date.now() - start < 500, `${rule} took ${Date.now() - start} ms on 40k chars`)
  }
})

test('BUG: start with a verb passes non-verbs (any alphabetic word not on a small stoplist)', () => {
  for (const b of ['Strong leadership skills', 'Experienced in sales', 'Customer satisfaction improved 20%', 'Over 5 years of nursing', 'Proficient in Excel']) {
    assert.equal(run('start bullets with a verb', `EXPERIENCE\n${JOB}\n- ${b}`).pass, false, b)
  }
})

test('BUG: start with a verb rejects hyphenated / accented / slashed verbs', () => {
  for (const b of ['Co-founded a startup', 'Re-engineered the API', 'Cross-trained 12 staff', 'Wrote/edited manuals', 'Développé une API']) {
    assert.equal(run('start bullets with a verb', `EXPERIENCE\n${JOB}\n- ${b}`).pass, true, b)
  }
})

test('BUG: bullets using ► ✓ ➢ ‣ ∙ are not recognised (shared BULLET regex)', () => {
  for (const mark of ['►', '✓', '➢', '‣', '∙']) {
    const r = run('max bullet length: 5', `EXPERIENCE\n${JOB}\n${mark} Built the long thing here\n`)
    assert.equal(r.pass, false, mark)
  }
})

test('BUG: an indented role header without a date after a bullet is swallowed into that bullet', () => {
  const t = 'EXPERIENCE\n  Dev, Acme  Jan 2020 - Dec 2021\n  - C d\n  Senior Dev\n  Beta Corp  Jan 2018 - Dec 2019\n  - E f\n'
  assert.equal(run('max words per bullet: 3', t).pass, true, '"Senior Dev" was appended to bullet "C d"')
})

test('BUG: max summary words ignores a bulleted summary', () => {
  const r = run('max summary words: 3', 'SUMMARY\n- one two three four five six\n\nEXPERIENCE\n- x')
  assert.equal(r.pass, false)
})

test('BUG: bullets with numbers compares a rounded percentage (1 of 3 = 33.33...% should meet 33.33%)', () => {
  const r = run('bullets with numbers: 33.33%', `EXPERIENCE\n${JOB}\n- a 1\n- b\n- c`)
  assert.equal(r.pass, true, r.detail)
})

test('BUG: score rounds up to 100 while a criterion fails', () => {
  const lines = Array.from({ length: 199 }, (_, i) => `max bullets per role: ${i + 1}`).concat('must include: zzzzqq')
  const { criteria, errors } = parseCriteria(lines.join('\n'))
  assert.deepEqual(errors, [])
  const rep = evaluateCriteria('EXPERIENCE\n- x', criteria, { now: NOW })
  assert.equal(rep.failed, 1)
  assert.ok(rep.score < 100, `score ${rep.score} with ${rep.failed} failing`)
})

// ------------------------------------------------------------------ NOTES (debatable, pass today)

test('NOTE: Worked/Helped/Assisted are treated as non-verbs (weak-verb policy, not grammar)', () => {
  for (const b of ['Worked on the API', 'Helped customers', 'Assisted nurses']) {
    assert.equal(run('start bullets with a verb', `EXPERIENCE\n${JOB}\n- ${b}`).pass, false, b)
  }
})

test('NOTE: conflicting rules (max 2 + min 4) and must/must-not include of the same term are accepted silently', () => {
  assert.deepEqual(parseCriteria('max bullets per role: 2\nmin bullets per role: 4').errors, [])
  assert.deepEqual(parseCriteria('must include: python\nmust not include: python').errors, [])
})

test('NOTE: no first person ignores we / our / us', () => {
  assert.equal(run('no first person', 'EXPERIENCE\n- We shipped our product to us').pass, true)
})

test('NOTE: ASP.NET / VB.NET do not satisfy must include: .net', () => {
  assert.equal(run('must include: .net', 'ASP.NET Core').pass, false)
  assert.equal(run('must include: .net', 'C#, .NET 8').pass, true)
})

test('NOTE: must not include: c matches the C in C++ (boundary is alnum only)', () => {
  assert.equal(run('must not include: c', 'C++, Java').pass, false)
})

test('NOTE: date format ignores "Jan \'20" and flags any 19xx/20xx number on a header line', () => {
  assert.equal(run('date format: Mon YYYY', `EXPERIENCE\nDev, Acme Jan '20 - Dec '21\n- x`).pass, true)
  assert.equal(run('date format: Mon YYYY', `EXPERIENCE\nDev, Suite 2000 Acme  Jan 2020 - Dec 2021\n- x`).pass, false)
  assert.equal(run('date format: Mon YYYY', `EDUCATION\nState University, 2018\n`).pass, false, 'bare year counts as non-Mon-YYYY')
})

test('NOTE: lone CR line endings (classic Mac) are not split into lines', () => {
  assert.equal(run('max bullet length: 5', 'EXPERIENCE\r- Built the long thing here\r- two long thing here ok').pass, true)
})

test('NOTE: nested bullets count toward a role, fullwidth colon in a rule is an error, page estimate ignores wrapping', () => {
  assert.equal(run('max bullets per role: 2', `EXPERIENCE\n${JOB}\n- A one\n  - sub one\n  - sub two\n`).pass, false)
  assert.equal(parseCriteria('max pages： 1').errors.length, 1)
  const longLines = ('word '.repeat(300) + '\n').repeat(10) // ~10 lines but ~10 pages of text
  assert.equal(run('max pages: 1', longLines).pass, true)
})

test('NOTE: zero experience bullets makes bullets-with-numbers: 100% and min bullets per role pass vacuously', () => {
  assert.equal(run('bullets with numbers: 100%', 'EXPERIENCE\n').pass, true)
  assert.equal(run('min bullets per role: 5', 'Just a name').pass, true)
})

// ------------------------------------------------------------------ HOLDS

const nursing = [
  'Siobhán Ó Briain, RN',
  'siobhan@example.ie\t|\t+353 1 234 5678',
  '',
  'PROFESSIONAL SUMMARY:',
  '“Compassionate” nurse with 8 years in ICU.',
  '',
  'WORK EXPERIENCE:',
  'Staff Nurse\tSt. Vincent’s Hospital\tSept 2018 – Present',
  '•\tAdministered medications to 12 patients per shift with 99% accuracy and',
  '   documented every dose in the EHR',
  '  ◦ Precepted 4 new graduate nurses 🏥',
  '● Led 𝒹𝒶𝒾𝓁𝓎 safety huddles (café é́)',
  '',
  'EDUCATION:',
  'University College Dublin  May 2018',
  '',
  'SKILLS:',
  '• BLS',
  '• ACLS',
].join('\n')

const retail = [
  'JOSÉ MÜLLER', 'jose@example.com', '', 'PROFILE', 'Retail associate. I enjoy people.', '', 'EMPLOYMENT HISTORY',
  'Cashier – Target  06/2019 – 08/2021', '* Processed 200+ transactions daily', '* Trained 3 new hires', '', 'EDUCATION', 'Lincoln High School, 2019', '', 'SKILLS', 'POS, inventory, Excel',
].join('\n')

const finance = [
  'Wei Zhang', 'wei@example.com', '', 'Summary', 'Analyst. My focus is credit risk.', '', 'Experience',
  'Senior Analyst, Big Bank  Jan 2018 - Present', '1) Modeled $4.2M loss portfolio', '2) Cut close time by 35%', '', 'Education', 'MBA, NYU Stern  2017', 'Skills', 'SQL, Excel, R, Python',
].join('\n')

const ALL_RULES = [
  'max bullets per role: 1', 'min bullets per role: 3', 'max bullet length: 20', 'max words per bullet: 3', 'min words per bullet: 9',
  'bullets with numbers: 100%', 'must not include: nurse, cashier, loss, i, é', 'start bullets with a verb', 'no first person',
  'max summary words: 2', 'date format: Mon YYYY', 'no lint errors', 'no lint warnings',
].join('\n')

test('HOLDS: every location is in range and slices to the same text under LF and CRLF (tabs, smart quotes, astral, combining)', () => {
  const { criteria, errors } = parseCriteria(ALL_RULES)
  assert.deepEqual(errors, [])
  for (const lf of [nursing, retail, finance]) {
    const a = evaluateCriteria(lf, criteria, { now: NOW })
    const crlfText = lf.replace(/\n/g, '\r\n')
    const b = evaluateCriteria(crlfText, criteria, { now: NOW })
    assert.equal(a.results.length, b.results.length)
    a.results.forEach((ra, i) => {
      const rb = b.results[i]
      assert.equal(ra.pass, rb.pass, ra.criterion.id)
      const norm = (t: string, ls: Array<{ from: number; to: number }>) => ls.map(l => {
        assert.ok(l.from >= 0 && l.from <= l.to && l.to <= t.length, `${ra.criterion.id} out of range`)
        return t.slice(l.from, l.to).replace(/\r\n/g, '\n')
      })
      assert.deepEqual(norm(lf, ra.locations), norm(crlfText, rb.locations), ra.criterion.id)
    })
  }
})

test('HOLDS: exact slices on the nursing resume (wrapped bullet, astral char, combining mark)', () => {
  assert.equal(run('max bullet length: 60', nursing).slices.length, 1)
  const w = run('max words per bullet: 12', nursing)
  assert.equal(w.slices[0], 'Administered medications to 12 patients per shift with 99% accuracy and\n   documented every dose in the EHR')
  assert.deepEqual(run('must not include: 🏥, é', nursing).slices, ['🏥', 'é'])
  assert.deepEqual(run('must not include: café', nursing).slices, ['café'])
  assert.equal(run('require sections: experience, education, skills, summary', nursing).pass, true)
  assert.deepEqual(run('date format: Mon YYYY', nursing).slices, ['Sept 2018'])
})

test('HOLDS: multi-word banned term matches across a line break and CRLF with correct span', () => {
  const t = 'A\r\n- Responsible\r\n  for things\r\n'
  const r = run('must not include: responsible for', t)
  assert.deepEqual(r.slices, ['Responsible\r\n  for'])
})

test('HOLDS: all-caps headings with colons, missing headings, skills-as-bullets, two-column paste', () => {
  assert.equal(run('require sections: experience, education, skills', finance).pass, true)
  assert.equal(run('require sections: experience', 'Ana\n- Built\n').pass, false)
  // skills bullets are not verb-checked
  assert.equal(run('start bullets with a verb', nursing + '\n• 24/7 coverage').pass, true)
  const twoCol = 'EXPERIENCE                                SKILLS\nDev, Acme  Jan 2020 - Dec 2021            Python, SQL\n- Built a thing                           Go\n- Ran a thing\n'
  assert.doesNotThrow(() => evaluateCriteria(twoCol, parseCriteria(ALL_RULES).criteria, { now: NOW }))
})

test('HOLDS: DSL spacing, case, comments, # in terms, aliases, zero/huge/negative/decimal values', () => {
  const src = [
    '  MAX   PAGES :   2  ', '# comment', 'must include: C#, F# # trailing comment', 'must include:   c++ ,  .NET,Node.js , CI/CD, AWS, R,',
    'Max Bullet Length: 160 CHARS.', 'no first person.', 'start bullets with verbs', 'min words per bullet: 0',
    'max bullets per role: 99999999999999999999', 'bullets with numbers: 0%',
  ].join('\r\n')
  const { criteria, errors } = parseCriteria(src)
  assert.deepEqual(errors, [])
  assert.equal(criteria.length, 9)
  assert.deepEqual(criteria[1].params.terms, ['C#', 'F#'])
  assert.deepEqual(criteria[2].params.terms, ['c++', '.NET', 'Node.js', 'CI/CD', 'AWS', 'R'])
  for (const bad of ['max pages: 0', 'max pages: -1', 'max pages: 1.5', 'max pages: 1e3', 'max bullet length: 0', 'bullets with numbers: 101%', 'bullets with numbers: 40',
    'bullets with numbers: -5%', 'must include:', 'must include: ,,,', 'max pages', 'max pages 2', 'date format: DD/MM/YYYY', 'require sections: hobbies', 'no first person: yes']) {
    assert.equal(parseCriteria(bad).errors.length, 1, bad)
    assert.equal(parseCriteria(bad).criteria.length, 0, bad)
  }
  assert.equal(parseCriteria('max pages: 1\nmax pages: 01').errors.length, 1, 'duplicate after canonicalisation')
  assert.equal(run('bullets with numbers: 100%', `EXPERIENCE\n${JOB}\n- a 1\n- b 2`).pass, true)
  assert.equal(run('bullets with numbers: 100%', `EXPERIENCE\n${JOB}\n- a 1\n- b`).pass, false)
})

test('HOLDS: must include for C++, C#, .NET, Node.js, Go, R, AWS, CI/CD and aliases', () => {
  const skills = 'SKILLS\nC++, C#, .NET, Node.js, Go, R, AWS, CI/CD, K8s, JS'
  for (const t of ['c++', 'c#', '.net', 'node.js', 'go', 'r', 'aws', 'ci/cd', 'kubernetes', 'javascript', 'nodejs', 'golang']) {
    assert.equal(run('must include: ' + t, skills).pass, true, t)
  }
  const wrong = 'SKILLS\nJava, JavaScript, C++, Rust, Rails'
  for (const t of ['c', 'c#', 'go', 'r', '.net', 'node.js', 'aws']) assert.equal(run('must include: ' + t, wrong).pass, false, t)
  assert.equal(run('must not include: javascript', 'Java').pass, true)
  assert.equal(run('must not include: java', 'JavaScript').pass, true)
})

test('HOLDS: prototype-ish rule keys do not poison parsing', () => {
  for (const src of ['__proto__: 5', 'constructor: 1', 'toString', 'hasOwnProperty: x', '__proto__']) {
    assert.doesNotThrow(() => parseCriteria(src))
    assert.equal(parseCriteria(src).errors.length, 1, src)
  }
})

test('HOLDS: never throws on garbage input and is deterministic', () => {
  const { criteria } = parseCriteria(Object.values(CRITERIA_PRESETS).join('\n') + '\nmust include: python\nmax summary words: 5\nmin bullets per role: 2')
  const junk: unknown[] = ['', '\0\0', '\r', '\n\n\n', '-', '- ', '•', 'EXPERIENCE', ':', '  ', '\ud800', '\ud83d', 'a'.repeat(1000), undefined, null, 5, {}]
  for (const j of junk) {
    const a = evaluateCriteria(j as string, criteria, { now: NOW })
    const b = evaluateCriteria(j as string, criteria, { now: NOW })
    assert.deepEqual(a, b)
    assert.equal(a.total, criteria.length)
  }
  assert.doesNotThrow(() => parseCriteria(undefined as unknown as string))
  assert.doesNotThrow(() => evaluateCriteria('x', null as unknown as never[]))
  assert.doesNotThrow(() => evaluateCriteria('x', [null, { id: 'x', text: 'x', kind: 'nope', params: {} }] as never, { now: new Date('garbage') }))
  const rep = evaluateCriteria('x', [{ id: 'x', text: 'x', kind: 'nope', params: {} }])
  assert.equal(rep.results[0].pass, false)
})

test('HOLDS: ids are stable across whitespace/case/order of the surrounding file; compareReports', () => {
  const a = parseCriteria('Max   Pages: 2\nmust include: Python, SQL').criteria
  const b = parseCriteria('# x\n\nmust include: Python, SQL\nmax pages: 2.').criteria
  assert.deepEqual(a.map(c => c.id).sort(), b.map(c => c.id).sort())
  const before = evaluateCriteria('Ana\nPython', a, { now: NOW, pages: 1 })
  const after = evaluateCriteria('Ana\nPython, SQL', a, { now: NOW, pages: 3 })
  const cmp = compareReports(before, after)
  assert.deepEqual(cmp.fixed, ['must include: python, sql'])
  assert.deepEqual(cmp.regressed, ['max pages: 2'])
  assert.equal(cmp.scoreDelta, after.score - before.score)
  assert.deepEqual(compareReports(before, before), { regressed: [], fixed: [], scoreDelta: 0 })
  assert.deepEqual(compareReports(evaluateCriteria('', []), after), { regressed: [], fixed: [], scoreDelta: after.score - 100 })
})

test('HOLDS: 200k-char and pathological inputs finish fast on every non-lint criterion', () => {
  const { criteria } = parseCriteria([
    'max bullets per role: 2', 'max bullet length: 5', 'max words per bullet: 3', 'min words per bullet: 3', 'bullets with numbers: 50%', 'must include: python, go, r, c++',
    'must not include: aaa, a a a a, responsible for', 'start bullets with a verb', 'no first person', 'max pages: 1', 'max summary words: 3', 'date format: Mon YYYY', 'require sections: skills',
  ].join('\n'))
  const inputs: Record<string, string> = {
    spaces: 'EXPERIENCE\n- ' + ' '.repeat(200_000),
    a: 'EXPERIENCE\n- ' + 'a'.repeat(200_000),
    aSpace: 'EXPERIENCE\n- ' + 'a '.repeat(100_000),
    dashes: 'EXPERIENCE\n' + '- '.repeat(100_000),
    dashRun: 'EXPERIENCE\n' + '-'.repeat(200_000),
    months: 'EXPERIENCE\nDev ' + ('jan' + 'a'.repeat(50) + ' ').repeat(4000),
    manyI: 'I '.repeat(100_000),
    realistic: ('EXPERIENCE\n' + `${JOB}\n` + '- Built something with 3 parts and I did my best\n'.repeat(20)).repeat(200).slice(0, 200_000),
  }
  for (const [name, t] of Object.entries(inputs)) {
    const start = Date.now()
    const rep = evaluateCriteria(t, criteria, { now: NOW })
    assert.equal(rep.total, criteria.length)
    assert.ok(Date.now() - start < 1500, `${name} took ${Date.now() - start} ms`)
    for (const r of rep.results) assert.ok(r.locations.length <= 500, `${name}: ${r.criterion.id} returned ${r.locations.length} locations`)
  }
  const start = Date.now()
  parseCriteria('must include: ' + 'a, '.repeat(100_000) + '\n' + 'x'.repeat(1_000_000))
  assert.ok(Date.now() - start < 1500)
})
