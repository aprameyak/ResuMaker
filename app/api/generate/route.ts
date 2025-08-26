import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV_VARS, API_RESPONSE } from '../../constants';
import { rateLimit, getRateLimitHeaders } from '../../lib/rate-limiter';

// Validate request body schema
const requestSchema = z.object({
  content: z.string().min(1),
  type: z.string()
});

interface Suggestion {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'improvement' | 'correction' | 'enhancement';
}

interface GenerateResponse {
  status: string;
  data?: Suggestion[];
  error?: string;
}

const genAI = new GoogleGenerativeAI(ENV_VARS.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function POST(request: Request): Promise<NextResponse<GenerateResponse>> {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(clientIP);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { status: API_RESPONSE.ERROR, error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { status: API_RESPONSE.ERROR, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { content, type } = validatedData.data;

    const prompt = `Analyze this resume ${type} content and provide specific improvements. For each suggestion, provide:
    1. The original text that needs improvement
    2. A suggested replacement
    3. A brief explanation of why the change would be better
    4. The type of change (improvement, correction, or enhancement)

    Content to analyze:
    ${content}

    Format each suggestion as a JSON object with these exact keys:
    {
      "original": "the exact text to replace",
      "suggestion": "the improved text",
      "explanation": "why this change would be better",
      "type": "improvement" or "correction" or "enhancement"
    }

    Return an array of 2-3 such suggestions, focusing on the most impactful improvements.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response text as JSON array of suggestions
    let suggestions: Suggestion[];
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }
      suggestions = parsed as Suggestion[];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json(
        { status: API_RESPONSE.ERROR, error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: API_RESPONSE.SUCCESS,
        data: suggestions
      },
      {
        headers: getRateLimitHeaders(rateLimitResult)
      }
    );
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { 
        status: API_RESPONSE.ERROR,
        error: 'Failed to generate content'
      },
      { status: 500 }
    );
  }
}
