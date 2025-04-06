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
      background: 'linear-gradient(to bottom right, #f0f4f8, #ffffff)',
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`,
      color: '#1f2937',
    },
    header: {
      padding: '3rem 1rem',
      background: '#ffffff',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    },
    headerContent: {
      maxWidth: '960px',
      margin: '0 auto',
      textAlign: 'center' as const,
    },
    title: {
      fontSize: '2.75rem',
      fontWeight: 700,
      color: '#111827',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#6b7280',
    },
    main: {
      maxWidth: '960px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      flex: '1',
    },
    formContainer: {
      background: '#ffffff',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
      maxWidth: '720px',
      margin: '0 auto',
    },
    formHeader: {
      marginBottom: '1.75rem',
    },
    formTitle: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1f2937',
      marginBottom: '0.5rem',
    },
    formSubtitle: {
      color: '#4b5563',
      fontSize: '1rem',
    },
    resumeContainer: {
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    },
    resumeHeader: {
      padding: '1rem 1.5rem',
      background: '#f3f4f6',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resumeTitle: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#111827',
    },
    buttonContainer: {
      display: 'flex',
      gap: '0.75rem',
      marginLeft: '1rem', 
    },
    primaryButton: {
      padding: '0.5rem 1rem',
      background: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.2s ease-in-out',
    },
    secondaryButton: {
      padding: '0.5rem 1rem',
      background: '#ffffff',
      color: '#1f2937',
      border: '1px solid #d1d5db',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: '#10b981',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
      margin: '2rem auto',
      transition: 'background 0.3s ease-in-out',
    },
    resumeContent: {
      padding: '2rem',
    },
    footer: {
      padding: '2rem 0',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '0.875rem',
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
                  aria-label={isEditing ? 'Save changes' : 'Edit resume'}
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
                    aria-label="Create new resume"
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
                aria-label="Download resume as PDF"
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
