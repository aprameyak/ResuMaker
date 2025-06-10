import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rateLimit } from '@/app/lib/rate-limit';
import { z } from 'zod';
import { AIFeedback, APIResponse } from '@/app/types';

// Move API key check to initialization
if (!process.env.GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY is not configured in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Validate request body schema
const requestSchema = z.object({
  section: z.string(),
  content: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<AIFeedback[]>>> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.error('API request failed: GOOGLE_AI_API_KEY is not configured');
    return NextResponse.json<APIResponse<AIFeedback[]>>(
      { status: 'error', error: 'API configuration error. Please check server logs.' },
      { status: 500 }
    );
  }

  try {
    // Only initialize rate limiter if Redis is configured
    const limiter = rateLimit({
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 500,
      limit: 10
    });
    
    // Apply rate limiting based on IP
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = limiter.check(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json<APIResponse<AIFeedback[]>>(
        { 
          status: 'error',
          error: 'Rate limit exceeded. Please try again later.'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json<APIResponse<AIFeedback[]>>(
        { status: 'error', error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { section, content } = validatedData.data;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this resume ${section} content and provide specific improvements. For each suggestion, provide:
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
    let suggestions: AIFeedback[];
    try {
      suggestions = JSON.parse(text);
      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return NextResponse.json<APIResponse<AIFeedback[]>>(
        { status: 'error', error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    return NextResponse.json<APIResponse<AIFeedback[]>>(
      {
        status: 'success',
        data: suggestions
      },
      { 
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json<APIResponse<AIFeedback[]>>(
      { 
        status: 'error',
        error: 'Failed to analyze content'
      },
      { status: 500 }
    );
  }
} 