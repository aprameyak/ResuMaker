import { NextResponse } from 'next/server';
import { generateResumeContent } from '@/app/utils/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const generatedContent = await generateResumeContent(body);
    
    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 