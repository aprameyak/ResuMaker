import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseResume, analyzeJobDescription, matchKeywords, analyzeContent, optimizeResume, toPlainText } from '../lib/resume'
import { studentResume, messyResume, minimalResume, noHeadingsResume, jobDescriptions } from './fixtures'

test('parses a clean student resume', () => {
  const r = parseResume(studentResume)
  assert.equal(r.education.length, 1)
  assert.match(r.education[0].institution, /University of Maryland/)
  assert.match(r.education[0].degree, /B\.?S/)
  assert.match(r.education[0].field, /Computer Science/)
  assert.equal(r.education[0].gpa, '3.7')
  assert.match(r.education[0].dates, /Aug 2022 - May 2026/)

  assert.equal(r.experience.length, 2)
  assert.match(r.experience[0].position, /Software Engineering Intern/)
  assert.match(r.experience[0].company, /Northwind Analytics/)
  assert.equal(r.experience[0].dates, 'Jun 2025 - Aug 2025')
  assert.equal(r.experience[0].responsibilities.length, 3)
  assert.match(r.experience[1].position, /Teaching Assistant/)
  assert.equal(r.experience[1].responsibilities.length, 2)

  assert.equal(r.projects.length, 2)
  assert.equal(r.projects[0].name, 'SoleFinder')
  assert.deepEqual(r.projects[0].technologies, ['Next.js', 'Prisma', 'Cloudflare'])
  assert.equal(r.projects[1].name, 'TaskFlow')
  assert.deepEqual(r.projects[1].technologies, ['Python', 'Flask', 'SQLite'])

  assert.ok(r.skills.technical.includes('TypeScript'))
  assert.deepEqual(r.skills.soft, ['Leadership', 'Communication'])
})

test('parses a messy resume: odd bullets, wrapped lines, dash-separated headers', () => {
  const r = parseResume(messyResume)
  assert.match(r.summary, /Backend engineer/)
  assert.equal(r.experience.length, 2)
  assert.match(r.experience[0].company, /Stripe/)
  assert.match(r.experience[0].position, /Senior Software Engineer/)
  assert.match(r.experience[0].dates, /Mar 2021 - Present/)
  assert.equal(r.experience[0].responsibilities.length, 3)
  assert.match(r.experience[0].responsibilities[1], /near zero across 3 regions/)
  assert.match(r.experience[1].company, /Acme Logistics/)
  assert.match(r.experience[1].position, /Software Developer/)
  assert.match(r.experience[1].dates, /June 2018 - February 2021/)
  assert.equal(r.experience[1].responsibilities.length, 2)
  assert.match(r.education[0].institution, /Georgia Institute of Technology/)
  assert.ok(r.skills.technical.includes('Kafka'))
  assert.ok(r.skills.technical.includes('Go'))
})

test('parses a minimal resume without crashing or inventing data', () => {
  const r = parseResume(minimalResume)
  assert.deepEqual(r.skills.soft, ['Customer Service', 'Communication'])
  assert.deepEqual(r.skills.technical, ['Excel'])
  assert.equal(r.education.length, 0)
  assert.equal(r.projects.length, 0)
  assert.equal(r.experience.length, 1)
  assert.match(r.experience[0].company, /Target/)
})

test('resume with no headings returns empty sections, not garbage', () => {
  const r = parseResume(noHeadingsResume)
  assert.equal(r.experience.length, 0)
  assert.equal(r.education.length, 0)
  assert.equal(r.summary, '')
})

test('parser never throws on hostile or empty input', () => {
  const inputs = ['', '   ', '\n\n\n', 'EXPERIENCE', 'EXPERIENCE\n•', '•\n•\n•', 'a'.repeat(300_000), '\u0000​﻿', 'EDUCATION\nEDUCATION\nSKILLS\n,,,;;;', null as unknown as string, undefined as unknown as string]
  for (const input of inputs) assert.doesNotThrow(() => parseResume(input))
  const seed = 42
  let x = seed
  const rnd = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  const alphabet = 'abcXYZ019 \n•-–—|,.():/@'
  for (let i = 0; i < 300; i++) {
    let s = ''
    const len = Math.floor(rnd() * 400)
    for (let j = 0; j < len; j++) s += alphabet[Math.floor(rnd() * alphabet.length)]
    assert.doesNotThrow(() => parseResume(s))
  }
})

