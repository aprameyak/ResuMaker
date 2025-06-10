export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
  location: string;
}

export interface Education {
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

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  startDate: string;
  endDate: string;
  achievements: string[];
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
  description: string;
}

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

export interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skills;
}

export type ResumeSection = keyof FormData;

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