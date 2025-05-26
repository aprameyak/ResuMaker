import React, { useState } from 'react';
import AIResumeEditor from './AIResumeEditor';
import { FormData } from '@/app/types';

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
    skills: [''],
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', graduationDate: '' }]
    }));
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  const styles = {
    form: {
      padding: '2rem',
      fontFamily: "'Segoe UI', sans-serif",
      color: '#1f2937',
      maxWidth: '800px',
      margin: '0 auto'
    },
    section: {
      marginBottom: '2rem',
      backgroundColor: '#ffffff',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: '1rem',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addButton: {
      backgroundColor: '#3b82f6',
      color: '#fff',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    submitButton: {
      backgroundColor: '#10b981',
      color: '#fff',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
      width: '100%',
      marginTop: '2rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
    },
    experienceItem: {
      backgroundColor: '#f9fafb',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Personal Information</h2>
        <input
          style={styles.input}
          type="text"
          placeholder="Full Name"
          value={formData.personalInfo.name}
          onChange={(e) => setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, name: e.target.value }
          })}
          required
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={formData.personalInfo.email}
          onChange={(e) => setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, email: e.target.value }
          })}
          required
        />
        <input
          style={styles.input}
          type="tel"
          placeholder="Phone"
          value={formData.personalInfo.phone}
          onChange={(e) => setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, phone: e.target.value }
          })}
          required
        />
        <input
          style={styles.input}
          type="text"
          placeholder="Location"
          value={formData.personalInfo.location}
          onChange={(e) => setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, location: e.target.value }
          })}
          required
        />
        <AIResumeEditor
          section="summary"
          content={formData.personalInfo.summary}
          onUpdate={(newContent) => setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, summary: newContent }
          })}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <h2>Experience</h2>
          <button type="button" onClick={addExperience} style={styles.addButton}>
            Add Experience
          </button>
        </div>
        {formData.experience.map((exp, index) => (
          <div key={index} style={styles.experienceItem}>
            <input
              style={styles.input}
              type="text"
              placeholder="Company"
              value={exp.company}
              onChange={(e) => {
                const newExp = [...formData.experience];
                newExp[index] = { ...exp, company: e.target.value };
                setFormData({ ...formData, experience: newExp });
              }}
              required
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Position"
              value={exp.position}
              onChange={(e) => {
                const newExp = [...formData.experience];
                newExp[index] = { ...exp, position: e.target.value };
                setFormData({ ...formData, experience: newExp });
              }}
              required
            />
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                style={{ ...styles.input, marginBottom: 0 }}
                type="date"
                placeholder="Start Date"
                value={exp.startDate}
                onChange={(e) => {
                  const newExp = [...formData.experience];
                  newExp[index] = { ...exp, startDate: e.target.value };
                  setFormData({ ...formData, experience: newExp });
                }}
                required
              />
              <input
                style={{ ...styles.input, marginBottom: 0 }}
                type="date"
                placeholder="End Date"
                value={exp.endDate}
                onChange={(e) => {
                  const newExp = [...formData.experience];
                  newExp[index] = { ...exp, endDate: e.target.value };
                  setFormData({ ...formData, experience: newExp });
                }}
              />
            </div>
            <AIResumeEditor
              section="experience"
              content={exp.description}
              onUpdate={(newContent) => {
                const newExp = [...formData.experience];
                newExp[index] = { ...exp, description: newContent };
                setFormData({ ...formData, experience: newExp });
              }}
            />
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <h2>Education</h2>
          <button type="button" onClick={addEducation} style={styles.addButton}>
            Add Education
          </button>
        </div>
        {formData.education.map((edu, index) => (
          <div key={index} style={styles.experienceItem}>
            <input
              style={styles.input}
              type="text"
              placeholder="School"
              value={edu.school}
              onChange={(e) => {
                const newEdu = [...formData.education];
                newEdu[index] = { ...edu, school: e.target.value };
                setFormData({ ...formData, education: newEdu });
              }}
              required
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Degree"
              value={edu.degree}
              onChange={(e) => {
                const newEdu = [...formData.education];
                newEdu[index] = { ...edu, degree: e.target.value };
                setFormData({ ...formData, education: newEdu });
              }}
              required
            />
            <input
              style={styles.input}
              type="date"
              placeholder="Graduation Date"
              value={edu.graduationDate}
              onChange={(e) => {
                const newEdu = [...formData.education];
                newEdu[index] = { ...edu, graduationDate: e.target.value };
                setFormData({ ...formData, education: newEdu });
              }}
              required
            />
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <h2>Skills</h2>
          <button type="button" onClick={addSkill} style={styles.addButton}>
            Add Skill
          </button>
        </div>
        <AIResumeEditor
          section="skills"
          content={formData.skills.join(', ')}
          onUpdate={(newContent) => setFormData({
            ...formData,
            skills: newContent.split(',').map(skill => skill.trim()).filter(Boolean)
          })}
        />
      </div>

      <button
        type="submit"
        style={styles.submitButton}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating Resume...' : 'Generate Resume'}
      </button>
    </form>
  );
}
