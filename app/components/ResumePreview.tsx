import React from 'react';
import { motion } from 'framer-motion';
import { SECTION_TYPES, SectionType } from '../constants';

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
}

interface ResumePreviewProps {
  sections: Section[];
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ sections }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        maxWidth: '1024px',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {sections.map((section) => (
          <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '8px'
            }}>
              {section.title}
            </h2>
            <div>
              {section.type === SECTION_TYPES.EDUCATION && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {section.content.split('\n').map((entry, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div>
                        <h3 style={{ fontWeight: '600', color: '#111827' }}>
                          {entry.split(' - ')[0]}
                        </h3>
                        <p style={{ color: '#4b5563' }}>{entry.split(' - ')[1]}</p>
                      </div>
                      <p style={{ color: '#6b7280' }}>{entry.split(' - ')[2]}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.EXPERIENCE && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {section.content.split('\n').map((entry, index) => (
                    <div key={index}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <h3 style={{ fontWeight: '600', color: '#111827' }}>
                          {entry.split(' - ')[0]}
                        </h3>
                        <p style={{ color: '#6b7280' }}>{entry.split(' - ')[1]}</p>
                      </div>
                      <p style={{ color: '#4b5563' }}>{entry.split(' - ')[2]}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.SKILLS && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {section.content.split(',').map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '16px',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.PROJECTS && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {section.content.split('\n\n').map((project, index) => (
                    <div key={index}>
                      <h3 style={{ fontWeight: '600', color: '#111827' }}>
                        {project.split('\n')[0]}
                      </h3>
                      <p style={{ color: '#4b5563' }}>{project.split('\n')[1]}</p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        {project.split('\n')[2]?.split(',').map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.SUMMARY && (
                <p style={{
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  {section.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ResumePreview;
