'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { FiUpload } from 'react-icons/fi';

export default function UploadPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      router.push('/create');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !userId) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8">Upload Your Resume</h1>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
            <span className="text-gray-600">
              {file ? file.name : 'Click to select PDF file'}
            </span>
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`mt-4 w-full py-2 px-4 rounded-md text-white ${
            !file || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>
    </div>
  );
} 