test('job description: splits required from nice-to-have', () => {
  const k = analyzeJobDescription(jobDescriptions.backend)
  for (const t of ['Go', 'Python', 'PostgreSQL', 'Kafka', 'Kubernetes', 'AWS']) assert.ok(k.essential.includes(t), `essential missing ${t}`)
  for (const t of ['Terraform', 'Rust']) assert.ok(k.preferred.includes(t), `preferred missing ${t}`)
  for (const t of ['Terraform', 'Rust']) assert.ok(!k.essential.includes(t), `${t} wrongly essential`)
  assert.ok(k.industry.includes('fintech'))
  assert.ok(k.essential.includes('mentoring') && k.essential.includes('communication'))
})

test('job description: inline "is a plus" is preferred', () => {
  const k = analyzeJobDescription(jobDescriptions.frontend)
  for (const t of ['React', 'TypeScript', 'JavaScript', 'CSS', 'Git']) assert.ok(k.essential.includes(t), `essential missing ${t}`)
  assert.ok(k.preferred.includes('Next.js') && k.preferred.includes('GraphQL'))
})

test('job description: no false tech matches from plain English ("go above", "Go-getters")', () => {
  const k = analyzeJobDescription(jobDescriptions.noTech)
  assert.deepEqual(k.skills, [])
  assert.ok(!k.essential.includes('Go'))
})

test('does not match "java" inside "javascript" or "c" in ordinary words', () => {
  const k = analyzeJobDescription('We use JavaScript and Scala. Experience with cache invalidation and C++ helps.')
  assert.ok(k.skills.includes('JavaScript'))
  assert.ok(!k.skills.includes('Java'))
  assert.ok(k.skills.includes('C++'))
  assert.ok(!k.skills.includes('C'))
})

test('matching: honest coverage with aliases', () => {
  const k = analyzeJobDescription(jobDescriptions.backend)
  const m = matchKeywords(messyResume, k)
  assert.ok(m.matched.includes('Go') && m.matched.includes('Kubernetes') && m.matched.includes('PostgreSQL'))
  assert.ok(m.missing.includes('Python'))
  assert.ok(m.coverage > 0 && m.coverage < 100)
  const alias = matchKeywords('Used k8s and Postgres daily, plus golang', { essential: ['Kubernetes', 'PostgreSQL', 'Go'], preferred: [], skills: [], industry: [] })
  assert.deepEqual(alias.missing, [])
  assert.equal(alias.coverage, 100)
})

test('matching: empty inputs give 0, not NaN', () => {
  const m = matchKeywords('', { essential: [], preferred: [], skills: [], industry: [] })
  assert.equal(m.coverage, 0)
})

test('suggestions: deterministic fixes are correct', () => {
  const s = analyzeContent('experience', '• Responsible for maintaining the ledger service\n• I built a cache layer using Javascript and Github')
  const resp = s.find(x => /ledger/.test(x.original))!
  assert.equal(resp.suggestion, 'Maintained the ledger service')
  const first = s.find(x => /cache layer/.test(x.original))!
  assert.equal(first.suggestion, 'Built a cache layer using JavaScript and GitHub')
})

test('suggestions: advisory ones never rewrite the text', () => {
  const s = analyzeContent('experience', '• Worked on the billing pipeline for the team\n• Helped with onboarding of new hires every quarter')
  assert.ok(s.length >= 2)
  for (const x of s) assert.equal(x.suggestion, x.original)
})

test('suggestions: clean strong bullets produce nothing', () => {
  const s = analyzeContent('experience', '• Reduced p99 latency from 800ms to 120ms by adding a read-through cache\n• Led a team of 5 engineers to ship checkout v2 in 6 weeks')
  assert.deepEqual(s, [])
})

test('optimize: spells out aliases only when the job asks for them, never adds keywords', () => {
  const resume = '• Built dashboards in JS and k8s tooling\n• Wrote SQL for reporting'
  const k = { essential: ['JavaScript', 'Kubernetes', 'Python'], preferred: [], skills: [], industry: [] }
  const r = optimizeResume(resume, k)
  assert.match(r.optimized, /JavaScript/)
  assert.match(r.optimized, /Kubernetes/)
  assert.ok(!/Python/.test(r.optimized), 'must not invent Python')
  assert.deepEqual(r.missing, ['Python'])
  assert.ok(r.matched.includes('JavaScript'))
})

test('optimize: leaves resume alone when job does not mention the skill', () => {
  const resume = '• Built dashboards in JS'
  const r = optimizeResume(resume, { essential: ['Python'], preferred: [], skills: [], industry: [] })
  assert.equal(r.optimized, resume)
  assert.equal(r.changes.length, 0)
})

