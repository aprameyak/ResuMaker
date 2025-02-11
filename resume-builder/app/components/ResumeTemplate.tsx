import React from 'react';

interface ResumeProps {
  data: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
    };
    experience: {
      company: string;
      position: string;
      startDate: string;
      endDate: string;
      description: string;
    }[];
    education: {
      school: string;
      degree: string;
      graduationDate: string;
    }[];
    skills: string[];
  };
}

export default function ResumeTemplate({ data }: ResumeProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{data.personalInfo.name}</h1>
        <p>{data.personalInfo.email} | {data.personalInfo.phone}</p>
        <p>{data.personalInfo.location}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold border-b-2 mb-3">Experience</h2>
        {data.experience.map((exp, index) => (
          <div key={index} className="mb-4">
            <h3 className="font-semibold">{exp.position}</h3>
            <p>{exp.company} | {exp.startDate} - {exp.endDate}</p>
            <p>{exp.description}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold border-b-2 mb-3">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <h3 className="font-semibold">{edu.school}</h3>
            <p>{edu.degree} | {edu.graduationDate}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold border-b-2 mb-3">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill, index) => (
            <span key={index} className="bg-gray-100 px-3 py-1 rounded">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 