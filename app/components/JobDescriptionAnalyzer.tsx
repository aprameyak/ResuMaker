import React, { useState } from 'react';
import { analyzeJobDescription } from '../../lib/resume';
import { motion } from 'framer-motion';
import { FiTarget } from 'react-icons/fi';

interface JobAnalysis {
  essential: string[];
  preferred: string[];
  skills: string[];
  industry: string[];
}

interface JobDescriptionAnalyzerProps {
  onAnalyze: (analysis: JobAnalysis) => void;
}

const JobDescriptionAnalyzer: React.FC<JobDescriptionAnalyzerProps> = ({ onAnalyze }) => {
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      onAnalyze(analyzeJobDescription(description));
    } catch (error) {
      setError('Failed to analyze job description');
      console.error('Analysis error:', error);
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
          <FiTarget style={{ width: '24px', height: '24px', color: '#111111' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Analyze Job Description
          </h3>
        </div>
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste the job description here..."
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
          onClick={handleAnalyze}
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
          {isLoading ? 'Analyzing...' : 'Analyze Job Description'}
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

export default JobDescriptionAnalyzer;
