import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';

interface FileUploadProps {
  onUpload: (content: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      onUpload(text);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%' }}
    >
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#2563eb' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#eff6ff' : 'white',
          transition: 'all 0.2s'
        }}
      >
        <input {...getInputProps()} />
        <FiUpload style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px auto',
          color: '#9ca3af',
          display: 'block'
        }} />
        <p style={{
          marginTop: '8px',
          fontSize: '14px',
          color: '#4b5563'
        }}>
          {isDragActive
            ? 'Drop your resume here'
            : 'Drag and drop your resume, or click to select'}
        </p>
        <p style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Supported formats: PDF, DOC, DOCX, TXT
        </p>
      </div>
    </motion.div>
  );
};

export default FileUpload;
