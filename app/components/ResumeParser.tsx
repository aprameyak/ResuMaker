import React, { useState } from 'react';
import { parseResume } from '../../lib/resume';
import { motion } from 'framer-motion';
import { FiFileText } from 'react-icons/fi';

interface ParsedData {
  summary?: string;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    dates: string;
    gpa?: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    dates: string;
    responsibilities: string[];
  }>;
  skills?: {
    technical: string[];
    soft: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

interface ResumeParserProps {
  onParse: (data: ParsedData) => void;
}

const ResumeParser: React.FC<ResumeParserProps> = ({ onParse }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!content.trim()) {
      setError('Please enter resume content');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = parseResume(content);
      onParse(data);
    } catch (error) {
      setError('Failed to parse resume');
      console.error('Parse error:', error);
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
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <FiFileText style={{ width: '24px', height: '24px', color: '#111111' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Parse Resume Content
          </h3>
        </div>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your resume content here..."
          style={{
            width: '100%',
            height: '200px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            resize: 'vertical',
            fontSize: '16px',
            lineHeight: '1.5',
            fontFamily: 'inherit'
          }}
        />
        
        <button
          onClick={handleParse}
          disabled={isLoading}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: isLoading ? '#9ca3af' : '#111111',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {isLoading ? 'Parsing...' : 'Parse Resume'}
        </button>
        
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
      </div>
    </motion.div>
  );
};

export default ResumeParser;
