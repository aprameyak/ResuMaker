'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ResumeEditor from '../components/ResumeEditor';
import { SECTION_TYPES } from '../constants';

export default function CreatePage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [sections, setSections] = useState([
    {
      id: '1',
      type: SECTION_TYPES.SUMMARY,
      title: 'Professional Summary',
      content: ''
    }
  ]);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  const handleUpdate = (section, content) => {
    setSections(sections.map(s => 
      s.id === section.id ? { ...s, content } : s
    ));
  };

  const handleAdd = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      content: ''
    };
    setSections([...sections, newSection]);
  };

  const handleDelete = (section) => {
    setSections(sections.filter(s => s.id !== section.id));
  };

  if (!isLoaded || !userId) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-8">Create Your Resume</h1>
        <ResumeEditor 
          sections={sections}
          onUpdate={handleUpdate}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
} 