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
    // Validate request
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PDF, DOC, DOCX, or TXT file.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = './uploads';
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate unique filename
    const filename = `${Date.now()}-${file.name}`;
    const filepath = `${uploadDir}/${filename}`;

    try {
      // Convert File to Buffer and write to filesystem
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
    } catch (error) {
      console.error('Error writing file:', error);
      return NextResponse.json(
        { error: 'Failed to process uploaded file' },
        { status: 500 }
      );
    }

    // Parse resume based on file type
    let parsedData: Partial<FormData>;
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        parsedData = await parsePdfResume(filepath);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        parsedData = await parseDocxResume(filepath);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      // Clean up file
      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to parse resume content' },
        { status: 500 }
      );
    }

    // Clean up uploaded file
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error cleaning up file:', error);
      // Don't fail the request if cleanup fails
    }

    // Validate parsed data
    if (!parsedData || Object.keys(parsedData).length === 0) {
      return NextResponse.json(
        { error: 'Failed to extract content from resume' },
        { status: 422 }
      );
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
  const experience: ExtractedSections['experience'] = [];
  const experienceRegex = /(?:Experience|Work Experience|Professional Experience)(?:\n|:)(.*?)(?:Education|Skills|Projects|$)/is;
  const match = text.match(experienceRegex);
  
  if (match) {
    const experienceText = match[1];
    const entries = experienceText.split(/\n\n+/);
    
    for (const entry of entries) {
      if (!entry.trim()) continue;
      
      const lines = entry.split('\n');
      const titleCompanyMatch = lines[0]?.match(/(?:(.+?)(?:\s+at\s+|\s*[-|]\s*)(.+))|(.+)/);
      const dateMatch = entry.match(/(\w+ \d{4})\s*(?:-|to)\s*(\w+ \d{4}|Present)/i);
      const locationMatch = entry.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/);
      
      // Extract achievements/bullet points
      const achievements = lines
        .slice(1)
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^[•-]\s*/, ''));
      
      // Extract description (non-bullet point text)
      const description = lines
        .slice(1)
        .filter(line => !line.trim().startsWith('•') && !line.trim().startsWith('-'))
        .join('\n')
        .trim();
      
      if (titleCompanyMatch) {
        experience.push({
          company: titleCompanyMatch[2] || '',
          title: titleCompanyMatch[1] || titleCompanyMatch[3] || '',
          startDate: dateMatch ? dateMatch[1] : '',
          endDate: dateMatch ? dateMatch[2] : '',
          description: description,
          location: locationMatch ? locationMatch[1] : '',
          achievements: achievements
        });
      }
    }
  }
  
  return experience;
}

function extractProjectsSection(text: string): ExtractedSections['projects'] {
  const projects: ExtractedSections['projects'] = [];
  const projectsRegex = /(?:Projects|Personal Projects|Technical Projects)(?:\n|:)(.*?)(?:Experience|Education|Skills|$)/is;
  const match = text.match(projectsRegex);
  
  if (match) {
    const projectsText = match[1];
    const entries = projectsText.split(/\n\n+/);
    
    for (const entry of entries) {
      if (!entry.trim()) continue;
      
      const lines = entry.split('\n');
      const nameMatch = lines[0]?.match(/(.+?)(?:\s*[-|]\s*|$)/);
      const dateMatch = entry.match(/(\w+ \d{4})\s*(?:-|to)\s*(\w+ \d{4}|Present)/i);
      const linkMatch = entry.match(/(?:Link|URL|GitHub):\s*(https?:\/\/[^\s\n]+)/i);
      
      // Extract technologies
      const techMatch = entry.match(/(?:Technologies|Tech Stack|Built with):\s*([^\n]+)/i);
      const technologies = techMatch 
        ? techMatch[1].split(/[,|]/).map(tech => tech.trim()).filter(Boolean)
        : [];
      
      // Extract achievements/bullet points
      const achievements = lines
        .slice(1)
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^[•-]\s*/, ''));
      
      // Extract description (non-bullet point text)
      const description = lines
        .slice(1)
        .filter(line => 
          !line.trim().startsWith('•') && 
          !line.trim().startsWith('-') &&
          !line.match(/(?:Technologies|Tech Stack|Built with|Link|URL|GitHub):/i)
        )
        .join('\n')
        .trim();
      
      if (nameMatch) {
        projects.push({
          name: nameMatch[1].trim(),
          description: description,
          technologies: technologies,
          startDate: dateMatch ? dateMatch[1] : '',
          endDate: dateMatch ? dateMatch[2] : '',
          link: linkMatch ? linkMatch[1] : '',
          achievements: achievements
        });
      }
    }
  }
  
  return projects;
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