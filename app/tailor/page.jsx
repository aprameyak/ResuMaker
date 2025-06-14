'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default function TailorPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const sessionData = await getSession();
      if (!sessionData) {
        router.push('/auth/signin');
        return;
      }
      setSession(sessionData);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/analyze-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      router.push('/create');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze job description. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Tailor Your Resume</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="job-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Paste Job Description
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-64 p-4 border rounded-md resize-none"
              placeholder="Paste the job description here..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={!jobDescription.trim() || isProcessing}
            className={`w-full py-2 px-4 rounded-md text-white ${
              !jobDescription.trim() || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Analyzing...' : 'Analyze & Tailor Resume'}
          </button>
        </form>
      </div>
    </div>
  );
} 