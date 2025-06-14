'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { FiUpload } from 'react-icons/fi';

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default function UploadPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

    setUploading(true);
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
      setUploading(false);
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
          disabled={!file || uploading}
          className={`mt-4 w-full py-2 px-4 rounded-md text-white ${
            !file || uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>
    </div>
  );
} 