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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
      style={{ padding: '32px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sections.map((section) => (
          <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              borderBottom: '1px solid var(--border)',
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
                        <h3 style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {entry.split(' - ')[0]}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{entry.split(' - ')[1]}</p>
                      </div>
                      <p style={{ color: 'var(--text-muted)' }}>{entry.split(' - ')[2]}</p>
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
                        <h3 style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {entry.split(' - ')[0]}
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>{entry.split(' - ')[1]}</p>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>{entry.split(' - ')[2]}</p>
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
                        padding: '2px 10px',
                        backgroundColor: 'var(--panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: 'var(--text)'
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
                      <h3 style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {project.split('\n')[0]}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>{project.split('\n')[1]}</p>
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
                              padding: '2px 8px',
                              backgroundColor: 'var(--panel)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              borderRadius: '4px',
                              fontSize: '13px'
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
                  color: 'var(--text)',
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
