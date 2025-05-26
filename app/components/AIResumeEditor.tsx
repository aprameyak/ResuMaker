import React, { useState, useEffect, useCallback } from 'react';
import { FormData } from '@/app/types';

interface AIFeedback {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'improvement' | 'correction' | 'enhancement';
}

interface AIResumeEditorProps {
  section: keyof FormData;
  content: string;
  onUpdate: (newContent: string) => void;
}

export default function AIResumeEditor({ section, content, onUpdate }: AIResumeEditorProps) {
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const analyzeSectionContent = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to analyze content');
      }
      
      setFeedback(data.data || []);
    } catch (error) {
      console.error('Error analyzing content:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  }, [section, content]);

  // Debounce content changes before requesting AI feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        analyzeSectionContent();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, analyzeSectionContent]);

  const handleAcceptSuggestion = (index: number) => {
    const suggestion = feedback[index];
    if (!suggestion) return;

    try {
      // Create a new string with the replacement to avoid regex issues
      const parts = content.split(suggestion.original);
      if (parts.length < 2) return; // Original text not found
      
      const newContent = parts.join(suggestion.suggestion);
      onUpdate(newContent);

      // Remove the accepted suggestion from the feedback list
      setFeedback(prev => prev.filter((_, i) => i !== index));
      setSelectedSuggestion(null);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      setError('Failed to apply suggestion. Please try again.');
    }
  };

  const handleRejectSuggestion = (index: number) => {
    setFeedback(prev => prev.filter((_, i) => i !== index));
    setSelectedSuggestion(null);
  };

  const styles = {
    container: {
      position: 'relative' as const,
      width: '100%',
      fontFamily: "'Segoe UI', sans-serif",
    },
    editor: {
      width: '100%',
      minHeight: '200px',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '1rem',
      fontSize: '1rem',
      lineHeight: '1.5',
      resize: 'vertical' as const,
    },
    suggestionContainer: {
      marginTop: '1rem',
      padding: '1rem',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
    },
    suggestion: {
      marginBottom: '1rem',
      padding: '1rem',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    diffView: {
      display: 'flex',
      gap: '1rem',
      padding: '0.5rem',
      backgroundColor: '#f3f4f6',
      borderRadius: '4px',
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
    },
    original: {
      color: '#dc2626',
      textDecoration: 'line-through',
      flex: 1,
    },
    suggested: {
      color: '#059669',
      flex: 1,
    },
    explanation: {
      color: '#6b7280',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
    },
    buttonContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.5rem',
    },
    acceptButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
    },
    rejectButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
    },
    loadingIndicator: {
      position: 'absolute' as const,
      top: '1rem',
      right: '1rem',
      color: '#6b7280',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      color: '#dc2626',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    retryButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.errorContainer}>
          <span>{error}</span>
          <button
            onClick={() => analyzeSectionContent()}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}
      
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        style={styles.editor}
        placeholder={`Enter your ${section} content here...`}
      />
      
      {isAnalyzing && (
        <div style={styles.loadingIndicator}>
          <svg
            className="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="#6b7280" strokeDasharray="32" strokeLinecap="round" />
          </svg>
          Analyzing content...
        </div>
      )}

      {feedback.length > 0 && (
        <div style={styles.suggestionContainer}>
          <h3 style={{ marginBottom: '1rem', color: '#111827' }}>AI Suggestions</h3>
          {feedback.map((item, index) => (
            <div
              key={index}
              style={{
                ...styles.suggestion,
                border: selectedSuggestion === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              }}
              onClick={() => setSelectedSuggestion(index)}
            >
              <div style={styles.diffView}>
                <div style={styles.original}>{item.original}</div>
                <div style={styles.suggested}>{item.suggestion}</div>
              </div>
              <p style={styles.explanation}>{item.explanation}</p>
              <div style={styles.buttonContainer}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptSuggestion(index);
                  }}
                  style={styles.acceptButton}
                >
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectSuggestion(index);
                  }}
                  style={styles.rejectButton}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 