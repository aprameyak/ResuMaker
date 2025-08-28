import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV_VARS, API_RESPONSE } from '../../constants';

// Validate request body schema
const requestSchema = z.object({
  description: z.string().min(1, "Job description is required").max(10000, "Job description is too long")
});

interface JobAnalysis {
  essential: string[];
  preferred: string[];
  skills: string[];
  industry: string[];
}

const genAI = new GoogleGenerativeAI(ENV_VARS.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          status: API_RESPONSE.ERROR,
          error: 'Invalid request data',
          details: validatedData.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { description } = validatedData.data;

    const prompt = `Analyze this job description and extract key information in the following categories:
1. Essential Keywords (must-have skills and requirements)
2. Preferred Keywords (nice-to-have skills and qualifications)
3. Technical Skills
4. Industry-specific Terms

Job Description:
${description}

Format the response as a JSON object with these exact keys:
{
  "essential": ["keyword1", "keyword2"],
  "preferred": ["keyword1", "keyword2"],
  "skills": ["skill1", "skill2"],
  "industry": ["term1", "term2"]
}

Only respond with the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis: JobAnalysis = JSON.parse(response.text());

    return NextResponse.json({
      status: API_RESPONSE.SUCCESS,
      data: {
        keywords: {
          essential: analysis.essential,
          preferred: analysis.preferred,
          skills: analysis.skills,
          industry: analysis.industry
        }
      }
    });
  } catch (error) {
    console.error('Error analyzing job description:', error);
    return NextResponse.json(
      { 
        status: API_RESPONSE.ERROR,
        error: 'Failed to analyze job description'
      },
      { status: 500 }
    );
  }
}
