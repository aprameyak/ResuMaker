'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FiUpload, FiFile, FiX, FiArrowRight, FiCheck } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

interface ParsedData {
  // Add specific properties based on your API response
  [key: string]: any;
}

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
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const data = await response.json();
      setParsedData(data);
    } catch (error) {
      setError('Failed to parse resume. Please try again.');
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
        maxWidth: '768px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#dbeafe',
              borderRadius: '50%'
            }}>
              <FiUpload style={{ width: '48px', height: '48px', color: '#2563eb' }} />
            </div>
          </div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Upload Your Resume
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#4b5563',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Upload your existing resume to enhance it with AI-powered suggestions and professional formatting.
          </p>
        </div>
        
        {!parsedData ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            padding: '48px'
          }}>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center'
            }}>
              {!file ? (
                <>
                  <FiUpload style={{ 
                    width: '64px', 
                    height: '64px', 
                    color: '#9ca3af', 
                    margin: '0 auto 24px auto',
                    display: 'block'
                  }} />
                  <p style={{
                    fontSize: '20px',
                    color: '#4b5563',
                    marginBottom: '16px'
                  }}>
                    Upload your existing resume to enhance it with AI
                  </p>
                  <p style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    marginBottom: '32px'
                  }}>
                    Supported format: PDF
                  </p>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#2563eb',
                    border: '1px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}>
                    Choose File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
                  }}>
                    <FiFile style={{ width: '32px', height: '32px', color: '#2563eb' }} />
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>{file.name}</span>
                    <button
                      onClick={removeFile}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '8px'
                      }}
                    >
                      <FiX style={{ width: '24px', height: '24px' }} />
                    </button>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px 32px',
                      fontSize: '18px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: uploading ? '#9ca3af' : '#16a34a',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {uploading ? 'Processing...' : 'Parse Resume'}
                  </button>
                </div>
              )}
            </div>
            
            {error && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#dc2626' }}>{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            padding: '48px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                backgroundColor: '#dcfce7',
                borderRadius: '50%',
                marginBottom: '16px'
              }}>
                <FiCheck style={{ width: '32px', height: '32px', color: '#16a34a' }} />
              </div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#16a34a',
                marginBottom: '16px'
              }}>
                Resume Parsed Successfully!
              </h2>
              <p style={{
                fontSize: '18px',
                color: '#4b5563',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Your resume has been analyzed and the content has been extracted. 
                You can now edit and enhance it using our AI-powered tools.
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Extracted Information:
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {['Contact information', 'Work experience', 'Education', 'Skills', 'Additional sections'].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#2563eb',
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ color: '#4b5563' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleContinueEditing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#2563eb',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Continue Editing
                <FiArrowRight style={{ marginLeft: '8px', width: '20px', height: '20px' }} />
              </button>
              <button
                onClick={removeFile}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Upload Different Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
