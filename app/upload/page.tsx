'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { extractFileText } from '../../lib/resume/extract';
import { parseResume, parseHeader } from '../../lib/resume';
import type { ParsedResume } from '../../lib/resume';
import { FiFile, FiX, FiArrowRight } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

type ParsedData = ParsedResume;

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (/\.(pdf|docx|txt)$/i.test(selectedFile.name)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a PDF, DOCX or TXT file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const text = await extractFileText(file);
      if (!text) throw new Error(/\.pdf$/i.test(file.name) ? 'No text found. Scanned or image-only PDFs cannot be read.' : 'No text found in this file.');
      const parsed = parseResume(text);
      sessionStorage.setItem('resumaker:imported', JSON.stringify({ parsed, header: parseHeader(text) }));
      setParsedData(parsed);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read resume. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleContinueEditing = () => {
    router.push('/create');
  };

  const removeFile = () => {
    setFile(null);
    setParsedData(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="container page-section">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container page-section" style={{ maxWidth: '720px' }}>
      <h1 style={{ marginBottom: '8px' }}>Import a resume</h1>
      <p className="secondary" style={{ marginBottom: '24px' }}>
        Choose a PDF, DOCX or TXT file. The text is read in your browser and the file is not uploaded.
      </p>

      {!parsedData ? (
        <div className="card">
          {!file ? (
            <>
              <p className="label" style={{ marginBottom: '8px' }}>Resume file</p>
              <p className="muted" style={{ fontSize: '15px', marginBottom: '16px' }}>
                Supported formats: PDF, DOCX, TXT. Scanned or image-only PDFs cannot be read.
              </p>
              <label className="btn" style={{ cursor: 'pointer' }}>
                Choose File
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
                />
              </label>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <FiFile aria-hidden="true" style={{ width: '20px', height: '20px', flexShrink: 0, color: 'var(--text-secondary)' }} />
                <span style={{ fontWeight: 600, overflowWrap: 'anywhere', flexGrow: 1 }}>{file.name}</span>
                <button onClick={removeFile} className="btn-icon" aria-label="Remove file">
                  <FiX style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
              <div>
                <button onClick={handleUpload} disabled={uploading} className="btn">
                  {uploading ? 'Processing...' : 'Parse Resume'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="notice notice-error" role="alert" style={{ marginTop: '16px' }}>
              <p style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2 style={{ marginBottom: '8px', color: 'var(--success)' }}>Resume Parsed Successfully</h2>
          <p className="secondary" style={{ marginBottom: '24px' }}>
            The text was split into sections. Review each one in the editor, because automatic splitting can miss or misplace lines.
          </p>

          <div className="panel" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '8px' }}>Sections looked for</h3>
            <ul className="secondary" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
              gap: '4px 16px',
              paddingLeft: '20px'
            }}>
              {['Contact information', 'Work experience', 'Education', 'Skills', 'Additional sections'].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleContinueEditing} className="btn">
              Continue Editing
              <FiArrowRight aria-hidden="true" style={{ width: '18px', height: '18px' }} />
            </button>
            <button onClick={removeFile} className="btn-secondary">
              Upload Different Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
