import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV_VARS, API_RESPONSE } from '../../constants';

// Validate request body schema
const requestSchema = z.object({
  content: z.string().min(1, "Resume content is required")
});

interface Education {
  institution: string;
  degree: string;
  field: string;
  dates: string;
  gpa?: string;
}

interface Experience {
  company: string;
  position: string;
  dates: string;
  responsibilities: string[];
}

interface Skills {
  technical: string[];
  soft: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
}

interface ParsedResume {
  summary: string;
  education: Education[];
  experience: Experience[];
  skills: Skills;
  projects: Project[];
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

    const { content } = validatedData.data;

    const prompt = `Parse this resume content and extract structured information. Format the response as a JSON object with these exact sections:

    {
      "summary": "professional summary or objective",
      "education": [
        {
          "institution": "school name",
          "degree": "degree name",
          "field": "field of study",
          "dates": "start date - end date",
          "gpa": "GPA if available"
        }
      ],
      "experience": [
        {
          "company": "company name",
          "position": "job title",
          "dates": "start date - end date",
          "responsibilities": ["responsibility 1", "responsibility 2"]
        }
      ],
      "skills": {
        "technical": ["skill 1", "skill 2"],
        "soft": ["skill 1", "skill 2"]
      },
      "projects": [
        {
          "name": "project name",
          "description": "project description",
          "technologies": ["tech 1", "tech 2"]
        }
      ]
    }

    Resume Content:
    ${content}

    Only respond with the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed: ParsedResume = JSON.parse(response.text());

    return NextResponse.json({
      status: API_RESPONSE.SUCCESS,
      data: parsed
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { 
        status: API_RESPONSE.ERROR,
        error: 'Failed to parse resume'
      },
      { status: 500 }
    );
  }
}
