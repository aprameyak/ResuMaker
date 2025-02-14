export interface FormData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
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