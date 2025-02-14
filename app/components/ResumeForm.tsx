import React, { useState } from 'react';
import type { FormData } from '@/app/types';

export default function ResumeForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
    },
    experience: [{
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    }],
    education: [{
      school: '',
      degree: '',
      graduationDate: ''
    }],
    skills: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Generate enhanced content for each experience
      const enhancedExperience = await Promise.all(
        formData.experience.map(async (exp) => {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exp),
          });
          const data = await response.json();
          return {
            ...exp,
            description: data.content || exp.description
          };
        })
      );

      onSubmit({
        ...formData,
        experience: enhancedExperience
      });
    } catch (error) {
      console.error('Error generating resume:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { school: '', degree: '', graduationDate: '' }]
    });
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, '']
    });
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-600 placeholder-slate-400";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-2";
  const sectionClasses = "flex items-center gap-3 mb-6";
  const sectionBarClasses = "w-1 h-6 bg-blue-500 rounded-full";

  const generateDescription = (type: string, data: any) => {
    // Example AI-like generation based on provided info
    switch (type) {
      case 'experience':
        return `As a ${data.position} at ${data.company}, I was responsible for key initiatives and projects. I leveraged my skills in ${formData.skills.join(', ')} to deliver impactful results.`;
      case 'education':
        return `Studied ${data.degree} at ${data.school}, focusing on core principles and practical applications.`;
      case 'skills':
        return `Proficient in ${data.join(', ')}, with practical experience in implementing solutions.`;
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
      {/* Form Header */}
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Create Your Resume</h2>
        <p className="text-slate-600">Fill in your details below</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Personal Information */}
        <section className="section">
          <div className="section-title">Personal Information</div>
          <div className="input-group">
            <label className="label">Full Name</label>
            <input 
              type="text"
              className="input"
              placeholder="e.g., John Smith"
              value={formData.personalInfo.name}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, name: e.target.value }
              })}
              required
            />
          </div>

          <div className="grid">
            <div className="input-group">
              <label className="label">Email</label>
              <input 
                type="email"
                className="input"
                placeholder="email@example.com"
                value={formData.personalInfo.email}
                onChange={(e) => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, email: e.target.value }
                })}
                required
              />
            </div>
            <div className="input-group">
              <label className="label">Phone</label>
              <input 
                type="tel"
                className="input"
                placeholder="(123) 456-7890"
                value={formData.personalInfo.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, phone: e.target.value }
                })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="label">Professional Summary</label>
            <textarea 
              className="textarea"
              placeholder="Brief overview of your professional background and goals"
              value={formData.personalInfo.summary}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, summary: e.target.value }
              })}
            />
            <p className="description-hint">Write 2-3 sentences about your career objectives and key strengths</p>
          </div>
        </section>

        {/* Experience */}
        <section className="section">
          <div className="section-title">
            <span>Work Experience</span>
            <button type="button" className="add-button" onClick={addExperience}>
              Add Experience
            </button>
          </div>
          
          {formData.experience.map((exp, index) => (
            <div key={index} className="input-group">
              <div className="grid">
                <div>
                  <label className="label">Company</label>
                  <input 
                    type="text"
                    className="input"
                    placeholder="Company name"
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].company = e.target.value;
                      setFormData({ ...formData, experience: newExp });
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="label">Position</label>
                  <input 
                    type="text"
                    className="input"
                    placeholder="Job title"
                    value={exp.position}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].position = e.target.value;
                      setFormData({ ...formData, experience: newExp });
                    }}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="label">Description</label>
                <textarea 
                  className="textarea"
                  placeholder="Describe your responsibilities and achievements"
                  value={exp.description}
                  onChange={(e) => {
                    const newExp = [...formData.experience];
                    newExp[index].description = e.target.value;
                    setFormData({ ...formData, experience: newExp });
                  }}
                />
                <button
                  type="button"
                  className="add-button"
                  onClick={() => {
                    const newExp = [...formData.experience];
                    newExp[index].description = generateDescription('experience', exp);
                    setFormData({ ...formData, experience: newExp });
                  }}
                >
                  Generate Description
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Education */}
        <section className="section">
          <div className="section-title">Education</div>
          <div className="input-group">
            <label className="label">School</label>
            <input
              type="text"
              className="input"
              placeholder="School name"
              value={formData.education[0].school}
              onChange={(e) => {
                const newEdu = [...formData.education];
                newEdu[0].school = e.target.value;
                setFormData({ ...formData, education: newEdu });
              }}
              required
            />
          </div>
          <div className="input-group">
            <label className="label">Degree</label>
            <input
              type="text"
              className="input"
              placeholder="Degree"
              value={formData.education[0].degree}
              onChange={(e) => {
                const newEdu = [...formData.education];
                newEdu[0].degree = e.target.value;
                setFormData({ ...formData, education: newEdu });
              }}
              required
            />
          </div>
        </section>

        {/* Skills */}
        <section className="section">
          <div className="section-title">Skills</div>
          <div className="input-group">
            <label className="label">Key Skills</label>
            <textarea 
              className="textarea"
              placeholder="Enter your key skills (e.g., Project Management, JavaScript, Communication)"
              value={formData.skills.join(', ')}
              onChange={(e) => {
                const skills = e.target.value.split(',').map(skill => skill.trim());
                setFormData({ ...formData, skills });
              }}
            />
            <p className="description-hint">Separate skills with commas</p>
          </div>
        </section>
      </div>

      {/* Form Footer */}
      <div className="p-8">
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full max-w-md mx-auto flex justify-center py-3 px-6 text-base font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Creating...</span>
            </div>
          ) : (
            'Create Resume'
          )}
        </button>
      </div>
    </form>
  );
} 