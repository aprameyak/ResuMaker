import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';

interface ResumeDownloaderProps {
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
  }>;
}

const ResumeDownloader: React.FC<ResumeDownloaderProps> = ({ sections }) => {
  const handleDownload = () => {
    const resumeText = sections
      .map(section => `${section.title}\n${section.content}`)
      .join('\n\n');

    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%' }}
    >
      <button
        onClick={handleDownload}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#16a34a',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
      >
        <FiDownload style={{ width: '20px', height: '20px' }} />
        Download as Text
      </button>
    </motion.div>
  );
};

export default ResumeDownloader;
