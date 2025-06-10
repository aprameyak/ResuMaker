import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV_VARS, API_RESPONSE, REQUEST_SCHEMA } from '../../constants';

// Move API key check to initialization
if (!ENV_VARS.GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY is not configured in environment variables');
}

const genAI = new GoogleGenerativeAI(ENV_VARS.GOOGLE_AI_API_KEY || '');

// Validate request body schema
const requestSchema = z.object({
  section: z.string(),
  content: z.string().min(1),
});

export async function POST(request) {
  if (!ENV_VARS.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { status: API_RESPONSE.ERROR, error: 'API configuration error' },
      { status: 500 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { status: API_RESPONSE.ERROR, error: 'Invalid request body' },
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
    let suggestions;
    try {
      suggestions = JSON.parse(text);
      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }
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
      }
    );
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { 
        status: API_RESPONSE.ERROR,
        error: 'Failed to analyze content'
      },
      { status: 500 }
    );
  }
} 