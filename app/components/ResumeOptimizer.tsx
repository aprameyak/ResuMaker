import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiZap } from 'react-icons/fi';

interface Keywords {
  essential: string[];
  preferred: string[];
  skills: string[];
  industry: string[];
}

interface OptimizationResult {
  optimized: string;
  changes: Array<{
    original: string;
    replacement: string;
    explanation: string;
  }>;
}

interface ResumeOptimizerProps {
  content: string;
  onOptimize: (result: OptimizationResult) => void;
}

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({ content, onOptimize }) => {
  const [keywords, setKeywords] = useState<Keywords>({
    essential: [],
    preferred: [],
    skills: [],
    industry: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!content.trim()) {
      setError('Please provide resume content');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, keywords }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize resume');
      }

      const data = await response.json();
      onOptimize(data.data);
    } catch (error) {
      setError('Failed to optimize resume');
      console.error('Optimization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateKeywords = (type: keyof Keywords, value: string) => {
    const keywordsList = value.split(',').map(k => k.trim()).filter(k => k);
    setKeywords(prev => ({ ...prev, [type]: keywordsList }));
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
          <FiZap style={{ width: '24px', height: '24px', color: '#2563eb' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Optimize Resume
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Essential Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords.essential.join(', ')}
              onChange={(e) => updateKeywords('essential', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Preferred Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords.preferred.join(', ')}
              onChange={(e) => updateKeywords('preferred', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., AWS, Docker, Kubernetes"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Technical Skills (comma-separated)
            </label>
            <input
              type="text"
              value={keywords.skills.join(', ')}
              onChange={(e) => updateKeywords('skills', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., JavaScript, Python, SQL"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Industry Terms (comma-separated)
            </label>
            <input
              type="text"
              value={keywords.industry.join(', ')}
              onChange={(e) => updateKeywords('industry', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., Agile, Scrum, CI/CD"
            />
          </div>
        </div>
        
        <button
          onClick={handleOptimize}
          disabled={isLoading}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {isLoading ? 'Optimizing...' : 'Optimize Resume'}
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

export default ResumeOptimizer;
