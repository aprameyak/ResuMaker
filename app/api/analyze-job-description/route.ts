import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

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
    const analysis = JSON.parse(response.text());

    return NextResponse.json({
      keywords: {
        essential: analysis.essential,
        preferred: analysis.preferred,
        skills: analysis.skills,
        industry: analysis.industry
      }
    });

  } catch (error) {
    console.error('Error analyzing job description:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
} 