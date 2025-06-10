import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';

const ResumeOptimizer = ({ onOptimize }) => {
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState({
    essential: [],
    preferred: [],
    skills: [],
    industry: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

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

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to optimize resume');
      }

      onOptimize(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize resume');
      console.error('Error optimizing resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Resume Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={6}
            placeholder="Paste your resume content here..."
          />
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords.essential.join(', ')}
            onChange={(e) => setKeywords({ ...keywords, essential: e.target.value.split(',').map(k => k.trim()) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter keywords..."
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading || !content.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? 'Optimizing...' : 'Optimize Resume'}
        </button>
      </form>
    </motion.div>
  );
};

ResumeOptimizer.propTypes = {
  onOptimize: PropTypes.func.isRequired
};

export default ResumeOptimizer; 