test('optimize: idempotent', () => {
  const k = analyzeJobDescription(jobDescriptions.backend)
  const once = optimizeResume('• Responsible for managing k8s clusters and postgres', k)
  const twice = optimizeResume(once.optimized, k)
  assert.equal(twice.optimized, once.optimized)
  assert.equal(twice.changes.length, 0)
})

test('optimize: does not mangle words that contain an alias', () => {
  const k = { essential: ['JavaScript', 'TypeScript', 'Go'], preferred: [], skills: [], industry: [] }
  const r = optimizeResume('• Used jsdom, tsconfig and Node.js; fixed tsx files', k)
  assert.equal(r.optimized, '• Used jsdom, tsconfig and Node.js; fixed tsx files')
})

test('plain-text export round-trips through the parser (what an ATS would read)', () => {
  const parsed = parseResume(studentResume)
  const text = toPlainText(parsed, 'Jordan Rivera')
  const again = parseResume(text)
  assert.equal(again.experience.length, parsed.experience.length)
  assert.equal(again.education.length, parsed.education.length)
  assert.equal(again.experience[0].responsibilities.length, parsed.experience[0].responsibilities.length)
  assert.ok(!/undefined|null|\[object/.test(text))
})

import { pipeResume, twoLineResume, longJobDescription } from './fixtures'

test('parses pipe-separated headers and multiple degrees', () => {
  const r = parseResume(pipeResume)
  assert.equal(r.experience.length, 2)
  assert.match(r.experience[0].position, /Data Analyst/)
  assert.match(r.experience[0].company, /BrightPath Health/)
  assert.equal(r.experience[0].dates, 'Jan 2022 - Present')
  assert.equal(r.experience[0].responsibilities.length, 2)
  assert.match(r.experience[1].company, /Johns Hopkins/)
  assert.equal(r.education.length, 2)
  assert.match(r.education[0].institution, /Johns Hopkins/)
  assert.match(r.education[1].institution, /Montgomery College/)
  assert.deepEqual(r.skills.technical, ['Tableau', 'Excel', 'Python', 'SQL', 'R'])
})

test('parses company / title / dates on separate lines', () => {
  const r = parseResume(twoLineResume)
  assert.equal(r.experience.length, 2)
  assert.match(r.experience[0].company, /Google/)
  assert.match(r.experience[0].position, /Software Engineer III/)
  assert.equal(r.experience[0].dates, 'Jul 2020 - Dec 2023')
  assert.equal(r.experience[0].responsibilities.length, 2)
  assert.match(r.experience[1].company, /Shopify/)
  assert.equal(r.education.length, 1)
  assert.match(r.education[0].degree, /Bachelor of Science/)
  assert.match(r.education[0].field, /Information Systems/)
})

test('large inputs stay fast (no catastrophic regex)', () => {
  const t0 = Date.now()
  const k = analyzeJobDescription(longJobDescription)
  matchKeywords(studentResume, k)
  parseResume(studentResume.repeat(300))
  analyzeContent('experience', ('• ' + 'word '.repeat(60) + '\n').repeat(500))
  assert.ok(k.essential.includes('Python'))
  assert.ok(Date.now() - t0 < 3000, `took ${Date.now() - t0}ms`)
})

test('every parsed field is a trimmed string with no stray bullets or pipes', () => {
  for (const text of [studentResume, messyResume, minimalResume, pipeResume, twoLineResume]) {
    const r = parseResume(text)
    const strings: string[] = [r.summary]
    for (const e of r.experience) strings.push(e.company, e.position, e.dates, ...e.responsibilities)
    for (const e of r.education) strings.push(e.institution, e.degree, e.field, e.dates)
    for (const p of r.projects) strings.push(p.name, p.description, ...p.technologies)
    strings.push(...r.skills.technical, ...r.skills.soft)
    for (const s of strings) {
      assert.equal(s, s.trim())
      assert.ok(!/^[•●▪■◦○|\-–—]/.test(s), `stray marker in "${s}"`)
      assert.ok(!/\|\s*$/.test(s), `trailing pipe in "${s}"`)
    }
  }
})

import { toEditorSections } from '../lib/resume'

test('imported resume becomes editor sections with real content only', () => {
  const sections = toEditorSections(parseResume(studentResume))
  assert.deepEqual(sections.map(s => s.type), ['experience', 'education', 'projects', 'skills'])
  assert.match(sections[0].content, /^Software Engineering Intern, Northwind Analytics {2}Jun 2025 - Aug 2025\n- Built a REST API/)
  assert.ok(sections.every(s => s.content.trim() && s.id))
  assert.equal(toEditorSections(parseResume('')).length, 0)
})
