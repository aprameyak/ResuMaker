'use client';

import React, { useState } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumeTemplate from './components/ResumeTemplate';
import { FormData } from '@/app/types';

export default function Home() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Create Your Professional Resume
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Build a standout resume in minutes with our intuitive builder
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          {!resumeData ? (
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Enter Your Details
                </h2>
                <p className="text-sm text-gray-600">
                  Fill in the form below to generate your professional resume
                </p>
              </div>
              <ResumeForm onSubmit={(data) => {
                setResumeData(data);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            </div>
          ) : (
            <div className="w-full">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {isEditing ? 'Edit Your Resume' : 'Your Professional Resume'}
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      {isEditing ? 'Save Changes' : 'Edit Resume'}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setResumeData(null);
                          setIsEditing(false);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        Create New Resume
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
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
              </div>
              {!isEditing && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} ResuMaker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
