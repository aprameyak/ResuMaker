import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';

interface ResumeExporterProps {
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
  }>;
}

const ResumeExporter: React.FC<ResumeExporterProps> = ({ sections }) => {
  const handleExport = () => {
    const resumeData = {
      sections,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(resumeData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.json';
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
        onClick={handleExport}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#2563eb',
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
        Export Resume
      </button>
    </motion.div>
  );
};

export default ResumeExporter;
