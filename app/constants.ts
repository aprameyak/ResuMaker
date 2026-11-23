// Constants for type checking
export const SECTION_TYPES = {
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  SUMMARY: 'summary',
  RESEARCH: 'research',
  PUBLICATIONS: 'publications',
  HIGHLIGHTS: 'highlights',
  BOARD: 'board'
} as const;

export type SectionType = typeof SECTION_TYPES[keyof typeof SECTION_TYPES];

export const FEEDBACK_TYPES = {
  IMPROVEMENT: 'improvement',
  CORRECTION: 'correction',
  ENHANCEMENT: 'enhancement'
} as const;

export type FeedbackType = typeof FEEDBACK_TYPES[keyof typeof FEEDBACK_TYPES];

// Validation schemas
export const REQUEST_SCHEMA = {
  section: 'string',
  content: 'string'
} as const;
