import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiDownload } from 'react-icons/fi';

const ResumeExporter = ({ resume }) => {
  const handleExport = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'resume.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <button
        onClick={handleExport}
        className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <FiDownload className="w-5 h-5" />
        <span>Export Resume</span>
      </button>
    </motion.div>
  );
};

ResumeExporter.propTypes = {
  resume: PropTypes.shape({
    summary: PropTypes.string.isRequired,
    education: PropTypes.arrayOf(
      PropTypes.shape({
        institution: PropTypes.string.isRequired,
        degree: PropTypes.string.isRequired,
        field: PropTypes.string.isRequired,
        dates: PropTypes.string.isRequired,
        gpa: PropTypes.string
      })
    ).isRequired,
    experience: PropTypes.arrayOf(
      PropTypes.shape({
        company: PropTypes.string.isRequired,
        position: PropTypes.string.isRequired,
        dates: PropTypes.string.isRequired,
        responsibilities: PropTypes.arrayOf(PropTypes.string).isRequired
      })
    ).isRequired,
    skills: PropTypes.shape({
      technical: PropTypes.arrayOf(PropTypes.string).isRequired,
      soft: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired,
    projects: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        technologies: PropTypes.arrayOf(PropTypes.string).isRequired
      })
    ).isRequired
  }).isRequired
};

export default ResumeExporter; 