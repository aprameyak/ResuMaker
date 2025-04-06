import React, { useState } from 'react';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  graduationDate: string;
}

interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  existingCV?: string;
}

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
    existingCV: ''
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
          let description = '';
          if (data.status === 'error') {
            description = data.error || 'Error generating description';
          } else if (typeof data.content === 'string' && data.content.trim() !== '') {
            description = data.content;
          } else {
            description = exp.description;
          }
          return {
            ...exp,
            description,
          };
        })
      );

      onSubmit({
        ...formData,
        experience: enhancedExperience,
      });
    } catch (error) {
      console.error('Error generating resume:', error);
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
      fontFamily: `'Segoe UI', sans-serif`,
      color: '#1f2937',
      maxWidth: '800px',
      margin: '0 auto'
    },
    section: {
      marginBottom: '2rem'
    },
    label: {
      display: 'block',
      fontWeight: 500,
      marginBottom: '0.5rem',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      backgroundColor: '#f9fafb'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      minHeight: '100px',
      backgroundColor: '#f9fafb',
      marginBottom: '1rem'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: '1rem',
      color: '#111827'
    },
    card: {
      backgroundColor: '#f3f4f6',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1rem',
      border: '1px solid #e5e7eb'
    },
    addButton: {
      backgroundColor: '#3b82f6',
      color: '#fff',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      marginTop: '0.5rem',
      transition: 'background 0.2s ease-in-out',
      outline: '2px solid transparent'
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
      marginTop: '2rem',
      width: '100%',
      transition: 'background 0.2s ease-in-out',
      outline: '2px solid transparent'
    },
    heading: {
      fontSize: '2rem',
      fontWeight: 700,
      textAlign: 'center' as const,
      marginBottom: '0.5rem'
    },
    subheading: {
      textAlign: 'center' as const,
      color: '#6b7280',
      marginBottom: '2rem'
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.heading}>Create Your Resume</h2>
      <p style={styles.subheading}>Fill in your details to build a polished resume</p>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Personal Information</h3>
        <label style={styles.label}>Full Name</label>
        <input
          style={styles.input}
          type="text"
          value={formData.personalInfo.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, name: e.target.value }
            })
          }
          required
          aria-required="true"
        />

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={formData.personalInfo.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, email: e.target.value }
            })
          }
          required
          aria-required="true"
        />

        <label style={styles.label}>Phone</label>
        <input
          style={styles.input}
          type="tel"
          value={formData.personalInfo.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, phone: e.target.value }
            })
          }
          required
          aria-required="true"
        />

        <label style={styles.label}>Location</label>
        <input
          style={styles.input}
          type="text"
          value={formData.personalInfo.location}
          onChange={(e) =>
            setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, location: e.target.value }
            })
          }
        />

        <label style={styles.label}>Professional Summary</label>
        <textarea
          style={styles.textarea}
          value={formData.personalInfo.summary}
          onChange={(e) =>
            setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, summary: e.target.value }
            })
          }
          aria-label="Professional Summary"
        />
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Experience</h3>
        {formData.experience.map((exp, index) => (
          <div key={index} style={styles.card}>
            <input
              style={styles.input}
              type="text"
              placeholder="Company"
              value={exp.company}
              onChange={(e) => {
                const updated = [...formData.experience];
                updated[index].company = e.target.value;
                setFormData({ ...formData, experience: updated });
              }}
              aria-label={`Company for experience ${index + 1}`}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Position"
              value={exp.position}
              onChange={(e) => {
                const updated = [...formData.experience];
                updated[index].position = e.target.value;
                setFormData({ ...formData, experience: updated });
              }}
              aria-label={`Position for experience ${index + 1}`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addExperience}
          style={styles.addButton}
          aria-label="Add new experience"
        >
          + Add Experience
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Education</h3>
        {formData.education.map((edu, index) => (
          <div key={index} style={styles.card}>
            <input
              style={styles.input}
              type="text"
              placeholder="School"
              value={edu.school}
              onChange={(e) => {
                const updated = [...formData.education];
                updated[index].school = e.target.value;
                setFormData({ ...formData, education: updated });
              }}
              aria-label={`School for education ${index + 1}`}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Degree"
              value={edu.degree}
              onChange={(e) => {
                const updated = [...formData.education];
                updated[index].degree = e.target.value;
                setFormData({ ...formData, education: updated });
              }}
              aria-label={`Degree for education ${index + 1}`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addEducation}
          style={styles.addButton}
          aria-label="Add new education"
        >
          + Add Education
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Skills</h3>
        {formData.skills.map((skill, index) => (
          <input
            key={index}
            style={styles.input}
            type="text"
            placeholder="Skill"
            value={skill}
            onChange={(e) => {
              const updated = [...formData.skills];
              updated[index] = e.target.value;
              setFormData({ ...formData, skills: updated });
            }}
            aria-label={`Skill ${index + 1}`}
          />
        ))}
        <button
          type="button"
          onClick={addSkill}
          style={styles.addButton}
          aria-label="Add new skill"
        >
          + Add Skill
        </button>
      </div>

      {/* Optional section for existing CV text */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Existing CV Text </h3>
        <textarea
          style={styles.textarea}
          placeholder="Paste your existing CV text here to provide more context..."
          value={formData.existingCV}
          onChange={(e) =>
            setFormData({
              ...formData,
              existingCV: e.target.value,
            })
          }
          aria-label="Existing CV Text (optional)"
        />
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        style={styles.submitButton}
        aria-label="Generate Resume"
      >
        {isGenerating ? 'Generating...' : 'Generate Resume'}
      </button>
    </form>
  );
}
