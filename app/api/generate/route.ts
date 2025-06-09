import { NextResponse } from 'next/server';
import { generateResumeContent } from '@/app/utils/gemini';

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'Google AI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const generatedContent = await generateResumeContent(body);
    
    if (generatedContent.status === 'error') {
      return NextResponse.json(
        { error: generatedContent.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ content: generatedContent.content });
  } catch (err) {
    console.error('Error generating content:', err);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 