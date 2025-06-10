'use client';

import { useState } from 'react';
import { FiBriefcase, FiFileText, FiCode, FiAward, FiStar } from 'react-icons/fi';

const TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    icon: <FiBriefcase className="w-8 h-8 mb-2" />,
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
    icon: <FiCode className="w-8 h-8 mb-2" />,
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
    icon: <FiAward className="w-8 h-8 mb-2" />,
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
    icon: <FiStar className="w-8 h-8 mb-2" />,
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
    icon: <FiFileText className="w-8 h-8 mb-2" />,
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

export default function ResumeTemplates({ onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template.sections);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-6">Choose a Template</h2>
      <p className="text-gray-600 mb-6">
        Select a template to get started quickly. You can customize all sections later.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectTemplate(template)}
          >
            <div className="flex flex-col items-center text-center">
              {template.icon}
              <h3 className="text-lg font-medium mb-2">{template.name}</h3>
              <p className="text-sm text-gray-500">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => handleSelectTemplate(TEMPLATES[0])}
          className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 mr-4"
        >
          Skip Template
        </button>
        <button
          disabled={!selectedTemplate}
          onClick={() => handleSelectTemplate(TEMPLATES.find(t => t.id === selectedTemplate))}
          className={`px-4 py-2 rounded-md text-white ${
            selectedTemplate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Use Template
        </button>
      </div>
    </div>
  );
} 