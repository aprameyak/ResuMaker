'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FiUpload, FiTarget, FiDownload, FiArrowRight } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default function TailorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [resume, setResume] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [tailoredResume, setTailoredResume] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
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
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume,
          jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to tailor resume');
      }

      const data = await response.json();
      setTailoredResume(data.tailoredResume);
    } catch (error) {
      setError('Failed to tailor resume. Please try again.');
      console.error('Tailoring error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)',
      padding: '80px 16px 64px 16px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#dbeafe',
              borderRadius: '50%'
            }}>
              <FiTarget style={{ width: '48px', height: '48px', color: '#2563eb' }} />
            </div>
          </div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Tailor Your Resume
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#4b5563',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Optimize your resume for specific job opportunities. Our AI will analyze the job description 
            and suggest improvements to better match the requirements.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '32px',
          marginBottom: '48px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <FiUpload style={{ width: '32px', height: '32px', color: '#2563eb', marginRight: '12px' }} />
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Your Resume
              </h2>
            </div>
            <textarea
              value={resume}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setResume(e.target.value)}
              placeholder="Paste your current resume content here..."
              style={{
                width: '100%',
                height: '300px',
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'none',
                fontSize: '16px',
                lineHeight: '1.5',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <FiTarget style={{ width: '32px', height: '32px', color: '#16a34a', marginRight: '12px' }} />
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Job Description
              </h2>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
              placeholder="Paste the job description you're applying for..."
              style={{
                width: '100%',
                height: '300px',
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'none',
                fontSize: '16px',
                lineHeight: '1.5',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <button
            onClick={handleTailor}
            disabled={isProcessing || !resume.trim() || !jobDescription.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 40px',
              fontSize: '20px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: isProcessing || !resume.trim() || !jobDescription.trim() ? '#9ca3af' : '#2563eb',
              border: '1px solid transparent',
              borderRadius: '12px',
              cursor: isProcessing || !resume.trim() || !jobDescription.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isProcessing ? (
              <>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #ffffff40',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '12px'
                }}></div>
                Processing...
              </>
            ) : (
              <>
                <FiTarget style={{ marginRight: '12px', width: '24px', height: '24px' }} />
                Tailor Resume
              </>
            )}
          </button>
        </div>

        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 48px auto',
            padding: '20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px'
          }}>
            <p style={{ color: '#dc2626', textAlign: 'center', fontSize: '16px' }}>{error}</p>
          </div>
        )}

        {tailoredResume && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#16a34a'
              }}>
                Tailored Resume
              </h2>
              <button
                onClick={handleDownload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#16a34a',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <FiDownload style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                Download
              </button>
            </div>
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '24px',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb'
            }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#374151',
                margin: 0,
                fontFamily: 'inherit'
              }}>
                {tailoredResume}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
