import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { FormData } from '@/app/types';

export interface GeminiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

export interface KeywordAnalysis {
  essential: string[];
  preferred: string[];
  skills: string[];
  industry: string[];
}

export interface ContentSuggestion {
  original: string;
  improved: string;
  reasoning: string;
}

export interface ResumeAnalysis {
  score: number;
  matchRate: number;
  keywords: {
    matched: string[];
    missing: string[];
  };
  suggestions: ContentSuggestion[];
}

export class GeminiService {
  private model: GenerativeModel;
  private config: GenerationConfig;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.config = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };
  }

  async generateContent(prompt: string): Promise<string> {
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: this.config,
    });
    return result.response.text();
  }

  async generateStructuredResponse<T>(prompt: string, schema: any): Promise<GeminiResponse<T>> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: this.config,
      });

      const text = result.response.text();
      let data: T;

      try {
        data = JSON.parse(text);
      } catch (error) {
        return {
          status: 'error',
          error: 'Failed to parse AI response as JSON'
        };
      }

      return {
        status: 'success',
        data
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to generate response'
      };
    }
  }

  async analyzeJobDescription(description: string): Promise<GeminiResponse<KeywordAnalysis>> {
    const prompt = `
Role: Expert ATS and Resume Analyst

Task: Analyze the following job description and extract key information with high precision.

Job Description:
${description}

Instructions:
1. Essential Keywords:
   - Extract ONLY explicitly required skills, qualifications, and experiences
   - Include exact terms used in "required", "must have", or similar sections
   - Include years of experience if specified
   - Include required degrees or certifications

2. Preferred Keywords:
   - Extract terms from "nice to have", "preferred", or "plus" sections
   - Include desired but not mandatory qualifications
   - Include beneficial experiences or skills

3. Technical/Soft Skills:
   - Extract all mentioned technical tools, languages, frameworks
   - Include methodologies and processes (e.g., Agile, CI/CD)
   - Extract soft skills (e.g., communication, leadership)
   - Include domain-specific terminology

4. Industry Context:
   - Identify the industry sector
   - Extract company culture indicators
   - Include business domain terminology
   - Note any industry-specific compliance or regulatory terms

Required Output Format:
{
  "essential": ["required skill/qualification"],
  "preferred": ["preferred skill/qualification"],
  "skills": ["technical/soft skill"],
  "industry": ["industry-specific term"]
}

Guidelines:
- Maintain exact terminology from the job description
- Do not paraphrase or combine terms
- Include complete phrases for complex requirements
- Separate compound terms when appropriate
- Preserve technical acronyms as written
- Include numeric requirements (e.g., "5+ years")`;

    return this.generateStructuredResponse<KeywordAnalysis>(prompt, {
      essential: ['string'],
      preferred: ['string'],
      skills: ['string'],
      industry: ['string']
    });
  }

  async analyzeResume(resume: FormData, jobDescription: string): Promise<GeminiResponse<ResumeAnalysis>> {
    const prompt = `
Role: Expert Resume Analyst and Career Coach

Task: Provide a comprehensive analysis of this resume against the job description with actionable feedback.

Resume:
${JSON.stringify(resume, null, 2)}

Job Description:
${jobDescription}

Instructions:
1. Keyword Analysis:
   - Compare resume content against job requirements
   - Identify exact keyword matches
   - Note missing critical terms
   - Check for industry-specific terminology

2. Experience Alignment:
   - Evaluate experience relevance
   - Check for role-specific achievements
   - Assess responsibility match
   - Compare years of experience

3. Skills Assessment:
   - Compare technical skills coverage
   - Evaluate soft skills representation
   - Check for required certifications
   - Assess skill level indicators

4. Content Quality:
   - Review achievement descriptions
   - Check for quantifiable results
   - Assess action verb usage
   - Evaluate clarity and conciseness

Required Output Format:
{
  "score": number (0-100),
  "matchRate": number (0-100),
  "keywords": {
    "matched": ["matched term with context"],
    "missing": ["missing critical term"]
  },
  "suggestions": [
    {
      "original": "current content",
      "improved": "suggested improvement",
      "reasoning": "detailed explanation of why this improvement helps"
    }
  ]
}

Guidelines:
- Provide specific, actionable feedback
- Focus on high-impact improvements
- Maintain professional tone
- Consider both ATS and human readers
- Prioritize critical missing elements
- Suggest concrete examples
- Consider industry context
- Note both strengths and areas for improvement`;

    return this.generateStructuredResponse<ResumeAnalysis>(prompt, {
      score: 'number',
      matchRate: 'number',
      keywords: {
        matched: ['string'],
        missing: ['string']
      },
      suggestions: [{
        original: 'string',
        improved: 'string',
        reasoning: 'string'
      }]
    });
  }

  async improveContent(
    content: string,
    context: { role: string; industry: string; level: string }
  ): Promise<GeminiResponse<ContentSuggestion>> {
    const prompt = `
Role: Professional Resume Writer

Task: Improve this resume content for a ${context.role} position in ${context.industry} at ${context.level} level.

Original Content:
${content}

Required Output Format:
{
  "original": "original text",
  "improved": "improved version",
  "reasoning": "explanation of improvements"
}

Focus on:
- Impact and measurable achievements
- Industry-specific terminology
- Action verbs and professional tone
- ATS-friendly phrasing`;

    return this.generateStructuredResponse<ContentSuggestion>(prompt, {
      original: 'string',
      improved: 'string',
      reasoning: 'string'
    });
  }

  async generateResumeContent(formData: FormData): Promise<GeminiResponse<string>> {
    try {
      const prompt = `
Generate a professional resume content based on the following information:

Personal Information:
- Name: ${formData.personalInfo.fullName}
- Title: ${formData.personalInfo.title}
- Contact: ${formData.personalInfo.email} | ${formData.personalInfo.phone}
- Location: ${formData.personalInfo.location}
${formData.personalInfo.linkedin ? `- LinkedIn: ${formData.personalInfo.linkedin}` : ''}
${formData.personalInfo.github ? `- GitHub: ${formData.personalInfo.github}` : ''}
${formData.personalInfo.portfolio ? `- Portfolio: ${formData.personalInfo.portfolio}` : ''}

Education:
${formData.education.map(edu => `
- ${edu.degree} in ${edu.field}
  ${edu.institution}, ${edu.location}
  ${edu.startDate} - ${edu.endDate}
  ${edu.achievements.length > 0 ? `Achievements:\n${edu.achievements.map(a => `  - ${a}`).join('\n')}` : ''}`).join('\n')}

Experience:
${formData.experience.map(exp => `
- ${exp.position}
  ${exp.company}, ${exp.location}
  ${exp.startDate} - ${exp.endDate}
  ${exp.description}
  ${exp.achievements.length > 0 ? `Achievements:\n${exp.achievements.map(a => `  - ${a}`).join('\n')}` : ''}`).join('\n')}

Skills:
- Technical: ${formData.skills.technical.join(', ')}
- Soft Skills: ${formData.skills.soft.join(', ')}
${formData.skills.languages.length > 0 ? `- Languages: ${formData.skills.languages.join(', ')}` : ''}
${formData.skills.certifications.length > 0 ? `- Certifications: ${formData.skills.certifications.join(', ')}` : ''}

Projects:
${formData.projects.map(proj => `
- ${proj.name}
  ${proj.description}
  Technologies: ${proj.technologies.join(', ')}
  ${proj.startDate} - ${proj.endDate}
  ${proj.achievements.length > 0 ? `Achievements:\n${proj.achievements.map(a => `  - ${a}`).join('\n')}` : ''}
  ${proj.link ? `Link: ${proj.link}` : ''}`).join('\n')}

Please generate a professional resume content that:
1. Highlights key achievements and impact
2. Uses action verbs and quantifiable results
3. Maintains a clear and consistent format
4. Is optimized for ATS systems
5. Focuses on relevant skills and experiences`;

      const result = await this.generateContent(prompt);
      return {
        status: 'success',
        data: result
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to generate resume content'
      };
    }
  }
}

// Create a singleton instance
export const geminiService = new GeminiService();

export const generateResumeContent = async (data: FormData): Promise<GeminiResponse<string>> => {
  try {
    const prompt = `
Generate professional resume content based on the following information:
${JSON.stringify(data, null, 2)}

Guidelines:
- Use clear, concise language
- Focus on achievements and impact
- Use strong action verbs
- Include relevant keywords
- Maintain professional tone
- Format for ATS compatibility`;

    const text = await geminiService.generateContent(prompt);
    return {
      data: text,
      status: 'success'
    };
  } catch (error) {
    return {
      data: '',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 