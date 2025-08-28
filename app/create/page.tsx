'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ResumeEditor from '../components/ResumeEditor';
import ResumeTemplates from '../components/ResumeTemplates';
import { SECTION_TYPES, SectionType } from '../constants';
import { FiHelpCircle, FiArrowLeft, FiEye } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
}

export default function CreatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showTemplates, setShowTemplates] = useState<boolean>(true);
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      type: SECTION_TYPES.SUMMARY,
      title: 'Professional Summary',
      content: ''
    }
  ]);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handleSelectTemplate = (templateSections: Section[]) => {
    setSections(templateSections);
    setShowTemplates(false);
  };

  const handleUpdate = (section: Section, content: string) => {
    setSections(sections.map(s => 
      s.id === section.id ? { ...s, content } : s
    ));
  };

  const handleAdd = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      content: ''
    };
    setSections([...sections, newSection]);
  };

  const handleDelete = (section: Section) => {
    setSections(sections.filter(s => s.id !== section.id));
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Create Your Resume
          </h1>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <FiHelpCircle style={{ marginRight: '8px', width: '20px', height: '20px' }} />
            Help
          </button>
        </div>

        {showHelp && (
          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e40af',
              marginBottom: '16px'
            }}>
              Tips for a Great Resume
            </h3>
            <ul style={{
              listStyle: 'disc',
              paddingLeft: '24px',
              color: '#1e40af',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              <li style={{ marginBottom: '8px' }}>Keep your resume concise and relevant - one to two pages maximum</li>
              <li style={{ marginBottom: '8px' }}>Quantify achievements with numbers when possible (e.g., "Increased sales by 25%")</li>
              <li style={{ marginBottom: '8px' }}>Tailor your resume for each job application by matching keywords from the job description</li>
              <li style={{ marginBottom: '8px' }}>Use action verbs to describe your responsibilities and achievements</li>
              <li>Proofread carefully for spelling and grammar errors</li>
            </ul>
          </div>
        )}

        {showTemplates ? (
          <ResumeTemplates onSelectTemplate={handleSelectTemplate} />
        ) : (
          <>
            <p style={{
              fontSize: '20px',
              color: '#4b5563',
              marginBottom: '32px',
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto 32px auto'
            }}>
              Build your resume by adding or editing sections below. You can preview and export when ready.
            </p>
            <ResumeEditor 
              sections={sections}
              onUpdate={handleUpdate}
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
            <div style={{
              marginTop: '48px',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowTemplates(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#2563eb',
                  backgroundColor: 'transparent',
                  border: '1px solid #2563eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FiArrowLeft style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                Back to Templates
              </button>
              <button
                onClick={() => router.push('/preview')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#16a34a',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <FiEye style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                Preview & Export
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
