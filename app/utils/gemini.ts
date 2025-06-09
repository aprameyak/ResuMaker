import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface ResumeFormData {
  company?: string;
  position?: string;
  description?: string;
  name?: string;
  role?: string;
  experience?: string;
  skills?: string;
}

export async function generateResumeContent(formData: ResumeFormData) {
  try {
    if (!formData.description) {
      return {
        content: '',
        error: 'Job description is required',
        status: 'error'
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Based strictly on the following work experience details, create 3-4 professional bullet points that accurately reflect the role and responsibilities. Do not add or embellish any information that is not explicitly provided:

      Company: ${formData.company ?? "N/A"}
      Position: ${formData.position ?? "N/A"}
      Description: ${formData.description ?? "N/A"}
      
      Guidelines:
      - Use only information explicitly provided in the description
      - Format as bullet points starting with •
      - Focus on converting existing achievements into clear, professional language
      - If metrics or numbers are mentioned, include them exactly as stated
      - Do not invent or assume any accomplishments, metrics, or responsibilities
      - If the description is vague or lacks detail, keep the bullet points general and factual
      - Use active voice and professional language to describe actual responsibilities
      - Highlight technical skills only if specifically mentioned
      - Maintain chronological order if multiple experiences are mentioned`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      status: 'success'
    };
  } catch (error) {
    console.error('Error generating resume content:', error);
    return {
      content: '',
      error: 'Failed to generate resume content. Please try again.',
      status: 'error'
    };
  }
}

export async function generateResume(formData: ResumeFormData) {
  try {
    if (!formData.name || !formData.role) {
      return {
        content: '',
        error: 'Name and role are required',
        status: 'error'
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create a professional resume summary using only the following verified details:
      Name: ${formData.name ?? "N/A"}
      Role: ${formData.role ?? "N/A"}
      Experience: ${formData.experience ?? "N/A"}
      Skills: ${formData.skills ?? "N/A"}
      
      Guidelines:
      - Use only the information provided above
      - Focus on presenting existing experience and skills clearly
      - Do not add assumptions about achievements or capabilities
      - Keep the summary concise and factual (2-3 sentences maximum)
      - If information is limited, maintain accuracy over elaboration
      - Begin with current role/professional identity
      - Include years of experience only if explicitly stated
      - Mention skills only if they are specifically listed
      - Format in a clear, professional paragraph
      - Avoid superlatives unless directly supported by provided information`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      status: 'success'
    };
  } catch (error) {
    console.error('Error generating resume:', error);
    return {
      content: '',
      error: 'Failed to generate resume summary. Please try again.',
      status: 'error'
    };
  }
} 