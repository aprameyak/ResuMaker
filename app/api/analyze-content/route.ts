import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { APIResponse, AIFeedback } from '@/app/types';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { section, content } = await request.json();

    if (!section || !content) {
      return NextResponse.json(
        { error: 'Missing required fields', status: 'error' } as APIResponse<never>,
        { status: 400 }
      );
    }

    const prompt = `
      Analyze the following ${section} content from a resume and provide specific suggestions for improvement.
      For each suggestion, provide:
      1. The original text
      2. A suggested improvement
      3. A brief explanation of why this change would make the resume stronger
      4. The type of change (improvement, correction, or enhancement)

      Content to analyze:
      ${content}

      Provide the response in the following JSON format:
      [
        {
          "original": "original text",
          "suggestion": "improved text",
          "explanation": "why this change helps",
          "type": "improvement|correction|enhancement"
        }
      ]

      Focus on:
      - Using strong action verbs
      - Quantifying achievements
      - Removing filler words
      - Improving clarity and impact
      - Fixing grammar and style issues
      - Making the content more professional
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and career coach. Your goal is to help improve resume content to be more impactful and professional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const suggestions = JSON.parse(completion.choices[0]?.message?.content || '[]') as AIFeedback[];

    return NextResponse.json(
      { data: suggestions, status: 'success' } as APIResponse<AIFeedback[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content', status: 'error' } as APIResponse<never>,
      { status: 500 }
    );
  }
} 