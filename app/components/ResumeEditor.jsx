import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { SECTION_TYPES } from '../constants';

const ResumeEditor = ({ sections, onUpdate, onAdd, onDelete }) => {
  const [activeSection, setActiveSection] = useState(null);

  const handleSectionClick = useCallback((section) => {
    setActiveSection(section);
  }, []);

  const handleContentChange = useCallback((section, content) => {
    onUpdate(section, content);
  }, [onUpdate]);

  const handleAddSection = useCallback((type) => {
    onAdd(type);
  }, [onAdd]);

  const handleDeleteSection = useCallback((section) => {
    onDelete(section);
  }, [onDelete]);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSectionClick(section)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDeleteSection(section)}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <textarea
            value={section.content}
            onChange={(e) => handleContentChange(section, e.target.value)}
            className="w-full h-32 p-2 border rounded-md resize-y"
            placeholder={`Enter your ${section.title} here...`}
          />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center"
      >
        <button
          onClick={() => handleAddSection(SECTION_TYPES.SUMMARY)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Section</span>
        </button>
      </motion.div>
    </div>
  );
};

ResumeEditor.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(Object.values(SECTION_TYPES)).isRequired,
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired
    })
  ).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default ResumeEditor; 