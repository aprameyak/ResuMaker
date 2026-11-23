'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { ViewModel } from '../../ide/analysis'
import { PAGE_W_PX, breakOffsetsIn, fitScale, formatPages, pageCount } from '../../ide/paging'

/** The one rendering of the resume. The screen preview and the print copy both use it. */
export const ResumeDoc = memo(function ResumeDoc({ view }: { view: ViewModel }) {
  const { header, resume, other, loose } = view
  const skills = [...resume.skills.technical, ...resume.skills.soft]
  return (
    <div className="ide-doc">
      {header.name && <h1 className="ide-doc-name">{header.name}</h1>}
      {header.contact.length > 0 && <p className="ide-doc-contact">{header.contact.join('  |  ')}</p>}

      {resume.summary && (
        <section>
          <h2>Summary</h2>
          <p>{resume.summary}</p>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <h2>Experience</h2>
          {resume.experience.map((e, i) => (
            <div className="ide-doc-role" key={i}>
              <div className="ide-doc-row">
                <span><strong>{e.position || e.company}</strong>{e.position && e.company ? `, ${e.company}` : ''}</span>
                {e.dates && <span className="ide-doc-dates">{e.dates}</span>}
              </div>
              {e.responsibilities.length > 0 && (
                <ul>{e.responsibilities.map((r, j) => <li key={j}>{r}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <h2>Education</h2>
          {resume.education.map((e, i) => {
            const degree = [e.degree, e.field].filter(Boolean).join(' in ')
            return (
              <div className="ide-doc-role" key={i}>
                <div className="ide-doc-row">
                  <span><strong>{e.institution || degree}</strong>{e.institution && degree ? `, ${degree}` : ''}</span>
                  {e.dates && <span className="ide-doc-dates">{e.dates}</span>}
                </div>
                {e.gpa && <div>GPA: {e.gpa}</div>}
              </div>
            )
          })}
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <h2>Projects</h2>
          {resume.projects.map((p, i) => (
            <div className="ide-doc-role" key={i}>
              <div><strong>{p.name}</strong>{p.technologies.length > 0 ? ` (${p.technologies.join(', ')})` : ''}</div>
              {p.description && <div>{p.description}</div>}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2>Skills</h2>
          <p>{skills.join(', ')}</p>
        </section>
      )}

      {other.map((o, i) => (
        <section key={i}>
          <h2>{o.title}</h2>
          {o.lines.map((l, j) => <p key={j}>{l}</p>)}
        </section>
      ))}

      {loose.length > 0 && (
        <section>
          {loose.map((l, j) => <p key={j}>{l}</p>)}
        </section>
      )}
    </div>
  )
})

interface PreviewProps {
  view: ViewModel
  /** Receives the measured height of the page content in CSS pixels. */
  onMeasure(contentHeightPx: number): void
  contentHeightPx: number
  maxPages: number | null
}

export default function Preview({ view, onMeasure, contentHeightPx, maxPages }: PreviewProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const doc = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const measure = useRef(onMeasure)
  measure.current = onMeasure

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 40) setScale(fitScale(w))
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = doc.current
    if (!el) return
    let raf = 0
    const read = () => {
      cancelAnimationFrame(raf)
      // not rendered (print media, display: none): keep the last real measurement
      raf = requestAnimationFrame(() => { if (el.getClientRects().length > 0) measure.current(el.offsetHeight) })
    }
    read()
    if (typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(raf)
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  const pages = pageCount(contentHeightPx)
  const sheetH = Math.max(11 * 96, contentHeightPx + 96)
  const over = maxPages !== null && pages > maxPages
  const breaks = breakOffsetsIn(contentHeightPx)

  return (
    <div className="ide-preview" ref={wrap}>
      <div className="ide-preview-bar">
        <span data-testid="ide-pages">{formatPages(contentHeightPx)}</span>
        {over && <span className="ide-chip ide-chip-warn" role="status">Over your {maxPages}-page limit</span>}
        <span className="muted">Letter, 0.5 in margins. Page breaks are approximate.</span>
      </div>
      {view.notes.length > 0 && (
        <ul className="ide-notes">{view.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}
      <div className="ide-sheet-frame" style={{ width: PAGE_W_PX * scale, height: sheetH * scale }}>
        <div className="ide-sheet" style={{ transform: `scale(${scale})`, height: sheetH }} data-testid="ide-sheet">
          {breaks.map((inch, i) => (
            <div className="ide-pagebreak" style={{ top: `${inch}in` }} key={i} aria-hidden="true">
              <span>Page {i + 2}</span>
            </div>
          ))}
          <div className="ide-sheet-content" ref={doc}>
            {view.empty
              ? <p className="ide-doc-empty">Nothing to preview yet. Type or paste your resume in the editor.</p>
              : <ResumeDoc view={view} />}
          </div>
        </div>
      </div>
    </div>
  )
}
