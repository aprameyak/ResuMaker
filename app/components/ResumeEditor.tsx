import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { SECTION_TYPES, SectionType } from '../constants';

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
}

interface ResumeEditorProps {
  sections: Section[];
  onUpdate: (section: Section, content: string) => void;
  onAdd: (type: SectionType) => void;
  onDelete: (section: Section) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ sections, onUpdate, onAdd, onDelete }) => {
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  const handleSectionClick = useCallback((section: Section) => {
    setActiveSection(section);
  }, []);

  const handleContentChange = useCallback((section: Section, content: string) => {
    onUpdate(section, content);
  }, [onUpdate]);

  const handleAddSection = useCallback((type: SectionType) => {
    onAdd(type);
  }, [onAdd]);

  const handleDeleteSection = useCallback((section: Section) => {
    onDelete(section);
  }, [onDelete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sections.map((section) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            padding: '24px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827'
            }}>
              {section.title}
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => handleSectionClick(section)}
                style={{
                  padding: '8px',
                  color: '#4b5563',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'color 0.2s'
                }}
              >
                <FiEdit2 style={{ width: '20px', height: '20px' }} />
              </button>
              <button
                onClick={() => handleDeleteSection(section)}
                style={{
                  padding: '8px',
                  color: '#4b5563',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'color 0.2s'
                }}
              >
                <FiTrash2 style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
          </div>
          <textarea
            value={section.content}
            onChange={(e) => handleContentChange(section, e.target.value)}
            style={{
              width: '100%',
              height: '128px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              resize: 'vertical',
              fontSize: '16px',
              lineHeight: '1.5',
              fontFamily: 'inherit'
            }}
            placeholder={`Enter your ${section.title} here...`}
          />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={() => handleAddSection(SECTION_TYPES.SUMMARY)}
          style={{
            display: 'flex',
            alignItems: 'center',
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
          <FiPlus style={{ width: '20px', height: '20px' }} />
          <span>Add Section</span>
        </button>
      </motion.div>
    </div>
  );
};

export default ResumeEditor;
