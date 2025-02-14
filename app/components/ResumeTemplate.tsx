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

  const handleEdit = (section: keyof FormData, value: any) => {
    if (!onEdit) return;
    onEdit({
      ...data,
      [section]: value
    });
  };

  return (
    <div className="resume-container">
      <div className="resume-actions">
        <button onClick={exportToPDF} className="button">
          Download PDF
        </button>
      </div>

      <div ref={resumeRef} className="resume-content">
        <div className="resume-header">
          {isEditable ? (
            <input
              value={data.personalInfo.name}
              onChange={(e) => handleEdit('personalInfo', { ...data.personalInfo, name: e.target.value })}
              className="resume-edit-input"
            />
          ) : (
            <h1>{data.personalInfo.name}</h1>
          )}
          <div className="contact-info">
            <p>{data.personalInfo.email} | {data.personalInfo.phone}</p>
            <p>{data.personalInfo.location}</p>
          </div>
        </div>

        <div className="resume-section">
          <h2>Professional Summary</h2>
          {isEditable ? (
            <textarea
              value={data.personalInfo.summary}
              onChange={(e) => handleEdit('personalInfo', { ...data.personalInfo, summary: e.target.value })}
              className="resume-edit-textarea"
            />
          ) : (
            <p>{data.personalInfo.summary}</p>
          )}
        </div>

        <div className="resume-section">
          <h2>Experience</h2>
          {data.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              {isEditable ? (
                <>
                  <input
                    value={exp.position}
                    onChange={(e) => {
                      const newExp = [...data.experience];
                      newExp[index] = { ...exp, position: e.target.value };
                      handleEdit('experience', newExp);
                    }}
                    className="resume-edit-input"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...data.experience];
                      newExp[index] = { ...exp, company: e.target.value };
                      handleEdit('experience', newExp);
                    }}
                    className="resume-edit-input"
                  />
                </>
              ) : (
                <>
                  <h3>{exp.position}</h3>
                  <h4>{exp.company}</h4>
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
                  className="resume-edit-textarea"
                />
              ) : (
                <p>{exp.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="resume-section">
          <h2>Skills</h2>
          {isEditable ? (
            <input
              value={data.skills.join(', ')}
              onChange={(e) => handleEdit('skills', e.target.value.split(', '))}
              className="resume-edit-input"
            />
          ) : (
            <p>{data.skills.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
} 