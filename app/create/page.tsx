'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ResumeEditor from '../components/ResumeEditor';
import ResumeTemplates from '../components/ResumeTemplates';
import { SECTION_TYPES, SectionType } from '../constants';
import { toEditorSections } from '../../lib/resume';
import type { ParsedResume, ResumeHeader } from '../../lib/resume';
import ResumePreview from '../components/ResumePreview';
import PrintRoot from '../components/PrintRoot';
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
  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('resumaker:imported');
      if (!saved) return;
      sessionStorage.removeItem('resumaker:imported');
      const payload = JSON.parse(saved) as { parsed: ParsedResume; header?: ResumeHeader };
      const imported = toEditorSections(payload.parsed, payload.header);
      if (imported.length) {
        setSections(imported);
        setShowTemplates(false);
      }
    } catch (error) {
      console.error('Could not load imported resume:', error);
    }
  }, []);

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
      <div className="container page-section">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container page-section">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <h1>Create your resume</h1>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="btn-secondary"
          aria-expanded={showHelp}
          style={{ minHeight: '40px', padding: '6px 14px' }}
        >
          <FiHelpCircle aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          Help
        </button>
      </div>

      {showHelp && (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>Tips for a clear resume</h2>
          <ul className="secondary" style={{ paddingLeft: '20px', lineHeight: 1.6 }}>
            <li>Keep it to one or two pages.</li>
            <li>Quantify results where you can (for example, "reduced load time by 30%").</li>
            <li>Match the wording of the job posting where it is true for you.</li>
            <li>Start bullet points with action verbs.</li>
            <li>Proofread for spelling and grammar.</li>
          </ul>
        </div>
      )}

      {showTemplates ? (
        <ResumeTemplates onSelectTemplate={handleSelectTemplate} />
      ) : (
        <>
          <p className="secondary" style={{ marginBottom: '24px' }}>
            Edit each section below as plain text, add sections as needed, then preview and export.
          </p>
          <ResumeEditor
            sections={sections}
            onUpdate={handleUpdate}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button onClick={() => setShowTemplates(true)} className="btn-secondary">
              <FiArrowLeft aria-hidden="true" style={{ width: '18px', height: '18px' }} />
              Back to Templates
            </button>
            <button onClick={() => setShowPreview(true)} className="btn">
              <FiEye aria-hidden="true" style={{ width: '18px', height: '18px' }} />
              Preview & Export
            </button>
          </div>
        </>
      )}
      {showPreview && (
        <div style={{ marginTop: '32px' }}>
          <div className="no-print" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button onClick={() => window.print()} className="btn">
              Save as PDF
            </button>
            <button onClick={() => setShowPreview(false)} className="btn-secondary">
              Close preview
            </button>
          </div>
          <ResumePreview sections={sections} />
          <PrintRoot>
            <pre>{sections.map(s => `${s.title.toUpperCase()}\n${s.content}`).join('\n\n')}</pre>
          </PrintRoot>
        </div>
      )}
    </div>
  );
}
