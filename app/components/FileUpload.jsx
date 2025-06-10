import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';

const FileUpload = ({ onUpload }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
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
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <input {...getInputProps()} />
        <FiUpload className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop your resume here'
            : 'Drag and drop your resume, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT
        </p>
      </div>
    </motion.div>
  );
};

FileUpload.propTypes = {
  onUpload: PropTypes.func.isRequired
};

export default FileUpload; 