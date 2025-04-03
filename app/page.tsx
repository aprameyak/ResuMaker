'use client';

import React, { useState } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumeTemplate from './components/ResumeTemplate';
import { FormData } from '@/app/types';

export default function Home() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #ffffff, #f7f7f7)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      padding: '2rem 0',
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      textAlign: 'center' as const,
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '1.1rem',
      color: '#666666',
    },
    main: {
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: '0 2rem',
      flex: '1',
    },
    formContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      maxWidth: '800px',
      margin: '0 auto',
    },
    formHeader: {
      marginBottom: '1.5rem',
    },
    formTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
    },
    formSubtitle: {
      color: '#666666',
      fontSize: '1rem',
    },
    resumeContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    },
    resumeHeader: {
      padding: '1rem 1.5rem',
      background: '#f8f9fa',
      borderBottom: '1px solid #eaeaea',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resumeTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1a1a1a',
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
    },
    primaryButton: {
      padding: '0.5rem 1rem',
      background: '#0066ff',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
      ':hover': {
        background: '#0052cc',
      },
    },
    secondaryButton: {
      padding: '0.5rem 1rem',
      background: '#ffffff',
      color: '#1a1a1a',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: '#10b981',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      margin: '1.5rem auto',
      transition: 'background 0.2s ease',
    },
    resumeContent: {
      padding: '2rem',
    },
    footer: {
      padding: '1.5rem 0',
      borderTop: '1px solid #eaeaea',
      textAlign: 'center' as const,
      color: '#666666',
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
              onSubmit={(data) => {
                setResumeData(data);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
