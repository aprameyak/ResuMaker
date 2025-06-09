'use client';

import React, { useEffect, useState } from 'react';
import { FiUser, FiBook, FiBriefcase, FiAward, FiTool } from 'react-icons/fi';
import { FormData } from '@/app/types';
import ResumeForm from '../components/ResumeForm';
import ResumeTemplate from '../components/ResumeTemplate';

export default function CreatePage() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check for parsed resume data in localStorage
    const parsedData = localStorage.getItem('parsedResumeData');
    if (parsedData) {
      try {
        const data = JSON.parse(parsedData);
        setResumeData(data);
        setIsEditing(true);
        // Clear the data from localStorage
        localStorage.removeItem('parsedResumeData');
      } catch (error) {
        console.error('Error parsing resume data:', error);
      }
    }
  }, []);

  const handleFormSubmit = (data: FormData) => {
    setResumeData(data);
    setIsEditing(false);
  };

  if (isEditing || resumeData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-6xl mx-auto">
          {isEditing ? (
            <ResumeForm onSubmit={handleFormSubmit} initialData={resumeData} />
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Edit Resume
                </button>
              </div>
              <ResumeTemplate data={resumeData!} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="section container-narrow">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Create Your Resume</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Build your professional resume step by step with our intuitive editor and AI-powered suggestions.
          </p>
        </div>

        <div className="space-y-6">
          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiUser className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                <p className="text-gray-600">Your contact details and basic information</p>
              </div>
            </div>
            <button 
              className="btn-primary w-full"
              onClick={() => setIsEditing(true)}
            >
              Start with Personal Info
            </button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiBook className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                <p className="text-gray-600">Your academic background and achievements</p>
              </div>
            </div>
            <button 
              className="btn-secondary w-full"
              onClick={() => setIsEditing(true)}
            >
              Add Education
            </button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                <p className="text-gray-600">Your professional experience and accomplishments</p>
              </div>
            </div>
            <button 
              className="btn-secondary w-full"
              onClick={() => setIsEditing(true)}
            >
              Add Experience
            </button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiAward className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                <p className="text-gray-600">Highlight your key projects and achievements</p>
              </div>
            </div>
            <button 
              className="btn-secondary w-full"
              onClick={() => setIsEditing(true)}
            >
              Add Projects
            </button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiTool className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                <p className="text-gray-600">Technical, soft skills, and certifications</p>
              </div>
            </div>
            <button 
              className="btn-secondary w-full"
              onClick={() => setIsEditing(true)}
            >
              Add Skills
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 