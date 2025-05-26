import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { AIFeedback } from '@/app/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate request body schema
const requestSchema = z.object({
  section: z.string(),
  content: z.string().min(1),
});

// Define response types
interface SuccessResponse {
  status: 'success';
  data: AIFeedback[];
}

interface ErrorResponse {
  status: 'error';
  error: string;
}

type APIResponse = SuccessResponse | ErrorResponse;

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
});

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    // Apply rate limiting
    const identifier = request.headers.get('x-real-ip') || 'anonymous';
    const { success } = await limiter.check(10, identifier); // 10 requests per minute per IP
    
    if (!success) {
      return NextResponse.json<ErrorResponse>(
        { status: 'error', error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json<ErrorResponse>(
        { status: 'error', error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { section, content } = validatedData.data;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json<ErrorResponse>(
        { status: 'error', error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI API with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a professional resume reviewer. Analyze the following ${section} content and provide specific, actionable suggestions for improvement. Focus on clarity, impact, and professional presentation. For each suggestion, provide the original text, the suggested improvement, and a brief explanation of why the change would be beneficial.`
            },
            {
              role: 'user',
              content
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const suggestions = completion.choices[0]?.message?.content;
        if (!suggestions) {
          throw new Error('No suggestions received from OpenAI');
        }

        // Parse the suggestions into structured feedback
        const feedback: AIFeedback[] = suggestions.split('\n\n')
          .filter(Boolean)
          .map(suggestion => {
            const [original, improved, explanation] = suggestion.split('\n');
            return {
              original: original.replace('Original: ', '').trim(),
              suggestion: improved.replace('Improved: ', '').trim(),
              explanation: explanation.replace('Explanation: ', '').trim(),
              type: 'improvement' as const
            };
          })
          .filter(feedback => 
            feedback.original && 
            feedback.suggestion && 
            feedback.explanation
          );

        return NextResponse.json<SuccessResponse>(
          { status: 'success', data: feedback },
          { status: 200 }
        );
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // If all retries failed
    console.error('All retry attempts failed:', lastError);
    return NextResponse.json<ErrorResponse>(
      { 
        status: 'error', 
        error: 'Failed to get AI suggestions. Please try again later.' 
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json<ErrorResponse>(
      { 
        status: 'error', 
        error: 'An unexpected error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 