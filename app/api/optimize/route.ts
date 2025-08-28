import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV_VARS, API_RESPONSE } from '../../constants';

// Validate request body schema
const requestSchema = z.object({
  content: z.string().min(1),
  keywords: z.object({
    essential: z.array(z.string()),
    preferred: z.array(z.string()),
    skills: z.array(z.string()),
    industry: z.array(z.string())
  })
});

interface Keywords {
  essential: string[];
  preferred: string[];
  skills: string[];
  industry: string[];
}

interface Change {
  original: string;
  replacement: string;
  explanation: string;
}

interface OptimizationResult {
  optimized: string;
  changes: Change[];
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

    const { content, keywords } = validatedData.data;

    const prompt = `Optimize this resume content to better match the job requirements. Here are the key keywords and skills to incorporate:

    Essential Keywords: ${keywords.essential.join(', ')}
    Preferred Keywords: ${keywords.preferred.join(', ')}
    Technical Skills: ${keywords.skills.join(', ')}
    Industry Terms: ${keywords.industry.join(', ')}

    Original Content:
    ${content}

    Please provide an optimized version that:
    1. Naturally incorporates relevant keywords
    2. Maintains the original meaning and structure
    3. Improves clarity and impact
    4. Highlights relevant skills and experiences

    Format the response as a JSON object with these exact keys:
    {
      "optimized": "the optimized content",
      "changes": [
        {
          "original": "original text",
          "replacement": "replacement text",
          "explanation": "why this change improves the content"
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const optimization: OptimizationResult = JSON.parse(response.text());

    return NextResponse.json({
      status: API_RESPONSE.SUCCESS,
      data: {
        optimized: optimization.optimized,
        changes: optimization.changes
      }
    });
  } catch (error) {
    console.error('Error optimizing content:', error);
    return NextResponse.json(
      { 
        status: API_RESPONSE.ERROR,
        error: 'Failed to optimize content'
      },
      { status: 500 }
    );
  }
}
