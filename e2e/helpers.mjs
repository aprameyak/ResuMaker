// Shared helpers for the e2e runner. No project files are modified.
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT = path.resolve(here, '..')
export const NODE_MODULES = process.env.E2E_NODE_MODULES ||
  '/private/tmp/claude-501/-Users-aprameyakannan/956ecdbd-3139-4948-9832-19fb8c0c40a6/scratchpad/e2e/node_modules'
export const OUT = process.env.E2E_OUT || path.join(here, 'out')
fs.mkdirSync(OUT, { recursive: true })

const req = createRequire(path.join(NODE_MODULES, 'x.js'))
export const { chromium } = req('playwright')
export const JSZip = req('jszip')

export async function loadPdfjs() {
  const p = path.join(PROJECT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')
  return import(pathToFileURL(p).href)
}

// Returns {pages, items:[{str,x,y,page}], lines:[string]} for a PDF buffer.
export async function pdfText(buf) {
  const pdfjs = await loadPdfjs()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise
  const items = []
  const lines = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const c = await page.getTextContent()
    const rows = []
    for (const it of c.items) {
      if (!it.str || !it.str.trim()) continue
      items.push({ str: it.str, x: it.transform[4], y: it.transform[5], page: n })
      let r = rows.find(r => Math.abs(r.y - it.transform[5]) < 2.5)
      if (!r) rows.push((r = { y: it.transform[5], parts: [] }))
      r.parts.push({ x: it.transform[4], t: it.str })
    }
    rows.sort((a, b) => b.y - a.y).forEach(r => lines.push(r.parts.sort((a, b) => a.x - b.x).map(p => p.t).join(' ').replace(/\s+/g, ' ').trim()))
  }
  return { pages: doc.numPages, items, lines }
}

export function buildPdf(lines) {
  const esc = s => s.replace(/([()\\])/g, '\\$1')
  let y = 740
  const ops = lines.map(l => { const op = `BT /F1 11 Tf 50 ${y} Td (${esc(l)}) Tj ET`; y -= 16; return op }).join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${ops.length} >>\nstream\n${ops}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offs = []
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

// PDF with a page but no text (stand-in for a scanned resume).
export function buildEmptyPdf() {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>',
    '<< /Length 28 >>\nstream\n0.8 g 50 50 300 300 re f\nendstream',
  ]
  let pdf = '%PDF-1.4\n'
  const offs = []
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

export async function buildDocx(paragraphs) {
  const x = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const body = paragraphs.map(p => `<w:p><w:r><w:t xml:space="preserve">${x(p)}</w:t></w:r></w:p>`).join('')
  const z = new JSZip()
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`)
  return z.generateAsync({ type: 'nodebuffer' })
}

export const RESUME = `Priya Natarajan
priya.natarajan@example.com | (512) 555-0187 | linkedin.com/in/priyan | Austin, TX

PROFESSIONAL SUMMARY
Backend software engineer with 5 years of experience building APIs and data pipelines for fintech products.

EXPERIENCE
Senior Software Engineer, Lumen Payments    Mar 2022 - Present
- Built REST APIs in Node.js and Typescript handling 4 million requests per day
- Cut p95 latency by 35% by adding Redis caching in front of PostgreSQL
- Set up CI/CD pipelines with GitHub Actions and deployed services to AWS
- Mentored 3 junior engineers and led weekly code reviews

Software Engineer, Brightpath Analytics    Jul 2019 - Feb 2022
- Developed ETL jobs in Python that processed 2 TB of data nightly
- Wrote SQL reports used by the finance team
- Migrated a legacy jQuery dashboard to React

EDUCATION
University of Texas at Austin
B.S. in Computer Science    Aug 2015 - May 2019    GPA: 3.8

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Tools: Git, Docker, AWS, Redis, PostgreSQL
Soft Skills: Communication, Mentoring
`

export const JOB = `Senior Backend Engineer - Payments Platform

About the role
We are hiring a Senior Backend Engineer to build and scale the services behind our payments platform.

Requirements
- 4+ years of experience with Python or Node.js
- Strong knowledge of SQL and PostgreSQL
- Experience deploying to AWS using Docker and Kubernetes
- Experience with CI/CD and automated testing
- Familiarity with GraphQL and microservices architecture
- Excellent communication and leadership skills

Nice to have
- Experience with Kafka or Redis
- Knowledge of Terraform
- React experience
`
