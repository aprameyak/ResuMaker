'use client';

import { useState } from 'react';
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
      <h2 style={{ marginBottom: '8px' }}>Choose a Template</h2>
      <p className="secondary" style={{ marginBottom: '24px' }}>
        Pick a starting structure. You can rename, edit, add and remove sections afterwards.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {TEMPLATES.map((template) => {
          const selected = selectedTemplate === template.id;
          return (
            <div
              key={template.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: selected ? 'var(--accent)' : 'var(--border)',
                outlineOffset: '2px',
                boxShadow: selected ? 'inset 0 0 0 1px var(--accent)' : 'none',
                backgroundColor: selected ? 'var(--panel)' : 'var(--bg)'
              }}
              onClick={() => handleSelectTemplate(template)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectTemplate(template);
                }
              }}
            >
              <h3 style={{ marginBottom: '4px' }}>{template.name}</h3>
              <p className="secondary" style={{ fontSize: '15px' }}>{template.description}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          disabled={!selectedTemplate}
          onClick={() => {
            const template = TEMPLATES.find(t => t.id === selectedTemplate);
            if (template) {
              handleSelectTemplate(template);
            }
          }}
          className="btn"
        >
          Use Template
        </button>
        <button onClick={() => handleSelectTemplate(TEMPLATES[0])} className="btn-secondary">
          Skip Template
        </button>
      </div>
    </div>
  );
}
