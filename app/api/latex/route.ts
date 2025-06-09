import { NextResponse } from 'next/server';
import { generateLatexDocument } from '@/app/utils/latexTemplate';
import { FormData } from '@/app/types';
import { exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEMP_DIR = '/tmp/resumaker';

export async function POST(request: Request) {
  try {
    const data: FormData = await request.json();
    
    // Generate LaTeX content
    const latexContent = generateLatexDocument(data);
    
    // Create temp directory if it doesn't exist
    await mkdir(TEMP_DIR, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const baseFilename = `resume_${timestamp}`;
    const texFile = join(TEMP_DIR, `${baseFilename}.tex`);
    const pdfFile = join(TEMP_DIR, `${baseFilename}.pdf`);
    
    // Write LaTeX content to file
    await writeFile(texFile, latexContent);
    
    // Run pdflatex
    await execAsync(`pdflatex -output-directory=${TEMP_DIR} ${texFile}`);
    
    // Read the generated PDF
    const pdfContent = await fetch(`file://${pdfFile}`).then(res => res.arrayBuffer());
    
    // Return PDF content
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"'
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 