'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import PrintRoot from '../components/PrintRoot';
import { analyzeJobDescription, matchKeywords, optimizeResume } from '../../lib/resume';
import type { OptimizationResult } from '../../lib/resume';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default function TailorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [resume, setResume] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [tailoredResume, setTailoredResume] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [report, setReport] = useState<{ before: number; after: number; result: OptimizationResult } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handleTailor = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError('Please provide both your resume content and the job description.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const keywords = analyzeJobDescription(jobDescription);
      const before = matchKeywords(resume, keywords).coverage;
      const result = optimizeResume(resume, keywords);
      const after = matchKeywords(result.optimized, keywords).coverage;
      setTailoredResume(result.optimized);
      setReport({ before, after, result });
    } catch (error) {
      setError('Failed to tailor resume. Please try again.');
      console.error('Tailoring error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([tailoredResume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'tailored-resume.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

  const canTailor = !isProcessing && resume.trim() && jobDescription.trim();

  return (
    <div className="container page-section">
      <h1 style={{ marginBottom: '8px' }}>Tailor your resume</h1>
      <p className="secondary" style={{ marginBottom: '24px', maxWidth: '720px' }}>
        Paste your resume and a job posting. The page lists which keywords from the posting your resume
        already contains and which it does not, using fixed rules. It only rewords text you already wrote
        and never adds new claims.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <div>
          <label htmlFor="resume-text" className="label">Your resume</label>
          <textarea
            id="resume-text"
            className="input"
            value={resume}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setResume(e.target.value)}
            placeholder="Paste your current resume content here..."
            style={{ height: '300px' }}
          />
        </div>

        <div>
          <label htmlFor="job-text" className="label">Job description</label>
          <textarea
            id="job-text"
            className="input"
            value={jobDescription}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
            placeholder="Paste the job description you're applying for..."
            style={{ height: '300px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <button onClick={handleTailor} disabled={!canTailor} className="btn">
          {isProcessing ? 'Processing...' : 'Tailor Resume'}
        </button>
      </div>

      {error && (
        <div className="notice notice-error" role="alert" style={{ marginBottom: '32px' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {tailoredResume && <PrintRoot><pre>{tailoredResume}</pre></PrintRoot>}
      {tailoredResume && (
        <div className="no-print card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <h2>Tailored Resume</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={handleDownload} className="btn">
                Download .txt
              </button>
              <button onClick={handlePrint} className="btn-secondary">
                Save as PDF
              </button>
            </div>
          </div>
          {report && (
            <div className="no-print" style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--text)', lineHeight: 1.6 }}>
              <p>
                Keyword match: <strong>{report.before}%</strong> before, <strong>{report.after}%</strong> after.
                Only wording you already had was changed; nothing was added.
              </p>
              {report.result.matched.length > 0 && (
                <p><strong style={{ color: 'var(--success)' }}>Found in your resume:</strong> {report.result.matched.join(', ')}</p>
              )}
              {report.result.missing.length > 0 && (
                <p><strong style={{ color: 'var(--error)' }}>Not in your resume:</strong> {report.result.missing.join(', ')}. Add these only if they are true for you.</p>
              )}
              {report.result.changes.length > 0 && (
                <ul style={{ margin: '8px 0 0 20px' }}>
                  {Array.from(new Set(report.result.changes.map(c => c.explanation))).map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="panel" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--text)',
              margin: 0,
              fontFamily: 'inherit'
            }}>
              {tailoredResume}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
