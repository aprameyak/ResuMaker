'use client';

import React, { useState, useCallback } from 'react';
import { FiUpload, FiFile, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = async (file: File) => {
    setFile(file);
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Store the parsed data in localStorage
      localStorage.setItem('parsedResumeData', JSON.stringify(data));
      
      // Redirect to create page with the parsed data
      setTimeout(() => {
        router.push('/create');
      }, 1500);
    } catch (error) {
      console.error('Error parsing resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`relative group ${
        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
      } border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ease-in-out`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="resume-upload"
        className="hidden"
        accept=".pdf,.doc,.docx,.tex"
        onChange={handleFileChange}
      />
      <label htmlFor="resume-upload" className="cursor-pointer block text-center">
        <div className="mx-auto w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-all duration-300">
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
          ) : success ? (
            <FiCheck className="w-10 h-10" />
          ) : error ? (
            <FiAlertCircle className="w-10 h-10" />
          ) : (
            <FiUpload className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
          {success ? 'Resume Parsed Successfully!' : error ? 'Upload Failed' : file ? 'Processing...' : 'Drop your resume here'}
        </h3>
        <p className="text-gray-600 mb-4 group-hover:text-gray-900 transition-colors duration-200">
          {success ? 'Redirecting to editor...' : error ? error : file ? file.name : 'or click to select a file'}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <FiFile className="w-4 h-4" />
          <span>Supported formats: PDF, Word (DOC, DOCX), LaTeX</span>
        </div>
      </label>
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-500 bg-opacity-10 rounded-2xl pointer-events-none" />
      )}
      {error && (
        <button
          onClick={() => {
            setError(null);
            setFile(null);
          }}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
} 