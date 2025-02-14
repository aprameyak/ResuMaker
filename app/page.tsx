'use client';

import React, { useState } from 'react';
import ResumeForm from '@/app/components/ResumeForm';
import ResumeTemplate from '@/app/components/ResumeTemplate';
import type { FormData } from '@/app/types';

export default function Home() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Builder</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Introduction */}
        {!resumeData && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Create Your Professional Resume
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Let AI help you build a standout resume in minutes
            </p>
          </div>
        )}

        {/* Form or Preview */}
        <div className="mt-8">
          {!resumeData ? (
            <div className="bg-white rounded-lg shadow">
              <ResumeForm onSubmit={setResumeData} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setResumeData(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Resume
                </button>
              </div>
              <div className="bg-white rounded-lg shadow">
                <ResumeTemplate data={resumeData} />
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        {!resumeData && (
          <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Use Our AI Resume Builder?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h4 className="mt-5 text-lg font-medium text-gray-900">Fast & Easy</h4>
                <p className="mt-2 text-base text-gray-500">
                  Create a professional resume in minutes with our intuitive interface
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <h4 className="mt-5 text-lg font-medium text-gray-900">AI-Powered</h4>
                <p className="mt-2 text-base text-gray-500">
                  Smart suggestions and improvements for your resume content
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <h4 className="mt-5 text-lg font-medium text-gray-900">Professional Templates</h4>
                <p className="mt-2 text-base text-gray-500">
                  Clean and modern resume designs that stand out
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} AI Resume Builder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
