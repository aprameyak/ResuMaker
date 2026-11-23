import type { ParsedResume } from './types'
import type { ResumeHeader } from './parse'

export function toPlainText(resume: ParsedResume, header = ''): string {
  const out: string[] = []
  if (header.trim()) out.push(header.trim(), '')
  if (resume.summary) out.push('SUMMARY', resume.summary, '')
  if (resume.experience.length) {
    out.push('EXPERIENCE')
    for (const e of resume.experience) {
      out.push([e.position, e.company].filter(Boolean).join(', ') + (e.dates ? `  ${e.dates}` : ''))
      for (const r of e.responsibilities) out.push(`- ${r}`)
      out.push('')
    }
  }
  if (resume.education.length) {
    out.push('EDUCATION')
    for (const e of resume.education) {
      const degree = [e.degree, e.field].filter(Boolean).join(' in ')
      out.push([e.institution, degree].filter(Boolean).join(', ') + (e.dates ? `  ${e.dates}` : ''))
      if (e.gpa) out.push(`GPA: ${e.gpa}`)
    }
    out.push('')
  }
  if (resume.projects.length) {
    out.push('PROJECTS')
    for (const p of resume.projects) {
      out.push(p.name + (p.technologies.length ? ` (${p.technologies.join(', ')})` : ''))
      if (p.description) out.push(p.description)
    }
    out.push('')
  }
  const skills = [...resume.skills.technical, ...resume.skills.soft]
  if (skills.length) out.push('SKILLS', skills.join(', '), '')
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

export interface EditorSection {
  id: string
  type: 'summary' | 'education' | 'experience' | 'skills' | 'projects'
  title: string
  content: string
}

export function toEditorSections(resume: ParsedResume, header?: ResumeHeader): EditorSection[] {
  const sections: EditorSection[] = []
  const add = (type: EditorSection['type'], title: string, lines: string[]) => {
    const content = lines.join('\n').trim()
    if (content) sections.push({ id: `${type}-${sections.length + 1}`, type, title, content })
  }

  if (header && (header.name || header.contact.length)) {
    add('summary', 'Contact', [header.name, header.contact.join(' | ')])
  }
  add('summary', 'Professional Summary', [resume.summary])

  const exp: string[] = []
  for (const e of resume.experience) {
    exp.push([e.position, e.company].filter(Boolean).join(', ') + (e.dates ? `  ${e.dates}` : ''))
    for (const r of e.responsibilities) exp.push(`- ${r}`)
    exp.push('')
  }
  add('experience', 'Experience', exp)

  const edu: string[] = []
  for (const e of resume.education) {
    const degree = [e.degree, e.field].filter(Boolean).join(' in ')
    edu.push([e.institution, degree].filter(Boolean).join(', ') + (e.dates ? `  ${e.dates}` : '') + (e.gpa ? `  GPA: ${e.gpa}` : ''))
  }
  add('education', 'Education', edu)

  const proj: string[] = []
  for (const p of resume.projects) {
    proj.push(p.name + (p.technologies.length ? ` (${p.technologies.join(', ')})` : ''))
    if (p.description) proj.push(p.description)
    proj.push('')
  }
  add('projects', 'Projects', proj)

  add('skills', 'Skills', [[...resume.skills.technical, ...resume.skills.soft].join(', ')])
  return sections
}
