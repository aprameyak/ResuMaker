'use client';

import React, { useState, useCallback } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumeTemplate from './components/ResumeTemplate';
import { FormData } from '@/app/types';

interface Styles {
  [key: string]: React.CSSProperties | string | number;
}

export default function Home() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = useCallback(async (data: FormData) => {
    setIsLoading(true);
    try {
      setResumeData(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const styles: Styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    header: {
      padding: '2.5rem 0',
      background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 1,
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      textAlign: 'center',
    },
    title: {
      fontSize: '2.8rem',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '0.75rem',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#e0e6ed',
      fontWeight: '400',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6',
    },
    main: {
      maxWidth: '1200px',
      margin: '2.5rem auto',
      padding: '0 2rem',
      flex: '1',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 2,
    },
    formContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '2.5rem',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
      maxWidth: '800px',
      margin: '0 auto',
    },
    formHeader: {
      marginBottom: '2rem',
      textAlign: 'center',
    },
    formTitle: {
      fontSize: '1.8rem',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '0.75rem',
    },
    formSubtitle: {
      color: '#5a6c7d',
      fontSize: '1.1rem',
      lineHeight: '1.5',
    },
    resumeContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
    },
    resumeHeader: {
      padding: '1.25rem 1.75rem',
      background: '#f8fafc',
      borderBottom: '1px solid #e0e6ed',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resumeTitle: {
      fontSize: '1.4rem',
      fontWeight: '600',
      color: '#2c3e50',
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
    },
    primaryButton: {
      padding: '0.75rem 1.5rem',
      background: '#3498db',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    secondaryButton: {
      padding: '0.75rem 1.5rem',
      background: '#ffffff',
      color: '#2c3e50',
      border: '1px solid #e0e6ed',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1.75rem',
      background: '#2ecc71',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      margin: '1.75rem auto',
      transition: 'all 0.2s ease',
    },
    resumeContent: {
      padding: '2.5rem',
    },
    footer: {
      padding: '1.75rem 0',
      borderTop: '1px solid #e0e6ed',
      textAlign: 'center',
      color: '#5a6c7d',
      background: '#ffffff',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Create Your Professional Resume</h1>
          <p style={styles.subtitle}>
            Build a standout resume in minutes with our intuitive builder
          </p>
        </div>
      </header>

      <main style={styles.main}>
        {!resumeData ? (
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Enter Your Details</h2>
              <p style={styles.formSubtitle}>
                Fill in the form below to generate your professional resume
              </p>
            </div>
            <ResumeForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              styles={styles}
            />
          </div>
        ) : (
          <div style={styles.resumeContainer}>
            <div style={styles.resumeHeader}>
              <h2 style={styles.resumeTitle}>
                {isEditing ? 'Edit Your Resume' : 'Your Professional Resume'}
              </h2>
              <div style={styles.buttonContainer}>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={styles.primaryButton}
                >
                  {isEditing ? 'Save Changes' : 'Edit Resume'}
                </button>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setResumeData(null);
                      setIsEditing(false);
                    }}
                    style={styles.secondaryButton}
                  >
                    Create New Resume
                  </button>
                )}
              </div>
            </div>
            <div style={styles.resumeContent}>
              <ResumeTemplate
                data={resumeData}
                isEditable={isEditing}
                onEdit={(newData) => {
                  setResumeData(newData);
                  if (isEditing) {
                    setIsEditing(false);
                  }
                }}
              />
            </div>
            {!isEditing && (
              <button
                onClick={() => window.print()}
                style={styles.downloadButton}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button>
            )}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} ResuMaker. All rights reserved.</p>
      </footer>
    </div>
  );
}
