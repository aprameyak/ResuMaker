import { NextResponse } from 'next/server';
import { geminiService } from '@/app/utils/geminiService';
import { FormData } from '@/app/types';
import { z } from 'zod';

// Validation schema for the request body
const formDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, "Full name is required"),
    title: z.string().min(1, "Title is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(1, "Phone is required"),
    location: z.string().min(1, "Location is required"),
    portfolio: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
  education: z.array(z.object({
    institution: z.string().min(1, "Institution name is required"),
    degree: z.string().min(1, "Degree is required"),
    field: z.string().min(1, "Field of study is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    location: z.string().min(1, "Location is required"),
    achievements: z.array(z.string()),
  })).min(1, "At least one education entry is required"),
  experience: z.array(z.object({
    company: z.string().min(1, "Company name is required"),
    position: z.string().min(1, "Position is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    achievements: z.array(z.string()),
  })).min(1, "At least one experience entry is required"),
  skills: z.object({
    technical: z.array(z.string()).min(1, "At least one technical skill is required"),
    soft: z.array(z.string()).min(1, "At least one soft skill is required"),
    languages: z.array(z.string()),
    certifications: z.array(z.string()),
  }),
  projects: z.array(z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(1, "Project description is required"),
    technologies: z.array(z.string()).min(1, "At least one technology is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    achievements: z.array(z.string()),
    link: z.string().url().optional(),
  })).min(1, "At least one project is required"),
  certifications: z.array(z.object({
    name: z.string().min(1, "Certification name is required"),
    issuer: z.string().min(1, "Issuer is required"),
    date: z.string().min(1, "Date is required"),
    link: z.string().url().optional(),
  })).optional(),
});

export async function POST(request: Request) {
  try {
    // Check API key first
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('[ERROR] Google AI API key not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = formDataSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[VALIDATION ERROR]', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Generate content
    const generatedContent = await geminiService.generateResumeContent(validatedData);
    
    if (generatedContent.status === 'error') {
      console.error('[GENERATION ERROR]', generatedContent.error);
      return NextResponse.json(
        { error: generatedContent.error || 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { content: generatedContent.data },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (err) {
    console.error('[UNEXPECTED ERROR]', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 