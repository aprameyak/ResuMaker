import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { FormData as ResumeFormData } from '@/app/types';

interface ResumeParserProps {
  onParseComplete: (data: ResumeFormData) => void;
  onError: (error: string) => void;
}

interface ParseProgress {
  status: 'idle' | 'parsing' | 'success' | 'error';
  message: string;
  progress: number;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/x-tex': ['.tex'],
  'text/plain': ['.txt']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ResumeParser: React.FC<ResumeParserProps> = ({ onParseComplete, onError }) => {
  const [parseProgress, setParseProgress] = useState<ParseProgress>({
    status: 'idle',
    message: '',
    progress: 0
  });

  const updateProgress = (progress: number, message: string, status: ParseProgress['status'] = 'parsing') => {
    setParseProgress({ status, message, progress });
  };

  const handleParseError = (error: string) => {
    setParseProgress({
      status: 'error',
      message: error,
      progress: 0
    });
    onError(error);
  };

  const parseFile = async (file: File) => {
    try {
      updateProgress(10, 'Initializing parser...');

      const formData = new window.FormData();
      formData.append('file', file);

      updateProgress(30, 'Uploading file...');

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to parse resume: ${response.statusText}`);
      }

      updateProgress(60, 'Processing content...');

      const data = await response.json();

      updateProgress(90, 'Finalizing...');

      if (data.error) {
        throw new Error(data.error);
      }

      setParseProgress({
        status: 'success',
        message: 'Resume parsed successfully!',
        progress: 100
      });

      onParseComplete(data);
    } catch (error) {
      handleParseError(error instanceof Error ? error.message : 'Failed to parse resume');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      handleParseError('File size exceeds 10MB limit');
      return;
    }

    setParseProgress({
      status: 'parsing',
      message: 'Starting parse...',
      progress: 0
    });

    await parseFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative p-8 border-2 border-dashed rounded-lg transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${parseProgress.status === 'success' ? 'border-green-500 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={parseProgress.status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            {parseProgress.status === 'idle' && (
              <>
                <FiUpload className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700">
                    Drop your resume here or click to upload
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports PDF, DOC, DOCX, TEX, and TXT files up to 10MB
                  </p>
                </div>
              </>
            )}

            {parseProgress.status === 'parsing' && (
              <>
                <FiFile className="w-12 h-12 text-blue-500 animate-pulse" />
                <div className="text-center">
                  <p className="text-lg font-medium text-blue-700">{parseProgress.message}</p>
                  <div className="w-full h-2 bg-blue-100 rounded-full mt-4">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${parseProgress.progress}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {parseProgress.status === 'success' && (
              <>
                <FiCheckCircle className="w-12 h-12 text-green-500" />
                <p className="text-lg font-medium text-green-700">{parseProgress.message}</p>
              </>
            )}

            {parseProgress.status === 'error' && (
              <>
                <FiAlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-lg font-medium text-red-700">{parseProgress.message}</p>
                <button
                  onClick={() => setParseProgress({ status: 'idle', message: '', progress: 0 })}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {parseProgress.status !== 'idle' && parseProgress.status !== 'error' && (
        <button
          onClick={() => setParseProgress({ status: 'idle', message: '', progress: 0 })}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Upload Another Resume
        </button>
      )}
    </div>
  );
}; 