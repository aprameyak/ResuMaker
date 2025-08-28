import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit3 } from 'react-icons/fi';

interface Suggestion {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'improvement' | 'correction' | 'enhancement';
}

interface AIResumeEditorProps {
  section: string;
  content: string;
  onUpdate: (content: string) => void;
}

const AIResumeEditor: React.FC<AIResumeEditorProps> = ({ section, content, onUpdate }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please enter content to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setSuggestions(data.data);
    } catch (error) {
      setError('Failed to analyze content');
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    const newContent = content.replace(suggestion.original, suggestion.suggestion);
    onUpdate(newContent);
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
          <FiEdit3 style={{ width: '24px', height: '24px', color: '#2563eb' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            AI Resume Editor
          </h3>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          style={{
            marginBottom: '16px',
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
          {isLoading ? 'Analyzing...' : 'Get AI Suggestions'}
        </button>
        
        {error && (
          <div style={{
            marginBottom: '16px',
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
        
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827'
            }}>
              AI Suggestions
            </h4>
            {suggestions.map((suggestion, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {suggestion.type}
                  </span>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Apply
                  </button>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#dc2626' }}>Original:</strong>
                  <p style={{ color: '#4b5563', fontSize: '14px' }}>{suggestion.original}</p>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#16a34a' }}>Suggestion:</strong>
                  <p style={{ color: '#4b5563', fontSize: '14px' }}>{suggestion.suggestion}</p>
                </div>
                <div>
                  <strong style={{ color: '#111827' }}>Explanation:</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>{suggestion.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIResumeEditor;
