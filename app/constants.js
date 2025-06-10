// Constants for type checking
export const SECTION_TYPES = {
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  SUMMARY: 'summary'
};

export const FEEDBACK_TYPES = {
  IMPROVEMENT: 'improvement',
  CORRECTION: 'correction',
  ENHANCEMENT: 'enhancement'
};

// API Response structure
export const API_RESPONSE = {
  SUCCESS: 'success',
  ERROR: 'error'
};

// Validation schemas
export const REQUEST_SCHEMA = {
  section: 'string',
  content: 'string'
};

// Environment variables
export const ENV_VARS = {
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  NEXT_PUBLIC_MAX_CONTENT_LENGTH: process.env.NEXT_PUBLIC_MAX_CONTENT_LENGTH || '5000'
}; 