import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';

interface ResumeData {
  [key: string]: any;
}

interface ResumeImporterProps {
  onImport: (resume: ResumeData) => void;
}

const ResumeImporter: React.FC<ResumeImporterProps> = ({ onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const resume: ResumeData = JSON.parse(event.target?.result as string);
          onImport(resume);
        } catch (err) {
          setError('Invalid JSON file');
          console.error('Error parsing JSON:', err);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read file');
      console.error('Error reading file:', err);
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="file" style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Import Resume
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            style={{
              marginTop: '4px',
              display: 'block',
              width: '100%'
            }}
            accept=".json"
          />
        </div>

        {error && (
          <div style={{
            fontSize: '14px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !file}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 16px',
            border: '1px solid transparent',
            borderRadius: '6px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
            color: 'white',
            backgroundColor: isLoading || !file ? '#9ca3af' : '#2563eb',
            cursor: isLoading || !file ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Importing...' : 'Import Resume'}
        </button>
      </form>
    </motion.div>
  );
};

export default ResumeImporter;
