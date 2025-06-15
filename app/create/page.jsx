'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ResumeEditor from '../components/ResumeEditor';
import ResumeTemplates from '../components/ResumeTemplates';
import { SECTION_TYPES } from '../constants';
import { FiHelpCircle } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default function CreatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showTemplates, setShowTemplates] = useState(true);
  const [sections, setSections] = useState([
    {
      id: '1',
      type: SECTION_TYPES.SUMMARY,
      title: 'Professional Summary',
      content: ''
    }
  ]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handleSelectTemplate = (templateSections) => {
    setSections(templateSections);
    setShowTemplates(false);
  };

  const handleUpdate = (section, content) => {
    setSections(sections.map(s => 
      s.id === section.id ? { ...s, content } : s
    ));
  };

  const handleAdd = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      content: ''
    };
    setSections([...sections, newSection]);
  };

  const handleDelete = (section) => {
    setSections(sections.filter(s => s.id !== section.id));
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Create Your Resume</h1>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiHelpCircle className="mr-1" /> Help
          </button>
        </div>

        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Tips for a Great Resume</h3>
            <ul className="list-disc pl-5 text-blue-700 text-sm space-y-1">
              <li>Keep your resume concise and relevant - one to two pages maximum</li>
              <li>Quantify achievements with numbers when possible (e.g., "Increased sales by 25%")</li>
              <li>Tailor your resume for each job application by matching keywords from the job description</li>
              <li>Use action verbs to describe your responsibilities and achievements</li>
              <li>Proofread carefully for spelling and grammar errors</li>
            </ul>
          </div>
        )}

        {showTemplates ? (
          <ResumeTemplates onSelectTemplate={handleSelectTemplate} />
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Build your resume by adding or editing sections below. You can preview and export when ready.
            </p>
            <ResumeEditor 
              sections={sections}
              onUpdate={handleUpdate}
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 text-blue-600 hover:underline mr-4"
              >
                Back to Templates
              </button>
              <button
                onClick={() => router.push('/preview')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Preview & Export
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 