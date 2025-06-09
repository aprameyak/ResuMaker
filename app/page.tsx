'use client';

import React, { useState } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumeTemplate from './components/ResumeTemplate';
import { FormData } from '@/app/types';
import Link from 'next/link';
import { FiUpload, FiEdit, FiTarget } from 'react-icons/fi';

export default function Home() {
  const [resumeData, setResumeData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f0f4f8, #ffffff)',
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`,
      color: '#1f2937',
    },
    header: {
      padding: '3rem 1rem',
      background: '#ffffff',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    },
    headerContent: {
      maxWidth: '960px',
      margin: '0 auto',
      textAlign: 'center' as const,
    },
    title: {
      fontSize: '2.75rem',
      fontWeight: 700,
      color: '#111827',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#6b7280',
    },
    main: {
      maxWidth: '960px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      flex: '1',
    },
    formContainer: {
      background: '#ffffff',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
      maxWidth: '720px',
      margin: '0 auto',
    },
    formHeader: {
      marginBottom: '1.75rem',
    },
    formTitle: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1f2937',
      marginBottom: '0.5rem',
    },
    formSubtitle: {
      color: '#4b5563',
      fontSize: '1rem',
    },
    resumeContainer: {
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    },
    resumeHeader: {
      padding: '1rem 1.5rem',
      background: '#f3f4f6',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resumeTitle: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#111827',
    },
    buttonContainer: {
      display: 'flex',
      gap: '0.75rem',
      marginLeft: '1rem', 
    },
    primaryButton: {
      padding: '0.5rem 1rem',
      background: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.2s ease-in-out',
    },
    secondaryButton: {
      padding: '0.5rem 1rem',
      background: '#ffffff',
      color: '#1f2937',
      border: '1px solid #d1d5db',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
    },
    downloadButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: '#10b981',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
      margin: '2rem auto',
      transition: 'background 0.3s ease-in-out',
    },
    resumeContent: {
      padding: '2rem',
    },
    footer: {
      padding: '2rem 0',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '0.875rem',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="py-16 px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Create Your Perfect Resume
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Professional resumes made simple. AI-powered guidance helps you create, customize, 
          and optimize your resume for your dream job.
        </p>
      </header>

      {/* Main Options Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Upload Existing Resume */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiUpload className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Upload Existing Resume
              </h2>
              <p className="text-gray-600">
                Import your current resume and let our AI enhance it with professional formatting and suggestions.
              </p>
            </div>
            <Link 
              href="/upload"
              className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Resume
            </Link>
          </div>

          {/* Start Fresh */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiEdit className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Start From Scratch
              </h2>
              <p className="text-gray-600">
                Create a new resume with step-by-step guidance and industry-specific templates.
              </p>
            </div>
            <Link 
              href="/create"
              className="block w-full py-3 px-4 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
            >
              Create New Resume
            </Link>
          </div>

          {/* Tailor for Job */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiTarget className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Tailor for Job
              </h2>
              <p className="text-gray-600">
                Optimize your resume for specific job postings with AI-powered customization.
              </p>
            </div>
            <Link 
              href="/tailor"
              className="block w-full py-3 px-4 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tailor Resume
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose ResuMaker?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-gray-600">Get intelligent suggestions to improve your resume's impact</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Professional Templates</h3>
              <p className="text-gray-600">Industry-tested templates that stand out to recruiters</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Easy Customization</h3>
              <p className="text-gray-600">Tailor your resume for different jobs effortlessly</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">ATS-Friendly</h3>
              <p className="text-gray-600">Ensure your resume gets past applicant tracking systems</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Create Your Professional Resume?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of job seekers who've found success with ResuMaker
          </p>
          <Link 
            href="/create"
            className="inline-block py-4 px-8 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Now
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} ResuMaker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
