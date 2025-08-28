'use client';

import { useState } from 'react';
import { FiBriefcase, FiFileText, FiCode, FiAward, FiStar } from 'react-icons/fi';
import { SectionType } from '../constants';

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
}

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  sections: Section[];
}

interface ResumeTemplatesProps {
  onSelectTemplate: (sections: Section[]) => void;
}

const TEMPLATES: Template[] = [
  {
    id: 'professional',
    name: 'Professional',
    icon: <FiBriefcase style={{ width: '32px', height: '32px', marginBottom: '8px' }} />,
    description: 'Traditional format ideal for most industries and career levels',
    sections: [
      { id: 'summary', type: 'summary', title: 'Professional Summary', content: 'Experienced professional with a track record of...' },
      { id: 'experience', type: 'experience', title: 'Work Experience', content: 'Company Name | Role | Date\n• Achievement 1\n• Achievement 2' },
      { id: 'skills', type: 'skills', title: 'Skills', content: '• Skill 1\n• Skill 2\n• Skill 3' },
      { id: 'education', type: 'education', title: 'Education', content: 'Degree, Institution, Year' }
    ]
  },
  {
    id: 'technical',
    name: 'Technical',
    icon: <FiCode style={{ width: '32px', height: '32px', marginBottom: '8px' }} />,
    description: 'Specialized format highlighting technical skills and projects',
    sections: [
      { id: 'summary', type: 'summary', title: 'Technical Profile', content: 'Software engineer with expertise in...' },
      { id: 'skills', type: 'skills', title: 'Technical Skills', content: '• Languages: \n• Frameworks: \n• Tools: ' },
      { id: 'projects', type: 'projects', title: 'Projects', content: 'Project Name | GitHub Link\n• Key feature 1\n• Key feature 2' },
      { id: 'experience', type: 'experience', title: 'Work Experience', content: 'Company Name | Role | Date\n• Technical achievement 1\n• Technical achievement 2' },
      { id: 'education', type: 'education', title: 'Education', content: 'Degree in Computer Science, Institution, Year' }
    ]
  },
  {
    id: 'academic',
    name: 'Academic',
    icon: <FiAward style={{ width: '32px', height: '32px', marginBottom: '8px' }} />,
    description: 'Format for recent graduates or academic positions',
    sections: [
      { id: 'summary', type: 'summary', title: 'Academic Profile', content: 'Recent graduate with focus on...' },
      { id: 'education', type: 'education', title: 'Education', content: 'Degree, Institution, Year, GPA, Relevant Coursework' },
      { id: 'research', type: 'research', title: 'Research Experience', content: 'Research Topic | Institution | Date\n• Research contribution 1\n• Research contribution 2' },
      { id: 'publications', type: 'publications', title: 'Publications', content: 'Authors. (Year). Title. Journal. DOI.' },
      { id: 'skills', type: 'skills', title: 'Skills', content: '• Skill 1\n• Skill 2\n• Skill 3' }
    ]
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    icon: <FiStar style={{ width: '32px', height: '32px', marginBottom: '8px' }} />,
    description: 'Clean, concise format focusing on key achievements',
    sections: [
      { id: 'summary', type: 'summary', title: 'Profile', content: 'Concise statement about your career focus.' },
      { id: 'experience', type: 'experience', title: 'Experience', content: 'Role, Company, Date\nKey achievement' },
      { id: 'education', type: 'education', title: 'Education', content: 'Degree, Institution, Year' },
      { id: 'skills', type: 'skills', title: 'Key Skills', content: 'Skill 1, Skill 2, Skill 3' }
    ]
  },
  {
    id: 'executive',
    name: 'Executive',
    icon: <FiFileText style={{ width: '32px', height: '32px', marginBottom: '8px' }} />,
    description: 'Format for senior leaders highlighting leadership and results',
    sections: [
      { id: 'summary', type: 'summary', title: 'Executive Summary', content: 'Senior leader with proven track record of...' },
      { id: 'highlights', type: 'highlights', title: 'Career Highlights', content: '• Achievement with $X revenue impact\n• Led team of X people\n• Improved X by Y%' },
      { id: 'experience', type: 'experience', title: 'Leadership Experience', content: 'Company Name | Executive Role | Date\n• Strategic initiative 1\n• Strategic initiative 2' },
      { id: 'education', type: 'education', title: 'Education', content: 'MBA, Institution, Year' },
      { id: 'board', type: 'board', title: 'Board Positions', content: 'Organization, Role, Date' }
    ]
  }
];

export default function ResumeTemplates({ onSelectTemplate }: ResumeTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template.sections);
  };

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '24px',
        color: '#111827'
      }}>
        Choose a Template
      </h2>
      <p style={{
        color: '#4b5563',
        marginBottom: '24px',
        fontSize: '16px'
      }}>
        Select a template to get started quickly. You can customize all sections later.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            style={{
              border: selectedTemplate === template.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              backgroundColor: selectedTemplate === template.id ? '#eff6ff' : 'white',
              transition: 'all 0.2s'
            }}
            onClick={() => handleSelectTemplate(template)}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              {template.icon}
              <h3 style={{
                fontSize: '18px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#111827'
              }}>
                {template.name}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {template.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '32px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '16px'
      }}>
        <button
          onClick={() => handleSelectTemplate(TEMPLATES[0])}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            color: '#374151',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Skip Template
        </button>
        <button
          disabled={!selectedTemplate}
          onClick={() => {
            const template = TEMPLATES.find(t => t.id === selectedTemplate);
            if (template) {
              handleSelectTemplate(template);
            }
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: selectedTemplate ? '#2563eb' : '#9ca3af',
            borderRadius: '8px',
            color: 'white',
            border: 'none',
            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Use Template
        </button>
      </div>
    </div>
  );
}
