import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { SECTION_TYPES } from '../constants';

const ResumePreview = ({ sections }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto"
    >
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              {section.title}
            </h2>
            <div className="prose max-w-none">
              {section.type === SECTION_TYPES.EDUCATION && (
                <div className="space-y-4">
                  {section.content.split('\n').map((entry, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{entry.split(' - ')[0]}</h3>
                        <p className="text-gray-600">{entry.split(' - ')[1]}</p>
                      </div>
                      <p className="text-gray-500">{entry.split(' - ')[2]}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.EXPERIENCE && (
                <div className="space-y-4">
                  {section.content.split('\n').map((entry, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{entry.split(' - ')[0]}</h3>
                        <p className="text-gray-500">{entry.split(' - ')[1]}</p>
                      </div>
                      <p className="text-gray-600">{entry.split(' - ')[2]}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.SKILLS && (
                <div className="flex flex-wrap gap-2">
                  {section.content.split(',').map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}

              {section.type === SECTION_TYPES.PROJECTS && (
                <div className="space-y-4">
                  {section.content.split('\n\n').map((project, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{project.split('\n')[0]}</h3>
                      <p className="text-gray-600">{project.split('\n')[1]}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.split('\n')[2]?.split(',').map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
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
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

ResumePreview.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(Object.values(SECTION_TYPES)).isRequired,
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired
    })
  ).isRequired
};

export default ResumePreview; 