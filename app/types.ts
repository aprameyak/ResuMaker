// Resume section types
export type ResumeSectionType = 'education' | 'experience' | 'skills' | 'projects' | 'summary';

export interface ResumeSection {
  id: string;
  title: string;
  content: string;
  type: ResumeSectionType;
}

// Editor and workspace states
export type EditorMode = 'edit' | 'preview' | 'analyze';

export interface EditorState {
  mode: EditorMode;
  selectedSection?: keyof FormData;
  selectedTemplate?: ResumeTemplate;
  isDirty: boolean;
}

export interface AnalysisState {
  atsScore?: ATSScore;
  jobMatch?: JobMatch;
  isAnalyzing: boolean;
  error?: string;
}

export interface SaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  error?: string;
}

// ATS Analysis types
export interface ATSScore {
  overall: number;
  sections: {
    [key: string]: number;
  };
  keywords: {
    matched: string[];
    missing: string[];
  };
  suggestions: string[];
}

export interface JobMatch {
  score: number;
  requirements: {
    met: string[];
    missing: string[];
  };
  recommendations: string[];
}

// Resume template types
export interface ResumeTemplate {
  id: string;
  name: string;
  preview: string;
  style: {
    fontFamily: string;
    fontSize: string;
    spacing: string;
    color: string;
  };
}

// Base interfaces for resume components
export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  portfolio?: string;
  linkedin?: string;
  github?: string;
}

export interface BaseSection {
  description?: string;
}

export interface Education extends BaseSection {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements: string[];
  location: string;
  description: string;
}

export interface Experience extends BaseSection {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
  achievements: string[];
}

export interface Skills extends BaseSection {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
  description: string;
}

export interface Project extends BaseSection {
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  achievements: string[];
  link?: string;
}

// Main form data interface that uses the base interfaces
export interface FormData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: Skills;
  projects: Project[];
}

export interface AIFeedback {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'improvement' | 'correction' | 'enhancement';
}

export interface APIResponse<T = never> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

export interface LaTeXConfig {
  documentClass: string;
  fontSize: string;
  margin: string;
  packages: string[];
  customCommands: string[];
} 