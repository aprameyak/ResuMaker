import React, { useState, useEffect, useCallback } from 'react';
import { FormData, Experience, Education, Project, Skills, PersonalInfo } from '@/app/types';
import { debounce } from 'lodash';

interface EditorProps {
  initialData?: FormData;
  onSave?: (data: FormData) => void;
}

const DEFAULT_DATA: FormData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    linkedin: '',
    github: ''
  },
  experience: [],
  education: [],
  projects: [],
  skills: {
    technical: [],
    soft: [],
    languages: [],
    certifications: []
  }
};

export default function ResumeEditor({ initialData, onSave }: EditorProps) {
  const [formData, setFormData] = useState<FormData>(initialData || DEFAULT_DATA);
  const [isDirty, setIsDirty] = useState(false);

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
    setIsDirty(true);
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        location: '',
        achievements: []
      }]
    }));
    setIsDirty(true);
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
    setIsDirty(true);
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        location: '',
        achievements: []
      }]
    }));
    setIsDirty(true);
  };

  const handleProjectChange = (index: number, field: keyof Project, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) => 
        i === index ? { ...proj, [field]: value } : proj
      )
    }));
    setIsDirty(true);
  };

  const handleAddProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: '',
        description: '',
        technologies: [],
        startDate: '',
        endDate: '',
        achievements: []
      }]
    }));
    setIsDirty(true);
  };

  const handleSkillsChange = (field: keyof Skills, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const handleAchievementChange = (
    section: 'education' | 'experience' | 'projects',
    index: number,
    achievementIndex: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? {
          ...item,
          achievements: item.achievements.map((ach, j) => 
            j === achievementIndex ? value : ach
          )
        } : item
      )
    }));
    setIsDirty(true);
  };

  const handleAddAchievement = (
    section: 'education' | 'experience' | 'projects',
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? {
          ...item,
          achievements: [...item.achievements, '']
        } : item
      )
    }));
    setIsDirty(true);
  };

  const handleRemoveAchievement = (
    section: 'education' | 'experience' | 'projects',
    index: number,
    achievementIndex: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? {
          ...item,
          achievements: item.achievements.filter((_, j) => j !== achievementIndex)
        } : item
      )
    }));
    setIsDirty(true);
  };

  const handleRemoveItem = (section: 'education' | 'experience' | 'projects', index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const debouncedSave = useCallback(
    debounce((data: FormData) => {
      if (onSave) {
        onSave(data);
        setIsDirty(false);
      }
    }, 1000),
    [onSave]
  );

  useEffect(() => {
    if (isDirty) {
      debouncedSave(formData);
    }
  }, [formData, isDirty, debouncedSave]);

  return (
    <div className="space-y-8">
      {/* Personal Info Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.personalInfo.fullName}
            onChange={e => handlePersonalInfoChange('fullName', e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Title"
            value={formData.personalInfo.title}
            onChange={e => handlePersonalInfoChange('title', e.target.value)}
            className="input"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.personalInfo.email}
            onChange={e => handlePersonalInfoChange('email', e.target.value)}
            className="input"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.personalInfo.phone}
            onChange={e => handlePersonalInfoChange('phone', e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.personalInfo.location}
            onChange={e => handlePersonalInfoChange('location', e.target.value)}
            className="input"
          />
          <input
            type="url"
            placeholder="Portfolio URL"
            value={formData.personalInfo.portfolio}
            onChange={e => handlePersonalInfoChange('portfolio', e.target.value)}
            className="input"
          />
          <input
            type="url"
            placeholder="LinkedIn URL"
            value={formData.personalInfo.linkedin}
            onChange={e => handlePersonalInfoChange('linkedin', e.target.value)}
            className="input"
          />
          <input
            type="url"
            placeholder="GitHub URL"
            value={formData.personalInfo.github}
            onChange={e => handlePersonalInfoChange('github', e.target.value)}
            className="input"
          />
        </div>
      </section>

      {/* Experience Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Experience</h2>
          <button
            onClick={handleAddExperience}
            className="btn-primary"
          >
            Add Experience
          </button>
        </div>
        {formData.experience.map((exp, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={e => handleExperienceChange(index, 'company', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Position"
                value={exp.position}
                onChange={e => handleExperienceChange(index, 'position', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Start Date"
                value={exp.startDate}
                onChange={e => handleExperienceChange(index, 'startDate', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="End Date"
                value={exp.endDate}
                onChange={e => handleExperienceChange(index, 'endDate', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Location"
                value={exp.location}
                onChange={e => handleExperienceChange(index, 'location', e.target.value)}
                className="input"
              />
              <textarea
                placeholder="Description"
                value={exp.description}
                onChange={e => handleExperienceChange(index, 'description', e.target.value)}
                className="input col-span-2"
                rows={3}
              />
              <div className="col-span-2">
                <h4 className="font-medium mb-2">Achievements</h4>
                {exp.achievements.map((achievement, achievementIndex) => (
                  <div key={achievementIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={e => handleAchievementChange('experience', index, achievementIndex, e.target.value)}
                      className="input flex-1"
                      placeholder="Achievement"
                    />
                    <button
                      onClick={() => handleRemoveAchievement('experience', index, achievementIndex)}
                      className="btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddAchievement('experience', index)}
                  className="btn-secondary"
                >
                  Add Achievement
                </button>
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem('experience', index)}
              className="btn-danger mt-4"
            >
              Remove Experience
            </button>
          </div>
        ))}
      </section>

      {/* Education Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Education</h2>
          <button
            onClick={handleAddEducation}
            className="btn-primary"
          >
            Add Education
          </button>
        </div>
        {formData.education.map((edu, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={e => handleEducationChange(index, 'institution', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={e => handleEducationChange(index, 'degree', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Field of Study"
                value={edu.field}
                onChange={e => handleEducationChange(index, 'field', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Start Date"
                value={edu.startDate}
                onChange={e => handleEducationChange(index, 'startDate', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="End Date"
                value={edu.endDate}
                onChange={e => handleEducationChange(index, 'endDate', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Location"
                value={edu.location}
                onChange={e => handleEducationChange(index, 'location', e.target.value)}
                className="input"
              />
              <div className="col-span-2">
                <h4 className="font-medium mb-2">Achievements</h4>
                {edu.achievements.map((achievement, achievementIndex) => (
                  <div key={achievementIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={e => handleAchievementChange('education', index, achievementIndex, e.target.value)}
                      className="input flex-1"
                      placeholder="Achievement"
                    />
                    <button
                      onClick={() => handleRemoveAchievement('education', index, achievementIndex)}
                      className="btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddAchievement('education', index)}
                  className="btn-secondary"
                >
                  Add Achievement
                </button>
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem('education', index)}
              className="btn-danger mt-4"
            >
              Remove Education
            </button>
          </div>
        ))}
      </section>

      {/* Projects Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Projects</h2>
          <button
            onClick={handleAddProject}
            className="btn-primary"
          >
            Add Project
          </button>
        </div>
        {formData.projects.map((project, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Project Name"
                value={project.name}
                onChange={e => handleProjectChange(index, 'name', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Technologies (comma-separated)"
                value={project.technologies.join(', ')}
                onChange={e => handleProjectChange(index, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                className="input"
              />
              <input
                type="text"
                placeholder="Start Date"
                value={project.startDate}
                onChange={e => handleProjectChange(index, 'startDate', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="End Date"
                value={project.endDate}
                onChange={e => handleProjectChange(index, 'endDate', e.target.value)}
                className="input"
              />
              <textarea
                placeholder="Description"
                value={project.description}
                onChange={e => handleProjectChange(index, 'description', e.target.value)}
                className="input col-span-2"
                rows={3}
              />
              <div className="col-span-2">
                <h4 className="font-medium mb-2">Achievements</h4>
                {project.achievements.map((achievement, achievementIndex) => (
                  <div key={achievementIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={e => handleAchievementChange('projects', index, achievementIndex, e.target.value)}
                      className="input flex-1"
                      placeholder="Achievement"
                    />
                    <button
                      onClick={() => handleRemoveAchievement('projects', index, achievementIndex)}
                      className="btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddAchievement('projects', index)}
                  className="btn-secondary"
                >
                  Add Achievement
                </button>
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem('projects', index)}
              className="btn-danger mt-4"
            >
              Remove Project
            </button>
          </div>
        ))}
      </section>

      {/* Skills Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2">Technical Skills</label>
            <textarea
              placeholder="Enter technical skills (one per line)"
              value={formData.skills.technical.join('\n')}
              onChange={e => handleSkillsChange('technical', e.target.value.split('\n'))}
              className="input"
              rows={5}
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Soft Skills</label>
            <textarea
              placeholder="Enter soft skills (one per line)"
              value={formData.skills.soft.join('\n')}
              onChange={e => handleSkillsChange('soft', e.target.value.split('\n'))}
              className="input"
              rows={5}
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Languages</label>
            <textarea
              placeholder="Enter languages (one per line)"
              value={formData.skills.languages.join('\n')}
              onChange={e => handleSkillsChange('languages', e.target.value.split('\n'))}
              className="input"
              rows={5}
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Certifications</label>
            <textarea
              placeholder="Enter certifications (one per line)"
              value={formData.skills.certifications.join('\n')}
              onChange={e => handleSkillsChange('certifications', e.target.value.split('\n'))}
              className="input"
              rows={5}
            />
          </div>
        </div>
      </section>
    </div>
  );
} 