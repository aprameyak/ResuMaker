import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const ResumeViewer = ({ resume }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
            Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{resume.summary}</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
            Education
          </h2>
          <div className="space-y-4">
            {resume.education.map((edu, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{edu.institution}</h3>
                  <p className="text-gray-600">{edu.degree} in {edu.field}</p>
                </div>
                <p className="text-gray-500">{edu.dates}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
            Experience
          </h2>
          <div className="space-y-4">
            {resume.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h3 className="font-semibold">{exp.company}</h3>
                  <p className="text-gray-500">{exp.dates}</p>
                </div>
                <p className="text-gray-600">{exp.position}</p>
                <ul className="list-disc list-inside mt-2">
                  {exp.responsibilities.map((resp, respIndex) => (
                    <li key={respIndex} className="text-gray-700">{resp}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
            Skills
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Technical Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {resume.skills.technical.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Soft Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {resume.skills.soft.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
            Projects
          </h2>
          <div className="space-y-4">
            {resume.projects.map((project, index) => (
              <div key={index}>
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-gray-600">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

ResumeViewer.propTypes = {
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

export default ResumeViewer; 