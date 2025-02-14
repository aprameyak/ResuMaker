'use client';

import React, { useState } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumeTemplate from './components/ResumeTemplate';
import { FormData } from '@/app/types';

export default function Home() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="app-container">
      <header className="header">
        <h1>Create Your Professional Resume</h1>
        <p>Build a standout resume in minutes</p>
      </header>

      <div className="main-content">
        {!resumeData ? (
          <div className="form-container">
            <ResumeForm onSubmit={setResumeData} />
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-actions">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="button"
              >
                {isEditing ? 'Save Changes' : 'Edit Resume'}
              </button>
            </div>
            <ResumeTemplate 
              data={resumeData} 
              isEditable={isEditing}
              onEdit={setResumeData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
