import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const MAX_CONTENT_LENGTH = parseInt(process.env.NEXT_PUBLIC_MAX_CONTENT_LENGTH || '5000', 10);
const DEBOUNCE_DELAY = 1000;

export default function AIResumeEditor({ section, content, onUpdate }: AIResumeEditorProps) {
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<number>(0);
  const lastAnalysisRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeSectionContent = useCallback(async () => {
    // Don't analyze if content is empty or exceeds limit
    if (!content.trim() || content.length > MAX_CONTENT_LENGTH) {
      if (content.length > MAX_CONTENT_LENGTH) {
        setError(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
      }
      return;
    }

    // Don't analyze if content hasn't changed
    if (lastAnalysisRef.current === content) {
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsAnalyzing(true);
    setError(null);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, content }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          // Rate limit exceeded
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          setRetryTimeout(Date.now() + retryAfter * 1000);
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to analyze content');
      }
      
      lastAnalysisRef.current = content;
      setFeedback(data.data || []);
      setRetryCount(0);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      console.error('Error analyzing content:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze content');
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          analyzeSectionContent();
        }, backoffDelay);
      }
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  }, [section, content, retryCount]);

  // Debounce content changes before requesting AI feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim() && Date.now() > retryTimeout) {
        analyzeSectionContent();
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [content, analyzeSectionContent, retryTimeout]);

  const handleAcceptSuggestion = useCallback((index: number) => {
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
  }, [content, feedback, onUpdate]);

  const handleRejectSuggestion = useCallback((index: number) => {
    setFeedback(prev => prev.filter((_, i) => i !== index));
    setSelectedSuggestion(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    analyzeSectionContent();
  }, [analyzeSectionContent]);

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
      transition: 'border-color 0.2s ease',
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
    button: {
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'background-color 0.2s ease',
    },
    acceptButton: {
      backgroundColor: '#059669',
      color: 'white',
      '&:hover': {
        backgroundColor: '#047857',
      },
    },
    rejectButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      '&:hover': {
        backgroundColor: '#b91c1c',
      },
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
      '&:hover': {
        backgroundColor: '#b91c1c',
      },
    },
    characterCount: {
      position: 'absolute' as const,
      bottom: '0.5rem',
      right: '1rem',
      fontSize: '0.875rem',
      color: content.length > MAX_CONTENT_LENGTH ? '#dc2626' : '#6b7280',
    },
  };

  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.errorContainer}>
          <span>{error}</span>
          <button
            onClick={handleRetry}
            style={styles.retryButton}
            disabled={Date.now() < retryTimeout}
          >
            {Date.now() < retryTimeout
              ? `Retry in ${Math.ceil((retryTimeout - Date.now()) / 1000)}s`
              : 'Retry'}
          </button>
        </div>
      )}
      
      <div style={{ position: 'relative' }}>
        <textarea
          value={content}
          onChange={(e) => onUpdate(e.target.value)}
          style={styles.editor}
          placeholder={`Enter your ${section} content here...`}
          maxLength={MAX_CONTENT_LENGTH}
        />
        <div style={styles.characterCount}>
          {content.length} / {MAX_CONTENT_LENGTH}
        </div>
      </div>
      
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
                  style={{ ...styles.button, ...styles.acceptButton }}
                >
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectSuggestion(index);
                  }}
                  style={{ ...styles.button, ...styles.rejectButton }}
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