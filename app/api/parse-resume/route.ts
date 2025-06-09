import { NextResponse } from 'next/server';
import { FormData, PersonalInfo, Education, Experience, Project, Skills } from '@/app/types';
import { exec } from 'child_process';
import { writeFile, mkdir, readFile } from 'fs/promises';
import * as fs from 'fs/promises';
import * as mammoth from 'mammoth';
import { PdfReader } from 'pdfreader';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TEMP_DIR = '/tmp/resumaker-uploads';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = './uploads';
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const filename = `${Date.now()}-${file.name}`;
    const filepath = `${uploadDir}/${filename}`;

    // Convert File to Buffer and write to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Parse resume based on file type
    let parsedData: Partial<FormData>;
    
    if (file.name.toLowerCase().endsWith('.pdf')) {
      parsedData = await parsePdfResume(filepath);
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      parsedData = await parseDocxResume(filepath);
    } else {
      throw new Error('Unsupported file format');
    }

    // Clean up uploaded file
    await fs.unlink(filepath);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}

function transformToFormData(parsedData: any): Partial<FormData> {
  const personalInfo: Partial<PersonalInfo> = {
    fullName: parsedData.personalInfo?.name || '',
    title: '', // Will need to be inferred or manually added
    email: parsedData.personalInfo?.email || '',
    phone: parsedData.personalInfo?.phone || '',
    location: parsedData.personalInfo?.location || '',
    linkedin: parsedData.personalInfo?.links?.linkedin || '',
    github: parsedData.personalInfo?.links?.github || '',
    portfolio: parsedData.personalInfo?.links?.portfolio || ''
  };

  const education: Partial<Education>[] = (parsedData.education || []).map((edu: any) => ({
    institution: edu.school || '',
    degree: edu.degree || '',
    field: '', // Will need to be inferred or manually added
    startDate: '', // Will need to be parsed from graduationDate
    endDate: edu.graduationDate || '',
    location: edu.location || '',
    achievements: []
  }));

  const experience: Partial<Experience>[] = (parsedData.experience || []).map((exp: any) => ({
    company: exp.company || '',
    position: exp.title || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || '',
    description: exp.description || '',
    location: exp.location || '',
    achievements: exp.achievements || []
  }));

  const projects: Partial<Project>[] = (parsedData.projects || []).map((proj: any) => ({
    name: proj.name || '',
    description: proj.description || '',
    technologies: proj.technologies || [],
    startDate: proj.startDate || '',
    endDate: proj.endDate || '',
    link: proj.link || '',
    achievements: proj.achievements || []
  }));

  const skills: Partial<Skills> = {
    technical: parsedData.skills?.technical || [],
    soft: parsedData.skills?.soft || [],
    languages: parsedData.skills?.languages || [],
    certifications: parsedData.skills?.certifications || []
  };

  return {
    personalInfo: personalInfo as PersonalInfo,
    education: education as Education[],
    experience: experience as Experience[],
    projects: projects as Project[],
    skills: skills as Skills
  };
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    let text = '';

    reader.parseBuffer(buffer, (err: any, item: any) => {
      if (err) {
        reject(new Error(err.message || 'Failed to parse PDF'));
      } else if (!item) {
        resolve(text);
      } else if (item.text) {
        text += item.text + ' ';
      }
    });
  });
}

async function parseDocxResume(filepath: string): Promise<Partial<FormData>> {
  try {
    const content = await fs.readFile(filepath);
    const result = await mammoth.extractRawText({ buffer: content });
    const text = result.value;
    return transformToFormData(extractSections(text));
  } catch (error) {
    console.error('Error parsing DOCX resume:', error);
    throw new Error('Failed to parse DOCX resume');
  }
}

async function parsePdfResume(filepath: string): Promise<Partial<FormData>> {
  try {
    const content = await fs.readFile(filepath);
    const text = await extractTextFromPdf(content);
    return transformToFormData(extractSections(text));
  } catch (error) {
    console.error('Error parsing PDF resume:', error);
    throw new Error('Failed to parse PDF resume');
  }
}

interface ExtractedSections {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    links: {
      linkedin: string;
      github: string;
      portfolio: string;
    };
  };
  education: {
    school: string;
    degree: string;
    graduationDate: string;
    location: string;
  }[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
    location: string;
    achievements: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
}

function extractSections(text: string): ExtractedSections {
  // Basic extraction logic - this should be enhanced with more sophisticated parsing
  const sections: ExtractedSections = {
    personalInfo: {
      fullName: extractFullName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      location: extractLocation(text),
      links: {
        linkedin: extractLinkedIn(text),
        github: extractGitHub(text),
        portfolio: extractPortfolio(text)
      }
    },
    education: extractEducationSection(text),
    experience: extractExperienceSection(text),
    projects: extractProjectsSection(text),
    skills: {
      technical: extractTechnicalSkills(text),
      soft: extractSoftSkills(text),
      languages: extractLanguages(text),
      certifications: extractCertifications(text)
    }
  };

  return sections;
}

// Helper functions for text extraction
function extractFullName(text: string): string {
  // Implement name extraction logic
  return '';
}

function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

function extractLocation(text: string): string {
  // Implement location extraction logic
  return '';
}

function extractLinkedIn(text: string): string {
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/;
  const match = text.match(linkedinRegex);
  return match ? `https://www.${match[0]}` : '';
}

function extractGitHub(text: string): string {
  const githubRegex = /github\.com\/[a-zA-Z0-9-]+/;
  const match = text.match(githubRegex);
  return match ? `https://www.${match[0]}` : '';
}

function extractPortfolio(text: string): string {
  // Implement portfolio URL extraction logic
  return '';
}

function extractEducationSection(text: string): ExtractedSections['education'] {
  // Implement education section extraction logic
  return [];
}

function extractExperienceSection(text: string): ExtractedSections['experience'] {
  // Implement experience section extraction logic
  return [];
}

function extractProjectsSection(text: string): ExtractedSections['projects'] {
  // Implement projects section extraction logic
  return [];
}

function extractTechnicalSkills(text: string): string[] {
  // Implement technical skills extraction logic
  return [];
}

function extractSoftSkills(text: string): string[] {
  // Implement soft skills extraction logic
  return [];
}

function extractLanguages(text: string): string[] {
  // Implement languages extraction logic
  return [];
}

function extractCertifications(text: string): string[] {
  // Implement certifications extraction logic
  return [];
} 