import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // We'll make calls from the server side
});

interface OpenAIResponse {
  content: string;
  // ... other response fields
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

export async function generateResumeContent(formData: ResumeFormData) {
  try {
    const completion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      max_tokens: 500,
      temperature: 0.7,
      prompt: `As a professional resume writer, create 3-4 achievement-focused bullet points for this work experience:
        Company: ${formData.company ?? "N/A"}
        Position: ${formData.position ?? "N/A"}
        Description: ${formData.description ?? "N/A"}
        
        Format the response as bullet points starting with • and focus on:
        - Quantifiable achievements and metrics
        - Leadership and initiative
        - Technical skills and tools used
        - Impact on the business`,
    });

    return completion.choices[0].text;
  } catch (error) {
    console.error('Error generating resume content:', error);
    throw error;
  }
}

export async function generateResume(formData: ResumeFormData): Promise<OpenAIResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Generate professional and concise content.",
        },
        {
          role: "user",
          content: `Create a professional resume summary for the following details:
          Name: ${formData.name ?? "N/A"}
          Role: ${formData.role ?? "N/A"}
          Experience: ${formData.experience ?? "N/A"}
          Skills: ${formData.skills ?? "N/A"}
          
          The summary should be engaging, achievement-oriented, and highlight key strengths.`,
        },
      ],
    });

    return {
      content: completion.choices[0]?.message?.content?.trim() ?? '',
    };
  } catch (error) {
    console.error('Error generating resume:', error);
    throw error;
  }
}

