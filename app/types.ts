export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    school: string;
    degree: string;
    graduationDate: string;
  }[];
  skills: string[];
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  graduationDate: string;
}

export interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

// Type for AI feedback
export interface AIFeedback {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'improvement' | 'correction' | 'enhancement';
}

// Type for API responses
export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
} 