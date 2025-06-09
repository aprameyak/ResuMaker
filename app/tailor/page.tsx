'use client';

import React, { useState } from 'react';
import { FiTarget, FiUpload, FiEdit } from 'react-icons/fi';

export default function TailorPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="section container-narrow">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Tailor Your Resume</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Optimize your resume for specific job opportunities using our AI-powered analysis.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Job Description Analysis */}
          <div className="card p-6 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="feature-icon">
                <FiTarget className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Job Description Analysis</h2>
                <p className="text-gray-600">Paste the job description to get tailored suggestions</p>
              </div>
            </div>
            <textarea
              className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors"
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <button
              className={`btn-primary w-full mt-4 transition-opacity ${isAnalyzing ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jobDescription}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
          </div>

          {/* Resume Upload/Select */}
          <div className="space-y-6">
            {/* Upload Resume */}
            <div className="card p-6 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="feature-icon">
                  <FiUpload className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Upload Resume</h2>
                  <p className="text-gray-600">Upload an existing resume to tailor</p>
                </div>
              </div>
              <button className="btn-secondary w-full">
                Choose File
              </button>
            </div>

            {/* Select from Saved */}
            <div className="card p-6 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="feature-icon">
                  <FiEdit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Select Saved Resume</h2>
                  <p className="text-gray-600">Choose from your saved resumes</p>
                </div>
              </div>
              <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors">
                <option value="">Select a saved resume...</option>
                <option value="resume1">Software Engineer Resume</option>
                <option value="resume2">Product Manager Resume</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Section - Initially Hidden */}
        <div 
          className={`mt-12 card p-6 transition-all ${showResults ? 'opacity-100' : 'opacity-0 hidden'}`}
        >
          <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Your analysis results will appear here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 