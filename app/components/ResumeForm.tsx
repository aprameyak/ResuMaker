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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
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
    setFormData((prevData) => ({
      ...prevData,
      experience: [...prevData.experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const addEducation = () => {
    setFormData((prevData) => ({
      ...prevData,
      education: [...prevData.education, { school: '', degree: '', graduationDate: '' }]
    }));
  };

  const addSkill = () => {
    setFormData((prevData) => ({
      ...prevData,
      skills: [...prevData.skills, '']
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Create Your Resume</h2>
        <p className="text-slate-600">Fill in your details below</p>
      </div>
      <div className="p-8 space-y-8">
        <section>
          <label>Full Name</label>
          <input 
            type="text" 
            value={formData.personalInfo.name} 
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, name: e.target.value }
            })} 
            required 
          />
        </section>
        <section>
          <label>Email</label>
          <input 
            type="email" 
            value={formData.personalInfo.email} 
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, email: e.target.value }
            })} 
            required 
          />
        </section>
        <section>
          <label>Phone</label>
          <input 
            type="tel" 
            value={formData.personalInfo.phone} 
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, phone: e.target.value }
            })} 
            required 
          />
        </section>

        {/* Experience Section */}
        <div>
          <h3 className="text-xl font-semibold">Experience</h3>
          {formData.experience.map((exp, index) => (
            <div key={index} className="space-y-2">
              <input 
                type="text" 
                placeholder="Company" 
                value={exp.company} 
                onChange={(e) => {
                  const newExperience = [...formData.experience];
                  newExperience[index].company = e.target.value;
                  setFormData({ ...formData, experience: newExperience });
                }} 
              />
              <input 
                type="text" 
                placeholder="Position" 
                value={exp.position} 
                onChange={(e) => {
                  const newExperience = [...formData.experience];
                  newExperience[index].position = e.target.value;
                  setFormData({ ...formData, experience: newExperience });
                }} 
              />
            </div>
          ))}
          <button type="button" onClick={addExperience} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">+ Add Experience</button>
        </div>

        {/* Education Section */}
        <div>
          <h3 className="text-xl font-semibold">Education</h3>
          {formData.education.map((edu, index) => (
            <div key={index} className="space-y-2">
              <input 
                type="text" 
                placeholder="School" 
                value={edu.school} 
                onChange={(e) => {
                  const newEducation = [...formData.education];
                  newEducation[index].school = e.target.value;
                  setFormData({ ...formData, education: newEducation });
                }} 
              />
              <input 
                type="text" 
                placeholder="Degree" 
                value={edu.degree} 
                onChange={(e) => {
                  const newEducation = [...formData.education];
                  newEducation[index].degree = e.target.value;
                  setFormData({ ...formData, education: newEducation });
                }} 
              />
            </div>
          ))}
          <button type="button" onClick={addEducation} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">+ Add Education</button>
        </div>

        {/* Skills Section */}
        <div>
          <h3 className="text-xl font-semibold">Skills</h3>
          {formData.skills.map((skill, index) => (
            <input 
              key={index} 
              type="text" 
              placeholder="Skill" 
              value={skill} 
              onChange={(e) => {
                const newSkills = [...formData.skills];
                newSkills[index] = e.target.value;
                setFormData({ ...formData, skills: newSkills });
              }} 
            />
          ))}
          <button type="button" onClick={addSkill} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">+ Add Skill</button>
        </div>

        <button type="submit" disabled={isGenerating} className="mt-4 px-6 py-3 bg-green-500 text-white rounded">
          {isGenerating ? "Generating..." : "Generate Resume"}
        </button>
      </div>
    </form>
  );
}
