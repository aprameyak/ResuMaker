import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { FormData } from '@/app/types';

export interface GeminiResponse<T> {
  data: T;
  status: 'success' | 'error';
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

class GeminiService {
  private model: GenerativeModel;
  private config: GenerationConfig;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.config = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };
  }

  private async generateStructuredResponse<T>(
    prompt: string,
    schema: Record<string, any>
  ): Promise<GeminiResponse<T>> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: this.config,
      });

      const response = result.response;
      const text = response.text();
      return {
        data: JSON.parse(text) as T,
        status: 'success'
      };
    } catch (error) {
      return {
        data: {} as T,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async analyzeJobDescription(description: string): Promise<GeminiResponse<KeywordAnalysis>> {
    const prompt = `
Role: Expert ATS and Resume Analyst

Task: Analyze the following job description and extract key information.

Job Description:
${description}

Required Output Format:
{
  "essential": ["required skill/qualification"],
  "preferred": ["preferred skill/qualification"],
  "skills": ["technical/soft skill"],
  "industry": ["industry-specific term"]
}

Focus on accuracy and relevance. Identify terms that will significantly impact ATS matching.`;

    return this.generateStructuredResponse<KeywordAnalysis>(prompt, {
      essential: ['string'],
      preferred: ['string'],
      skills: ['string'],
      industry: ['string']
    });
  }

  async analyzeResume(resume: FormData, jobDescription: string): Promise<GeminiResponse<ResumeAnalysis>> {
    const prompt = `
Role: Expert Resume Analyst

Task: Analyze this resume against the job description and provide detailed feedback.

Resume:
${JSON.stringify(resume, null, 2)}

Job Description:
${jobDescription}

Required Output Format:
{
  "score": number (0-100),
  "matchRate": number (0-100),
  "keywords": {
    "matched": ["matched term"],
    "missing": ["missing important term"]
  },
  "suggestions": [
    {
      "original": "original text",
      "improved": "improved version",
      "reasoning": "why this improvement helps"
    }
  ]
}

Provide actionable insights for improving the resume's match rate.`;

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
}

export const geminiService = new GeminiService(); 