import React, { useState } from 'react';
import AIResumeEditor from './AIResumeEditor';
import { FormData } from '@/app/types';

interface FormErrors {
  [key: string]: string;
}

export default function ResumeForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate personal info
    if (!formData.personalInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.personalInfo.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.personalInfo.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.personalInfo.summary.trim()) {
      newErrors.summary = 'Professional summary is required';
    }

    // Validate experience
    formData.experience.forEach((exp, index) => {
      if (!exp.company.trim()) {
        newErrors[`experience_${index}_company`] = 'Company is required';
      }
      if (!exp.position.trim()) {
        newErrors[`experience_${index}_position`] = 'Position is required';
      }
      if (!exp.startDate) {
        newErrors[`experience_${index}_startDate`] = 'Start date is required';
      }
      if (!exp.description.trim()) {
        newErrors[`experience_${index}_description`] = 'Description is required';
      }
    });

    // Validate education
    formData.education.forEach((edu, index) => {
      if (!edu.school.trim()) {
        newErrors[`education_${index}_school`] = 'School is required';
      }
      if (!edu.degree.trim()) {
        newErrors[`education_${index}_degree`] = 'Degree is required';
      }
      if (!edu.graduationDate) {
        newErrors[`education_${index}_graduationDate`] = 'Graduation date is required';
      }
    });

    // Validate skills
    if (formData.skills.length === 0 || !formData.skills[0].trim()) {
      newErrors.skills = 'At least one skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsGenerating(true);
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to generate resume. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const addExperience = () => {
    if (formData.experience.length >= 10) {
      setErrors({ experience: 'Maximum 10 experiences allowed' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const removeExperience = (index: number) => {
    if (formData.experience.length <= 1) {
      setErrors({ experience: 'At least one experience is required' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    if (formData.education.length >= 5) {
      setErrors({ education: 'Maximum 5 education entries allowed' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', graduationDate: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    if (formData.education.length <= 1) {
      setErrors({ education: 'At least one education entry is required' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (formData.skills.length >= 20) {
      setErrors({ skills: 'Maximum 20 skills allowed' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  const removeSkill = (index: number) => {
    if (formData.skills.length <= 1) {
      setErrors({ skills: 'At least one skill is required' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
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
    error: {
      color: '#dc2626',
      fontSize: '0.875rem',
      marginTop: '0.25rem',
    },
    errorField: {
      borderColor: '#dc2626',
    },
    removeButton: {
      backgroundColor: '#dc2626',
      color: '#fff',
      padding: '0.25rem 0.5rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.75rem',
    },
    sectionError: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      padding: '0.5rem',
      borderRadius: '4px',
      marginBottom: '1rem',
    },
    loadingOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    loadingContent: {
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '8px',
      textAlign: 'center' as const,
    },
  };

  return (
    <>
      {isGenerating && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <svg
              className="animate-spin"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
            </svg>
            <p style={{ marginTop: '1rem' }}>Generating your resume...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {errors.submit && (
          <div style={styles.sectionError}>{errors.submit}</div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Personal Information</h2>
          <input
            style={{
              ...styles.input,
              ...(errors.name ? styles.errorField : {})
            }}
            type="text"
            placeholder="Full Name"
            value={formData.personalInfo.name}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, name: '' }));
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, name: e.target.value }
              });
            }}
            data-error={!!errors.name}
            required
          />
          {errors.name && <div style={styles.error}>{errors.name}</div>}

          <input
            style={{
              ...styles.input,
              ...(errors.email ? styles.errorField : {})
            }}
            type="email"
            placeholder="Email"
            value={formData.personalInfo.email}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, email: '' }));
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, email: e.target.value }
              });
            }}
            data-error={!!errors.email}
            required
          />
          {errors.email && <div style={styles.error}>{errors.email}</div>}

          <input
            style={{
              ...styles.input,
              ...(errors.phone ? styles.errorField : {})
            }}
            type="tel"
            placeholder="Phone"
            value={formData.personalInfo.phone}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, phone: '' }));
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, phone: e.target.value }
              });
            }}
            data-error={!!errors.phone}
            required
          />
          {errors.phone && <div style={styles.error}>{errors.phone}</div>}

          <input
            style={{
              ...styles.input,
              ...(errors.location ? styles.errorField : {})
            }}
            type="text"
            placeholder="Location"
            value={formData.personalInfo.location}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, location: '' }));
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, location: e.target.value }
              });
            }}
            data-error={!!errors.location}
            required
          />
          {errors.location && <div style={styles.error}>{errors.location}</div>}

          <AIResumeEditor
            section="summary"
            content={formData.personalInfo.summary}
            onUpdate={(newContent) => {
              setErrors((prev) => ({ ...prev, summary: '' }));
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, summary: newContent }
              });
            }}
          />
          {errors.summary && <div style={styles.error}>{errors.summary}</div>}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <h2>Experience</h2>
            <button 
              type="button" 
              onClick={addExperience} 
              style={styles.addButton}
              disabled={formData.experience.length >= 10}
            >
              Add Experience
            </button>
          </div>
          {errors.experience && <div style={styles.sectionError}>{errors.experience}</div>}
          
          {formData.experience.map((exp, index) => (
            <div key={index} style={styles.experienceItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Experience {index + 1}</h3>
                {formData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    style={styles.removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
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
                data-error={!!errors[`experience_${index}_company`]}
                required
              />
              {errors[`experience_${index}_company`] && <div style={styles.error}>{errors[`experience_${index}_company`]}</div>}

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
                data-error={!!errors[`experience_${index}_position`]}
                required
              />
              {errors[`experience_${index}_position`] && <div style={styles.error}>{errors[`experience_${index}_position`]}</div>}

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
                  data-error={!!errors[`experience_${index}_startDate`]}
                  required
                />
                {errors[`experience_${index}_startDate`] && <div style={styles.error}>{errors[`experience_${index}_startDate`]}</div>}

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
              {errors[`experience_${index}_endDate`] && <div style={styles.error}>{errors[`experience_${index}_endDate`]}</div>}

              <AIResumeEditor
                section="experience"
                content={exp.description}
                onUpdate={(newContent) => {
                  const newExp = [...formData.experience];
                  newExp[index] = { ...exp, description: newContent };
                  setFormData({ ...formData, experience: newExp });
                }}
                data-error={!!errors[`experience_${index}_description`]}
              />
              {errors[`experience_${index}_description`] && <div style={styles.error}>{errors[`experience_${index}_description`]}</div>}
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <h2>Education</h2>
            <button 
              type="button" 
              onClick={addEducation} 
              style={styles.addButton}
              disabled={formData.education.length >= 5}
            >
              Add Education
            </button>
          </div>
          {errors.education && <div style={styles.sectionError}>{errors.education}</div>}
          
          {formData.education.map((edu, index) => (
            <div key={index} style={styles.experienceItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Education {index + 1}</h3>
                {formData.education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    style={styles.removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
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
                data-error={!!errors[`education_${index}_school`]}
                required
              />
              {errors[`education_${index}_school`] && <div style={styles.error}>{errors[`education_${index}_school`]}</div>}

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
                data-error={!!errors[`education_${index}_degree`]}
                required
              />
              {errors[`education_${index}_degree`] && <div style={styles.error}>{errors[`education_${index}_degree`]}</div>}

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
                data-error={!!errors[`education_${index}_graduationDate`]}
                required
              />
              {errors[`education_${index}_graduationDate`] && <div style={styles.error}>{errors[`education_${index}_graduationDate`]}</div>}
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <h2>Skills</h2>
            <button 
              type="button" 
              onClick={addSkill} 
              style={styles.addButton}
              disabled={formData.skills.length >= 20}
            >
              Add Skill
            </button>
          </div>
          {errors.skills && <div style={styles.sectionError}>{errors.skills}</div>}
          
          <AIResumeEditor
            section="skills"
            content={formData.skills.join(', ')}
            onUpdate={(newContent) => {
              setErrors((prev) => ({ ...prev, skills: '' }));
              setFormData({
                ...formData,
                skills: newContent.split(',').map(skill => skill.trim()).filter(Boolean)
              });
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.submitButton,
            opacity: isGenerating ? 0.7 : 1,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
          }}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating Resume...' : 'Generate Resume'}
        </button>
      </form>
    </>
  );
}
