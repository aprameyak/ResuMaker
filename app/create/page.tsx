'use client';

import React from 'react';
import { FiUser, FiBook, FiBriefcase, FiAward, FiTool } from 'react-icons/fi';

export default function CreatePage() {
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
            <button className="btn-primary w-full">Start with Personal Info</button>
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
            <button className="btn-secondary w-full">Add Education</button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                <p className="text-gray-600">Your professional history and accomplishments</p>
              </div>
            </div>
            <button className="btn-secondary w-full">Add Experience</button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiAward className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                <p className="text-gray-600">Showcase your notable projects and achievements</p>
              </div>
            </div>
            <button className="btn-secondary w-full">Add Projects</button>
          </div>

          <div className="card p-6 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="feature-icon">
                <FiTool className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                <p className="text-gray-600">List your technical and soft skills</p>
              </div>
            </div>
            <button className="btn-secondary w-full">Add Skills</button>
          </div>
        </div>
      </div>
    </div>
  );
} 