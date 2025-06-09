import React from 'react';
import { FiCheck, FiUpload, FiSearch, FiEdit3 } from 'react-icons/fi';
import FileUpload from '../components/FileUpload';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="section container-narrow">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Import Your Resume</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your existing resume and let our AI-powered system transform it into a professional, ATS-friendly format.
          </p>
        </div>

        {/* Upload Section */}
        <div className="card p-8 mb-12">
          <FileUpload />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="feature-card">
            <div className="feature-icon">
              <FiSearch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Parsing
            </h3>
            <p className="text-gray-600">
              Our AI technology accurately extracts and organizes your resume content.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Format Detection
            </h3>
            <p className="text-gray-600">
              Automatic recognition and standardization of resume sections.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiUpload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Import
            </h3>
            <p className="text-gray-600">
              Simple drag-and-drop interface for quick resume uploads.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Upload Your Resume
                </h3>
                <p className="text-gray-600">
                  Simply drag and drop your resume file in PDF, Word, or LaTeX format.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  AI Analysis
                </h3>
                <p className="text-gray-600">
                  Our advanced AI system analyzes and extracts key information from your resume.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Review & Edit
                </h3>
                <p className="text-gray-600">
                  Review the extracted content and make any necessary adjustments in our intuitive editor.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Generate & Download
                </h3>
                <p className="text-gray-600">
                  Choose from our professional templates and download your polished resume.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 