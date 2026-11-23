#!/usr/bin/env node
// ResuMaker browser e2e.  Usage:
//   1. in the project:  npx next dev -p 3101        (leave running)
//   2. node e2e/run.mjs                              (BASE_URL=http://localhost:3101 by default)
// Playwright is loaded from $E2E_NODE_MODULES (needs `playwright` and `jszip`, plus
// `npx playwright install chromium`).  Output (screenshots, pdf, report.json) goes to e2e/out or $E2E_OUT.
import fs from 'node:fs'
import path from 'node:path'
import { chromium, OUT, pdfText, buildPdf, buildEmptyPdf, buildDocx, RESUME, JOB } from './helpers.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3101'
const results = []
const consoleLog = []
let section = ''
function check(name, ok, evidence = '') {
  results.push({ section, name, ok: !!ok, evidence: String(evidence).slice(0, 600) })
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${section}] ${name}${ok ? '' : '\n      ' + String(evidence).slice(0, 600)}`)
}

const browser = await chromium.launch()

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, acceptDownloads: true })
  await ctx.addInitScript(() => { try { localStorage.setItem('auth_token', 'fake-token') } catch {} })
  await ctx.route('**/api/auth/verify', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'u1', email: 't@example.com', name: 'Test' } }) }))
  const page = await ctx.newPage()
  const tag = { name: '' }
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) consoleLog.push({ page: tag.name, type: m.type(), text: m.text().slice(0, 400), url: m.location()?.url }) })
  page.on('pageerror', e => consoleLog.push({ page: tag.name, type: 'pageerror', text: String(e).slice(0, 400) }))
  page.on('requestfailed', r => consoleLog.push({ page: tag.name, type: 'requestfailed', text: r.url() + ' ' + (r.failure()?.errorText || '') }))
  page.on('response', r => { if (r.status() >= 400) consoleLog.push({ page: tag.name, type: 'http' + r.status(), text: r.url() }) })
  page.tag = tag
  return page
}
const shot = (page, n) => page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: true })
const noHScroll = page => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bsw: document.body.scrollWidth }))

// find content overflowing the viewport (since html/body have overflow-x hidden, scrollWidth hides it)
const overflowing = page => page.evaluate(() => {
  const vw = document.documentElement.clientWidth
  const bad = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width && (r.right > vw + 1 || r.left < -1)) bad.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} right=${Math.round(r.right)} left=${Math.round(r.left)}`)
  }
  return { vw, bad: bad.slice(0, 8), count: bad.length }
})

// ---------------------------------------------------------------- 0 auth gate
section = 'auth'
{
  const ctx = await browser.newContext()
  const p = await ctx.newPage()
  p.on('response', () => {})
  await p.goto(BASE + '/tailor').catch(() => {})
  await p.waitForURL('**/auth**', { timeout: 8000 }).catch(() => {})
  check('unauthenticated /tailor redirects to /auth', /\/auth/.test(p.url()), p.url())
  await ctx.close()
}

