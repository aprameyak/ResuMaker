import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, 
});

interface OpenAIResponse {
  content: string;
  error?: string;
  status: 'success' | 'error';
}

interface ResumeFormData {
  company?: string;
  position?: string;
  description?: string;
  name?: string;
  role?: string;
  experience?: string;
  skills?: string;
}

export async function generateResumeContent(formData: ResumeFormData): Promise<OpenAIResponse> {
  try {
    if (!formData.description) {
      return {
        content: '',
        error: 'Job description is required',
        status: 'error'
      };
    }

    const completion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      max_tokens: 500,
      temperature: 0.7,
      prompt: `Based strictly on the following work experience details, create 3-4 professional bullet points that accurately reflect the role and responsibilities. Do not add or embellish any information that is not explicitly provided:

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
        - Maintain chronological order if multiple experiences are mentioned`,
    });

    return {
      content: completion.choices[0].text.trim(),
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

export async function generateResume(formData: ResumeFormData): Promise<OpenAIResponse> {
  try {
    if (!formData.name || !formData.role) {
      return {
        content: '',
        error: 'Name and role are required',
        status: 'error'
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a professional resume writer who focuses on accuracy and truthfulness. 
            Your task is to rephrase and organize provided information professionally without adding 
            unsupported claims or embellishments. Never invent or assume information not explicitly provided.`,
        },
        {
          role: "user",
          content: `Create a professional resume summary using only the following verified details:
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
            - Avoid superlatives unless directly supported by provided information`,
        },
      ],
    });

    return {
      content: completion.choices[0]?.message?.content?.trim() ?? '',
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

export function validateResumeData(formData: ResumeFormData): { isValid: boolean; error?: string } {
  if (!formData) {
    return { isValid: false, error: 'Form data is required' };
  }

  if (!formData.name?.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  if (!formData.role?.trim()) {
    return { isValid: false, error: 'Current role is required' };
  }

  return { isValid: true };
}
