import React from 'react';
import { motion } from 'framer-motion';

interface Section {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface ResumeViewerProps {
  sections: Section[];
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({ sections }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sections.map((section) => (
          <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '8px'
            }}>
              {section.title}
            </h3>
            <div style={{
              color: '#374151',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ResumeViewer;
