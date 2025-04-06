import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FormData } from '@/app/types';

interface ResumeTemplateProps {
  data: FormData;
  isEditable?: boolean;
  onEdit?: (newData: FormData) => void;
}

export default function ResumeTemplate({ data, isEditable = false, onEdit }: ResumeTemplateProps) {
  const resumeRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!resumeRef.current) return;
    const canvas = await html2canvas(resumeRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('resume.pdf');
  };

  const handleEdit = <K extends keyof FormData>(section: K, value: FormData[K]) => {
    if (!onEdit) return;
    onEdit({
      ...data,
      [section]: value,
    });
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '2rem auto',
      padding: '1rem',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#1f2937',
    },
    actions: {
      textAlign: 'right' as const,
      marginBottom: '1rem',
    },
    actionButton: {
      backgroundColor: '#10b981',
      color: '#fff',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      // For keyboard accessibility:
      outline: '2px solid transparent',
    },
    header: {
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '1rem',
      marginBottom: '1rem',
    },
    nameInput: {
      fontSize: '2rem',
      fontWeight: 700,
      border: 'none',
      borderBottom: '1px solid #e5e7eb',
      outline: 'none',
      width: '100%',
      marginBottom: '0.5rem',
    },
    resumeTitle: {
      fontSize: '2rem',
      fontWeight: 700,
      marginBottom: '0.5rem',
    },
    contactInfo: {
      color: '#6b7280',
      fontSize: '0.9rem',
    },
    section: {
      marginBottom: '1.5rem',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '0.5rem',
      marginBottom: '1rem',
    },
    editInput: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '5px',
      marginBottom: '0.5rem',
    },
    editTextarea: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '5px',
      marginBottom: '0.5rem',
      minHeight: '80px',
    },
    experienceItem: {
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '1rem',
      border: '1px solid #e5e7eb',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.actions}>
        <button
          onClick={exportToPDF}
          style={styles.actionButton}
          aria-label="Download resume as PDF"
        >
          Download PDF
        </button>
      </div>
      <div ref={resumeRef} role="document">
        <header style={styles.header}>
          {isEditable ? (
            <input
              value={data.personalInfo.name}
              onChange={(e) =>
                handleEdit('personalInfo', { ...data.personalInfo, name: e.target.value })
              }
              style={styles.nameInput}
              aria-label="Edit full name"
            />
          ) : (
            <h1 style={styles.resumeTitle}>{data.personalInfo.name}</h1>
          )}
          <div style={styles.contactInfo}>
            <p>
              {data.personalInfo.email} | {data.personalInfo.phone}
            </p>
            <p>{data.personalInfo.location}</p>
          </div>
        </header>

        <section style={styles.section} aria-labelledby="summary-heading">
          <h2 style={styles.sectionTitle} id="summary-heading">
            Professional Summary
          </h2>
          {isEditable ? (
            <textarea
              value={data.personalInfo.summary}
              onChange={(e) =>
                handleEdit('personalInfo', { ...data.personalInfo, summary: e.target.value })
              }
              style={styles.editTextarea}
              aria-label="Edit professional summary"
            />
          ) : (
            <p>{data.personalInfo.summary}</p>
          )}
        </section>

        <section style={styles.section} aria-labelledby="experience-heading">
          <h2 style={styles.sectionTitle} id="experience-heading">
            Experience
          </h2>
          {data.experience.map((exp, index) => (
            <div key={index} style={styles.experienceItem}>
              {isEditable ? (
                <>
                  <input
                    value={exp.position}
                    onChange={(e) => {
                      const newExp = [...data.experience];
                      newExp[index] = { ...exp, position: e.target.value };
                      handleEdit('experience', newExp);
                    }}
                    style={styles.editInput}
                    aria-label={`Edit position for experience ${index + 1}`}
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...data.experience];
                      newExp[index] = { ...exp, company: e.target.value };
                      handleEdit('experience', newExp);
                    }}
                    style={styles.editInput}
                    aria-label={`Edit company for experience ${index + 1}`}
                  />
                </>
              ) : (
                <>
                  <h3 style={{ margin: '0.5rem 0' }}>{exp.position}</h3>
                  <h4 style={{ margin: '0.5rem 0', color: '#6b7280' }}>{exp.company}</h4>
                </>
              )}
              {isEditable ? (
                <textarea
                  value={exp.description}
                  onChange={(e) => {
                    const newExp = [...data.experience];
                    newExp[index] = { ...exp, description: e.target.value };
                    handleEdit('experience', newExp);
                  }}
                  style={styles.editTextarea}
                  aria-label={`Edit description for experience ${index + 1}`}
                />
              ) : (
                <p>{exp.description}</p>
              )}
            </div>
          ))}
        </section>

        <section style={styles.section} aria-labelledby="skills-heading">
          <h2 style={styles.sectionTitle} id="skills-heading">
            Skills
          </h2>
          {isEditable ? (
            <input
              value={data.skills.join(', ')}
              onChange={(e) => handleEdit('skills', e.target.value.split(', '))}
              style={styles.editInput}
              aria-label="Edit skills (comma separated)"
            />
          ) : (
            <p>{data.skills.join(', ')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