// ---------------------------------------------------------------- 1 tailor
section = 'tailor'
{
  const page = await newPage(); page.tag.name = 'tailor'
  await page.goto(BASE + '/tailor')
  await page.waitForSelector('textarea', { timeout: 20000 })
  check('stays on /tailor with mocked auth', /\/tailor/.test(page.url()), page.url())
  const btn = page.getByRole('button', { name: /Tailor Resume/ })
  check('tailor button disabled when empty', await btn.isDisabled())
  await page.locator('textarea').nth(0).fill(RESUME)
  await page.locator('textarea').nth(1).fill(JOB)
  await btn.click()
  await page.waitForSelector('text=Tailored Resume', { timeout: 10000 }).catch(() => {})
  await shot(page, 'tailor-result')
  const reportText = await page.locator('.no-print').first().innerText().catch(() => '')
  const m = reportText.match(/Keyword match:\s*(\d+)%\s*before,\s*(\d+)%\s*after/)
  check('before/after report shown', !!m, reportText.slice(0, 300))
  const before = m ? +m[1] : -1, after = m ? +m[2] : -1
  check('after >= before', m && after >= before, `${before}% -> ${after}%`)
  const foundLine = (reportText.match(/Found in your resume:\s*(.*)/) || [])[1] || ''
  const missLine = (reportText.match(/Not in your resume:\s*(.*?)\. Add these/) || [])[1] || ''
  const found = foundLine.split(',').map(s => s.trim()).filter(Boolean)
  const missing = missLine.split(',').map(s => s.trim()).filter(Boolean)
  console.log('   found:', found.join(', '), '\n   missing:', missing.join(', '))
  const has = (txt, t) => new RegExp(`(?<![A-Za-z0-9])${t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![A-Za-z0-9])`, 'i').test(txt)
  const expectPresent = ['Python', 'SQL', 'PostgreSQL', 'AWS', 'Docker', 'Redis', 'React', 'CI/CD', 'Node.js', 'Communication']
  const expectMissing = ['Kubernetes', 'GraphQL', 'Kafka', 'Terraform', 'Microservices']
  const wrongFound = expectMissing.filter(t => found.some(f => f.toLowerCase() === t.toLowerCase()))
  const wrongMissing = expectPresent.filter(t => missing.some(f => f.toLowerCase() === t.toLowerCase()))
  check('items truly absent from resume are not reported as found', wrongFound.length === 0, 'wrongly found: ' + wrongFound)
  check('items truly in resume are not reported as missing', wrongMissing.length === 0, 'wrongly missing: ' + wrongMissing)
  check('Kubernetes/GraphQL/Terraform reported missing', ['Kubernetes', 'GraphQL', 'Terraform'].every(t => missing.some(f => f.toLowerCase() === t.toLowerCase())), 'missing=' + missing)
  const out = await page.locator('.no-print pre').innerText()
  const injected = [...missing, ...expectMissing].filter(t => has(out, t) && !has(RESUME, t))
  check('no keyword absent from resume was injected into output', injected.length === 0, 'injected: ' + injected)
  // every output line should derive from a resume line (word-level sanity: no brand-new long sentences)
  const origWords = new Set(RESUME.toLowerCase().match(/[a-z0-9+#.]+/g))
  const newWords = [...new Set(out.toLowerCase().match(/[a-z0-9+#.]+/g))].filter(w => !origWords.has(w))
  console.log('   words in output not in input:', newWords.join(' ') || '(none)')
  check('output introduces at most a few new words (spelling-out only)', newWords.length <= 8, newWords.join(' '))
  // download
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.getByRole('button', { name: /Download \.txt/ }).click()])
  if (dl) {
    const f = path.join(OUT, 'dl.txt'); await dl.saveAs(f)
    const txt = fs.readFileSync(f, 'utf8')
    check('Download .txt gives tailored-resume.txt equal to displayed output', dl.suggestedFilename() === 'tailored-resume.txt' && txt.trim() === out.trim(), `${dl.suggestedFilename()} len=${txt.length} vs ${out.length}`)
  } else check('Download .txt triggers a download', false, 'no download event')
  // print to pdf
  await page.emulateMedia({ media: 'print' })
  const pdfBuf = await page.pdf({ preferCSSPageSize: true, printBackground: false })
  fs.writeFileSync(path.join(OUT, 'tailor-print.pdf'), pdfBuf)
  const t = await pdfText(pdfBuf)
  const all = t.lines.join('\n')
  console.log('   PDF pages:', t.pages, 'lines:', t.lines.length)
  check('PDF has selectable text', t.lines.length > 10, `lines=${t.lines.length}`)
  const junk = ['Tailor Your Resume', 'Download .txt', 'Save as PDF', 'Keyword match', 'Found in your', 'Not in your', 'Paste your', 'Job Description', 'Your Resume', 'Processing', 'Tailored Resume']
  const junkFound = junk.filter(j => all.includes(j))
  check('PDF contains only resume (no nav/buttons/report)', junkFound.length === 0, 'found in PDF: ' + junkFound)
  const navWords = ['ResuMaker', 'Sign', 'Home', 'Logout']
  check('PDF has no nav chrome', !navWords.some(w => all.includes(w)), navWords.filter(w => all.includes(w)))
  // order: each resume line appears in order
  const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase()
  const want = out.split('\n').map(norm).filter(Boolean)
  const gotJoined = norm(all)
  let pos = 0, missingLines = []
  for (const l of want) { const i = gotJoined.indexOf(l.slice(0, 40), pos); if (i < 0) missingLines.push(l); else pos = i }
  check('PDF lines present and in same order as resume', missingLines.length === 0, 'missing/out of order: ' + missingLines.slice(0, 5).join(' || '))
  const xs = t.items.map(i => i.x)
  const minX = Math.min(...xs), maxStartX = Math.max(...t.items.filter(i => i.str.length > 3).map(i => i.x))
  check('single column (no text starts far right of left margin)', maxStartX - minX < 120, `minX=${minX.toFixed(0)} maxStartX=${maxStartX.toFixed(0)}`)
  const blank = []
  for (let n = 1; n <= t.pages; n++) if (!t.items.some(i => i.page === n)) blank.push(n)
  check('PDF has no blank pages (one-page resume => one page)', blank.length === 0, `pages=${t.pages}, blank pages: ${blank}`)
  // render PDF page 1 as image for a visual look
  const pg = await newPage(); const b64 = pdfBuf.toString('base64')
  await pg.close()
  await page.emulateMedia({ media: 'screen' })
  await page.close()
}

// ---------------------------------------------------------------- 1b tailor long resume (pagination)
section = 'tailor-long'
{
  const page = await newPage(); page.tag.name = 'tailor-long'
  await page.goto(BASE + '/tailor'); await page.waitForSelector('textarea')
  const long = RESUME + '\n' + Array.from({ length: 6 }, (_, i) => `Contract Engineer ${i}, Client ${i}    2018\n- Delivered feature ${i} with Python and SQL for ${i + 2} teams\n- Improved reliability by ${10 + i}%`).join('\n') + '\n' + RESUME
  await page.locator('textarea').nth(0).fill(long)
  await page.locator('textarea').nth(1).fill(JOB)
  await page.getByRole('button', { name: /Tailor Resume/ }).click()
  await page.waitForSelector('.no-print pre')
  await page.emulateMedia({ media: 'print' })
  const buf = await page.pdf({ preferCSSPageSize: true })
  fs.writeFileSync(path.join(OUT, 'tailor-long.pdf'), buf)
  const t = await pdfText(buf)
  const expectedLines = (await page.locator('.no-print pre').innerText()).split('\n').filter(l => l.trim()).length
  console.log('   long PDF pages', t.pages, 'lines', t.lines.length, 'expected >=', expectedLines)
  check('multi-page resume prints on >1 page without truncation', t.pages > 1 && t.lines.length >= expectedLines * 0.95, `pages=${t.pages} lines=${t.lines.length} expected=${expectedLines}`)
  const blank2 = []
  for (let n = 1; n <= t.pages; n++) if (!t.items.some(i => i.page === n)) blank2.push(n)
  check('long resume PDF has no blank trailing pages', blank2.length === 0, `pages=${t.pages} blank=${blank2}`)
  await page.close()
}

// ---------------------------------------------------------------- 2 upload
section = 'upload'
const fixtures = {}
const resumeLines = ['Jordan Rivera', 'jordan.rivera@example.com | (301) 555-0142', '', 'EXPERIENCE', 'Software Engineer, Northwind Analytics   Jun 2025 - Aug 2025', '- Built a REST API (Node.js) serving 12,000 daily requests', '- Cut report time by 40%', '', 'EDUCATION', 'University of Maryland, College Park', 'B.S. in Computer Science   Aug 2022 - May 2026', '', 'SKILLS', 'Python, SQL, Docker']
fixtures['resume.txt'] = Buffer.from(resumeLines.join('\n'))
fixtures['resume.docx'] = await buildDocx(resumeLines)
fixtures['resume.pdf'] = buildPdf(resumeLines.filter(Boolean))
fixtures['scan.pdf'] = buildEmptyPdf()
fixtures['notes.rtf'] = Buffer.from('{\\rtf1 hello}')
fixtures['resume.doc'] = Buffer.from('not really word')
fixtures['broken.pdf'] = Buffer.from('this is not a pdf')
fixtures['empty.txt'] = Buffer.from('')
fixtures['rich.txt'] = Buffer.from(`Jordan Rivera
jordan.rivera@example.edu | (301) 555-0142 | github.com/jrivera

SUMMARY
Computer science student who likes building reliable backend services.

EDUCATION
University of Maryland, College Park
B.S. in Computer Science, GPA: 3.7/4.0    Aug 2022 - May 2026

EXPERIENCE
Software Engineering Intern, Northwind Analytics    Jun 2025 - Aug 2025
- Built a REST API in Node.js and PostgreSQL that served 12,000 daily requests
- Reduced report generation time by 40% by caching query results in Redis

PROJECTS
TaskFlow | Python, Flask, SQLite
- Built a kanban app with drag and drop

SKILLS
Languages: Python, Java, SQL
Soft Skills: Leadership, Communication
`)
const fdir = path.join(OUT, 'fixtures'); fs.mkdirSync(fdir, { recursive: true })
for (const [n, b] of Object.entries(fixtures)) fs.writeFileSync(path.join(fdir, n), b)

async function uploadFlow(name, expectOk) {
  const page = await newPage(); page.tag.name = 'upload:' + name
  await page.goto(BASE + '/upload'); await page.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
  await page.setInputFiles('input[type=file]', path.join(fdir, name))
  const err0 = await page.locator('text=Please select a PDF').count()
  if (!expectOk && err0) { await shot(page, 'upload-' + name); return { page, rejectedAtSelect: true } }
  await page.getByRole('button', { name: /Parse Resume/ }).click()
  await page.waitForSelector('text=Resume Parsed Successfully, [style*="fef2f2"]', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(500)
  await shot(page, 'upload-' + name)
  return { page }
}

for (const name of ['resume.txt', 'resume.docx', 'resume.pdf']) {
  const { page } = await uploadFlow(name, true)
  const parsed = await page.locator('text=Resume Parsed Successfully').count()
  const errText = await page.locator('p[style*="rgb(220, 38, 38)"]').allInnerTexts()
  check(`${name} parses`, parsed > 0, 'error: ' + errText.join('|'))
  if (parsed) {
    const stored = await page.evaluate(() => sessionStorage.getItem('resumaker:imported'))
    const payload = stored ? JSON.parse(stored) : null
    const j = payload ? payload.parsed : null
    console.log('   parsed', name, j && JSON.stringify({ n: j.experience?.length, e: j.education?.length, s: j.skills }))
    check(`${name}: header (name/contact) captured`, Boolean(payload?.header?.name && payload.header.contact?.some(c => /@/.test(c))), JSON.stringify(payload?.header))
    check(`${name}: parsed JSON has experience, education, skills`, j && j.experience?.length >= 1 && j.education?.length >= 1 && (j.skills?.technical?.length || 0) >= 2, stored?.slice(0, 400))
    await page.getByRole('button', { name: /Continue Editing/ }).click()
    await page.waitForURL('**/create', { timeout: 8000 }).catch(() => {})
    check(`${name}: Continue Editing goes to /create`, /\/create$/.test(page.url()), page.url())
    await page.waitForSelector('textarea', { timeout: 8000 }).catch(() => {})
    const titles = await page.locator('h3').allInnerTexts()
    const areas = await page.locator('textarea').evaluateAll(a => a.map(x => x.value))
    const joined = areas.join('\n')
    console.log('   /create sections', titles.join(' | '))
    check(`${name}: /create prefilled (no template picker, sections shown)`, titles.length >= 3 && !(await page.locator('text=Choose a Template').count()), titles.join('|'))
    check(`${name}: /create has experience/education/skills content`, /Northwind/.test(joined) && /Maryland/.test(joined) && /Python/.test(joined) && /REST API/.test(joined), joined.slice(0, 500))
    check(`${name}: contact/name preserved somewhere in editor`, /Jordan Rivera/.test(joined) || /Jordan/.test(titles.join()), 'name not in editor sections; titles=' + titles.join('|'))
    await shot(page, 'create-from-' + name)
  }
  await page.close()
}

{
  const { page } = await uploadFlow('rich.txt', true)
  await page.getByRole('button', { name: /Continue Editing/ }).click(); await page.waitForURL('**/create')
  await page.waitForSelector('textarea')
  const titles = await page.locator('h3').allInnerTexts()
  const joined = (await page.locator('textarea').evaluateAll(a => a.map(x => x.value))).join('\n')
  check('rich.txt: summary, experience, education, projects, skills all land in editor', ['Summary','Experience','Education','Projects','Skills'].every(t => titles.some(x => x.includes(t))), titles.join('|'))
  check('rich.txt: GPA, soft skills, project tech preserved', /3\.7/.test(joined) && /Leadership/.test(joined) && /Flask/.test(joined), joined.slice(0, 600))
  check('rich.txt: contact details (email/phone/github) preserved in editor', /jordan\.rivera@example\.edu/.test(joined) && /555-0142/.test(joined), 'email/phone not in any editor section (parseHeader exists in lib/resume/parse.ts but upload page never calls it)')
  await shot(page, 'create-from-rich')
  await page.close()
}

for (const [name, why] of [['scan.pdf', 'image-only PDF'], ['broken.pdf', 'corrupt PDF'], ['empty.txt', 'empty txt'], ['notes.rtf', 'unsupported .rtf'], ['resume.doc', 'legacy .doc']]) {
  const { page } = await uploadFlow(name, false)
  const crashed = await page.locator('text=Application error').count() + await page.locator('text=Something went wrong').count()
  const errText = (await page.locator('p[style*="rgb(220, 38, 38)"]').allInnerTexts()).join('|')
  const success = await page.locator('text=Resume Parsed Successfully').count()
  check(`${why} (${name}): clear error, no success, no crash`, !crashed && !success && errText.length > 5, `error="${errText}" crashed=${crashed} success=${success}`)
  await page.close()
}

// ---------------------------------------------------------------- 3 create
section = 'create'
{
  const page = await newPage(); page.tag.name = 'create'
  await page.goto(BASE + '/create'); await page.waitForSelector('text=Choose a Template', { timeout: 20000 })
  await shot(page, 'create-templates')
  const cards = await page.locator('text=/Professional|Technical|Academic|Minimalist|Executive/').count()
  check('five templates visible', cards >= 5, 'matches=' + cards)
  await page.getByText('Technical', { exact: true }).first().click()
  await page.waitForSelector('textarea')
  const n = await page.locator('textarea').count()
  check('selecting Technical template shows 5 sections', n === 5, 'textareas=' + n)
  const ta = page.locator('textarea').first()
  await ta.fill('Edited summary text 123')
  check('editing section keeps value', (await ta.inputValue()) === 'Edited summary text 123')
  await page.getByRole('button', { name: /Back to Templates/ }).click()
  check('Back to Templates shows picker', await page.locator('text=Choose a Template').count() > 0)
  await page.getByText('Minimalist', { exact: true }).first().click()
  await page.waitForSelector('textarea')
  check('re-picking a template resets to its sections', await page.locator('textarea').count() === 4)
  await shot(page, 'create-editor')
  // add / delete
  const before = await page.locator('textarea').count()
  const addBtn = page.getByRole('button', { name: /add/i }).first()
  if (await addBtn.count()) { await addBtn.click(); await page.waitForTimeout(300) }
  await shot(page, 'create-after-add')
  await page.getByRole('button', { name: /Preview/ }).click()
  await page.waitForTimeout(1500)
  check('Preview & Export navigates somewhere that is not a 404', !(await page.locator('text=/404|could not be found/i').count()), page.url() + ' | ' + (await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' '))
  await shot(page, 'create-preview')
  await page.close()
}

// ---------------------------------------------------------------- 4 mobile
section = 'mobile-390'
for (const p of ['/tailor', '/upload', '/create']) {
  const page = await newPage({ viewport: { width: 390, height: 844 } }); page.tag.name = 'mobile' + p
  await page.goto(BASE + p); await page.waitForSelector('h1', { timeout: 20000 })
  if (p === '/tailor') { await page.locator('textarea').nth(0).fill(RESUME); await page.locator('textarea').nth(1).fill(JOB); await page.getByRole('button', { name: /Tailor Resume/ }).click(); await page.waitForSelector('.no-print pre') }
  await page.waitForTimeout(400)
  const s = await noHScroll(page), o = await overflowing(page)
  await shot(page, 'mobile' + p.replace('/', '-'))
  check(`${p} no horizontal overflow at 390px`, s.sw <= s.cw && o.count === 0, `scrollW=${s.sw} clientW=${s.cw}; ${o.count} elements outside viewport e.g. ${o.bad.join('; ')}`)
  await page.close()
}

// ---------------------------------------------------------------- console
section = 'console'
const uniq = new Map()
for (const c of consoleLog) { const k = `${c.page}|${c.type}|${c.text}`; uniq.set(k, c) }
console.log('\n--- console/network problems (deduped) ---')
for (const c of uniq.values()) console.log(`[${c.page}] ${c.type}: ${c.text}`)
const hard = [...uniq.values()].filter(c => c.type !== 'warning' && !/^(Upload error|Failed to load resource)/.test(c.text) && !/^\[upload:(scan|broken|empty|notes|resume\.doc)/.test('['+c.page) && !/\/preview/.test(c.text) && !/favicon|icon\.svg|manifest/.test(c.text) && !(c.type === 'http404' && /icon|manifest/.test(c.text)))
check('no console errors / failed requests across all pages', hard.length === 0, hard.map(c => `[${c.page}] ${c.type}: ${c.text}`).join('\n'))

await browser.close()
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ results, console: [...uniq.values()] }, null, 2))
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
