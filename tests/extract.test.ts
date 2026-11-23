import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linesFromItems, extractPdfText } from '../lib/resume/extract'
import { parseResume } from '../lib/resume'

function buildPdf(lines: string[]): ArrayBuffer {
  const esc = (s: string) => s.replace(/([()\\])/g, '\\$1')
  let y = 740
  const ops = lines.map(l => {
    const op = `BT /F1 11 Tf 50 ${y} Td (${esc(l)}) Tj ET`
    y -= 16
    return op
  }).join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${ops.length} >>\nstream\n${ops}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const bytes = new TextEncoder().encode(pdf)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

test('linesFromItems orders rows top-to-bottom and cells left-to-right', () => {
  const items = [
    { str: 'May 2024', transform: [1, 0, 0, 1, 400, 700] },
    { str: 'Software Engineer', transform: [1, 0, 0, 1, 50, 700.4] },
    { str: 'EXPERIENCE', transform: [1, 0, 0, 1, 50, 730] },
    { str: 'Built things', transform: [1, 0, 0, 1, 60, 680] },
  ]
  assert.deepEqual(linesFromItems(items), ['EXPERIENCE', 'Software Engineer May 2024', 'Built things'])
})

test('extracts and parses a real PDF end to end', async () => {
  const pdf = buildPdf([
    'Jordan Rivera',
    'EXPERIENCE',
    'Software Engineer, Northwind Analytics   Jun 2025 - Aug 2025',
    '- Built a REST API (Node.js) serving 12,000 daily requests',
    '- Cut report time by 40%',
    'SKILLS',
    'Python, SQL, Docker',
  ])
  const text = await extractPdfText(pdf)
  assert.match(text, /Jordan Rivera/)
  const r = parseResume(text)
  assert.equal(r.experience.length, 1)
  assert.match(r.experience[0].company, /Northwind Analytics/)
  assert.equal(r.experience[0].responsibilities.length, 2)
  assert.deepEqual(r.skills.technical, ['Python', 'SQL', 'Docker'])
})
