import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormData, ResumeSection, AIFeedback, APIResponse } from '@/app/types';

interface AIResumeEditorProps {
  section: ResumeSection;
  content: string;
  onUpdate: (newContent: string) => void;
}

const MAX_CONTENT_LENGTH = parseInt(process.env.NEXT_PUBLIC_MAX_CONTENT_LENGTH || '5000', 10);
const DEBOUNCE_DELAY = 1000;

export default function AIResumeEditor({ section, content, onUpdate }: AIResumeEditorProps) {
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const getFeedback = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          sectionType: section.type,
        }),
      });

      const data: APIResponse<AIFeedback[]> = await response.json();
      
      if (data.status === 'error' || !data.data) {
        throw new Error(data.error || 'Failed to get AI feedback');
      }

      setFeedback(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI feedback');
      console.error('Error getting AI feedback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [section.type]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      getFeedback(content);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, getFeedback]);

  return (
    <div className="relative">
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full h-32 p-2 border rounded-md resize-y"
        placeholder={`Enter your ${section.title} here...`}
        maxLength={MAX_CONTENT_LENGTH}
      />
      
      {isLoading && (
        <div className="mt-2 text-sm text-gray-500">
          Getting AI feedback...
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {feedback.length > 0 && (
        <div className="mt-4 space-y-4">
          {feedback.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{item.explanation}</p>
              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                <p className="text-sm text-gray-500">Suggestion:</p>
                <p className="mt-1 text-sm">{item.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 