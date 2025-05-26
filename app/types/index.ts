export interface FormData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    graduationDate: string;
  }>;
  skills: string[];
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