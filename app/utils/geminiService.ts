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
}

export const geminiService = new GeminiService(); 