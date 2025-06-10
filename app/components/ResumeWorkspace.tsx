import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  FormData,
  EditorState,
  AnalysisState,
  SaveState,
  ResumeTemplate,
  ATSScore,
  JobMatch,
  PersonalInfo,
  Skills,
  EditorMode
} from '../types';
import { ResumeParser } from './ResumeParser';
import { ResumeAnalyzer } from '../utils/resumeAnalyzer';
import { GeminiService } from '../utils/geminiService';

interface ResumeWorkspaceProps {
  initialData?: FormData;
  templates: ResumeTemplate[];
  onSave?: (data: FormData) => Promise<void>;
  onAnalyze?: (score: ATSScore) => void;
  onJobMatch?: (matches: JobMatch[]) => void;
}

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  fullName: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  portfolio: '',
  linkedin: '',
  github: ''
};

const DEFAULT_SKILLS: Skills = {
  technical: [],
  soft: [],
  languages: [],
  certifications: []
};

const DEFAULT_FORM_DATA: FormData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: ''
  },
  education: [],
  experience: [],
  skills: {
    technical: [],
    soft: [],
    languages: [],
    certifications: []
  },
  projects: []
};

export const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({
  initialData,
  templates,
  onSave,
  onAnalyze,
  onJobMatch
}) => {
  const [formData, setFormData] = useState<FormData>(() => initialData || DEFAULT_FORM_DATA);
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    mode: 'edit',
    isDirty: false
  }));
  const [analysisState, setAnalysisState] = useState<AnalysisState>(() => ({
    isAnalyzing: false,
    error: undefined
  }));
  const [saveState, setSaveState] = useState<SaveState>(() => ({
    lastSaved: null,
    isSaving: false,
    error: undefined
  }));
  const [jobDescription, setJobDescription] = useState<string>('');

  const handleFormChange = useCallback((
    section: keyof FormData,
    value: FormData[keyof FormData]
  ) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [section]: value
    }));
    setEditorState((prev: EditorState) => ({
      ...prev,
      isDirty: true
    }));
  }, []);

  const handleTemplateChange = useCallback((template: ResumeTemplate) => {
    setEditorState((prev: EditorState) => ({
      ...prev,
      selectedTemplate: template
    }));
  }, []);

  const handleModeChange = useCallback((mode: EditorMode) => {
    setEditorState((prev: EditorState) => ({
      ...prev,
      mode
    }));
  }, []);

  const handleJobDescriptionChange = useCallback((description: string) => {
    setJobDescription(description);
  }, []);

  const analyzeResume = useCallback(async () => {
    if (!jobDescription) {
      setAnalysisState(prev => ({
        ...prev,
        error: 'Please provide a job description for analysis'
      }));
      return;
    }

    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: undefined
    }));

    try {
      const result = await ResumeAnalyzer.analyzeResume(formData, jobDescription);
      
      const atsScore: ATSScore = {
        overall: result.atsScore,
        sections: result.sectionScores,
        keywords: {
          matched: [],
          missing: result.missingKeywords
        },
        suggestions: result.suggestions.map(s => s.improved)
      };

      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        atsScore,
        error: undefined
      }));

      if (onAnalyze) {
        onAnalyze(atsScore);
      }
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to analyze resume'
      }));
    }
  }, [formData, jobDescription, onAnalyze]);

  const optimizeResume = useCallback(async () => {
    if (!jobDescription) {
      setAnalysisState(prev => ({
        ...prev,
        error: 'Please provide a job description for optimization'
      }));
      return;
    }

    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: undefined
    }));

    try {
      const optimizationResults = await ResumeAnalyzer.optimizeResume(formData, {
        role: formData.personalInfo.title,
        industry: 'technology', // This should be determined from job description
        level: 'mid-level' // This should be determined from job description
      });

      const updatedFormData = { ...formData };
      for (const [section, result] of optimizationResults.entries()) {
        if (section in updatedFormData) {
          // Type assertion needed here as we know the section exists
          (updatedFormData[section as keyof FormData] as any) = result.improved;
        }
      }

      setFormData(updatedFormData);
      setEditorState(prev => ({
        ...prev,
        isDirty: true
      }));
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to optimize resume'
      }));
    }
  }, [formData, jobDescription]);

  const saveResume = useCallback(async () => {
    if (!onSave) return;

    setSaveState(prev => ({
      ...prev,
      isSaving: true,
      error: undefined
    }));

    try {
      await onSave(formData);
      setSaveState({
        lastSaved: new Date(),
        isSaving: false
      });
      setEditorState(prev => ({
        ...prev,
        isDirty: false
      }));
    } catch (error) {
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save resume'
      }));
    }
  }, [formData, onSave]);

  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (editorState.isDirty && onSave) {
        saveResume();
      }
    }, 30000); // Autosave every 30 seconds if changes exist

    return () => clearInterval(autosaveInterval);
  }, [editorState.isDirty, onSave, saveResume]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6"
          >
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Resume Builder</h2>

                <div className="space-y-6">
                  {/* Analysis Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">ATS Analysis</h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={analyzeResume}
                        disabled={analysisState.isAnalyzing}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        {analysisState.isAnalyzing ? 'Analyzing...' : 'Analyze'}
                      </button>
                      <button
                        onClick={optimizeResume}
                        disabled={analysisState.isAnalyzing}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        {analysisState.isAnalyzing ? 'Optimizing...' : 'Optimize'}
                      </button>
                    </div>

                    {analysisState.error && (
                      <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                        {analysisState.error}
                      </div>
                    )}

                    {analysisState.atsScore && (
                      <div className="p-4 bg-white rounded-md shadow">
                        <h3 className="text-lg font-semibold mb-4">ATS Analysis</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Overall Score</p>
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${analysisState.atsScore.overall}%` }}
                              />
                            </div>
                          </div>

                          {Object.entries(analysisState.atsScore.sections).map(([section, score]) => (
                            <div key={section}>
                              <p className="text-sm text-gray-600">
                                {section.charAt(0).toUpperCase() + section.slice(1)}
                              </p>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ))}

                          {analysisState.atsScore.keywords.missing.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Missing Keywords</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {analysisState.atsScore.keywords.missing.map((keyword) => (
                                  <span
                                    key={keyword}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisState.atsScore.suggestions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Suggestions</p>
                              <ul className="mt-2 space-y-2">
                                {analysisState.atsScore.suggestions.map((suggestion, index) => (
                                  <li key={index} className="text-sm text-gray-600">
                                    • {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};