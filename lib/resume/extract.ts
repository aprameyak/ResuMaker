export interface PdfTextItem {
  str: string
  transform: number[]
  hasEOL?: boolean
}

export function linesFromItems(items: PdfTextItem[]): string[] {
  const rows: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = []
  for (const item of items) {
    if (typeof item.str !== 'string' || !item.transform) continue
    const x = item.transform[4]
    const y = item.transform[5]
    let row = rows.find(r => Math.abs(r.y - y) < 2.5)
    if (!row) {
      row = { y, parts: [] }
      rows.push(row)
    }
    row.parts.push({ x, text: item.str })
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map(r => r.parts.sort((a, b) => a.x - b.x).map(p => p.text).join(' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  const pages: string[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const content = await page.getTextContent()
    pages.push(linesFromItems(content.items as PdfTextItem[]).join('\n'))
  }
  return pages.join('\n').trim()
}

export async function extractDocxText(data: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth/mammoth.browser')
  const result = await mammoth.extractRawText({ arrayBuffer: data })
  return result.value.trim()
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.txt') || file.type === 'text/plain') return (await file.text()).trim()
  const buffer = await file.arrayBuffer()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return extractPdfText(buffer)
  if (name.endsWith('.docx')) return extractDocxText(buffer)
  throw new Error('Unsupported file type. Use PDF, DOCX or TXT.')
}
