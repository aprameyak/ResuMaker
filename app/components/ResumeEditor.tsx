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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {sections.map((section) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <h3>{section.title}</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn-icon"
                onClick={() => handleSectionClick(section)}
                aria-label={`Edit ${section.title}`}
                title="Edit"
              >
                <FiEdit2 style={{ width: '18px', height: '18px' }} />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleDeleteSection(section)}
                aria-label={`Delete ${section.title}`}
                title="Delete"
              >
                <FiTrash2 style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
          <textarea
            className="input"
            value={section.content}
            onChange={(e) => handleContentChange(section, e.target.value)}
            aria-label={section.title}
            style={{ height: '128px' }}
            placeholder={`Enter your ${section.title} here...`}
          />
        </motion.div>
      ))}

      <div>
        <button className="btn-secondary" onClick={() => handleAddSection(SECTION_TYPES.SUMMARY)}>
          <FiPlus aria-hidden="true" style={{ width: '18px', height: '18px' }} />
          <span>Add Section</span>
        </button>
      </div>
    </div>
  );
};

export default ResumeEditor;
