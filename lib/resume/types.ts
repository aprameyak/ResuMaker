export interface Education {
  institution: string
  degree: string
  field: string
  dates: string
  gpa?: string
}

export interface Experience {
  company: string
  position: string
  dates: string
  responsibilities: string[]
}

export interface Skills {
  technical: string[]
  soft: string[]
}

export interface Project {
  name: string
  description: string
  technologies: string[]
}

export interface ParsedResume {
  summary: string
  education: Education[]
  experience: Experience[]
  skills: Skills
  projects: Project[]
}

export interface Keywords {
  essential: string[]
  preferred: string[]
  skills: string[]
  industry: string[]
}

export interface Suggestion {
  original: string
  suggestion: string
  explanation: string
  type: 'improvement' | 'correction' | 'enhancement'
}

export interface Change {
  original: string
  replacement: string
  explanation: string
}

export interface OptimizationResult {
  optimized: string
  changes: Change[]
  missing: string[]
  matched: string[]
}
