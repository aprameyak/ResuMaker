// Constants for type checking
export const SECTION_TYPES = {
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  SUMMARY: 'summary'
} as const;

export type SectionType = typeof SECTION_TYPES[keyof typeof SECTION_TYPES];

export const FEEDBACK_TYPES = {
  IMPROVEMENT: 'improvement',
  CORRECTION: 'correction',
  ENHANCEMENT: 'enhancement'
} as const;

export type FeedbackType = typeof FEEDBACK_TYPES[keyof typeof FEEDBACK_TYPES];

// API Response structure
export const API_RESPONSE = {
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type ApiResponseType = typeof API_RESPONSE[keyof typeof API_RESPONSE];

// Validation schemas
export const REQUEST_SCHEMA = {
  section: 'string',
  content: 'string'
} as const;

// Environment variables
export const ENV_VARS = {
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  NEXT_PUBLIC_MAX_CONTENT_LENGTH: process.env.NEXT_PUBLIC_MAX_CONTENT_LENGTH || '5000'
} as const;
