'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiTarget, FiUpload, FiEdit3 } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default function TailorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resume.trim()) {
      alert('Please provide both job description and resume content');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/analyze-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          resume,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze');
      }

      const data = await response.json();
      setTailoredResume(data.tailoredResume);
      setStep(3);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Tailor Your Resume</h1>
        
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2">Job Description</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2">Resume Content</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2">Tailored Resume</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <FiTarget className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold">Step 1: Job Description</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Paste the job description you want to tailor your resume for:
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!jobDescription.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md transition-colors"
              >
                Next: Add Resume
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <FiEdit3 className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold">Step 2: Your Resume</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Paste your current resume content or upload a file:
            </p>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume content here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!resume.trim() || loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md transition-colors"
              >
                {loading ? 'Analyzing...' : 'Tailor Resume'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <FiTarget className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-2xl font-bold text-green-600">Tailored Resume</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Your resume has been tailored for the job description:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <pre className="whitespace-pre-wrap text-sm">{tailoredResume}</pre>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md transition-colors"
              >
                Back to Edit
              </button>
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
                >
                  Edit Further
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tailoredResume);
                    alert('Resume copied to clipboard!');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors"
                >
                  Copy Resume
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 