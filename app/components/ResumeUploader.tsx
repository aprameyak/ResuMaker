import React, { useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFile } from 'react-icons/fi';

interface ResumeUploaderProps {
  onUpload: (content: string) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      onUpload(text);
    } catch (error) {
      setError('Failed to read file');
      console.error('Error reading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%' }}
    >
      <div style={{
        border: '2px dashed #d1d5db',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        backgroundColor: 'white'
      }}>
        {!file ? (
          <>
            <FiUpload style={{
              width: '48px',
              height: '48px',
              color: '#9ca3af',
              margin: '0 auto 16px auto',
              display: 'block'
            }} />
            <p style={{
              fontSize: '16px',
              color: '#4b5563',
              marginBottom: '8px'
            }}>
              Upload your resume file
            </p>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Choose File
            </label>
          </>
        ) : (
          <>
            <FiFile style={{
              width: '32px',
              height: '32px',
              color: '#2563eb',
              margin: '0 auto 16px auto',
              display: 'block'
            }} />
            <p style={{
              fontSize: '16px',
              color: '#111827',
              marginBottom: '16px'
            }}>
              {file.name}
            </p>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoading ? '#9ca3af' : '#16a34a',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {isLoading ? 'Processing...' : 'Upload'}
            </button>
          </>
        )}
      </div>
      
      {error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </motion.div>
  );
};

export default ResumeUploader;
