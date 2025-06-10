import { NextResponse } from 'next/server';
import { generateLatexDocument } from '../../utils/latexTemplate';
import { FormData } from '@/app/types';
import { exec } from 'child_process';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TEMP_DIR = '/tmp/resumaker';
const MAX_CONTENT_SIZE = 50 * 1024; // 50KB limit for LaTeX content

export async function POST(request: Request) {
  let texFile: string | null = null;
  let pdfFile: string | null = null;

  try {
    const data: FormData = await request.json();
    
    // Generate LaTeX content
    const latexContent = generateLatexDocument(data);

    // Check content size
    if (latexContent.length > MAX_CONTENT_SIZE) {
      return NextResponse.json(
        { error: 'Resume content is too large' },
        { status: 413 }
      );
    }
    
    // Create temp directory if it doesn't exist
    await mkdir(TEMP_DIR, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const baseFilename = `resume_${timestamp}`;
    texFile = join(TEMP_DIR, `${baseFilename}.tex`);
    pdfFile = join(TEMP_DIR, `${baseFilename}.pdf`);
    
    // Write LaTeX content to file
    await writeFile(texFile, latexContent);
    
    try {
      // Run pdflatex with timeout
      await Promise.race([
        execAsync(`pdflatex -halt-on-error -output-directory=${TEMP_DIR} ${texFile}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timed out')), 30000)
        )
      ]);
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
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
  } finally {
    // Clean up temporary files
    try {
      if (texFile) await unlink(texFile).catch(() => {});
      if (pdfFile) await unlink(pdfFile).catch(() => {});
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }
} 