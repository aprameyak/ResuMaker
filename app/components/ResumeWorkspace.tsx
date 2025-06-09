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
import { geminiService } from '../utils/geminiService';

interface ResumeWorkspaceProps {
  initialData?: FormData;
  templates: ResumeTemplate[];
  onSave?: (data: FormData) => Promise<void>;
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
  personalInfo: DEFAULT_PERSONAL_INFO,
  experience: [],
  education: [],
  projects: [],
  skills: DEFAULT_SKILLS
};

export const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({
  initialData,
  templates,
  onSave
}) => {
  const [formData, setFormData] = useState<FormData>(initialData || DEFAULT_FORM_DATA);
  const [editorState, setEditorState] = useState<EditorState>({
    mode: 'edit',
    isDirty: false
  });
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false
  });
  const [saveState, setSaveState] = useState<SaveState>({
    lastSaved: null,
    isSaving: false
  });
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
      
      setAnalysisState(prev => ({
        ...prev,
        atsScore: {
          overall: result.atsScore,
          sections: result.sectionScores,
          keywords: {
            matched: [],
            missing: result.missingKeywords
          },
          suggestions: result.suggestions
        },
        isAnalyzing: false
      }));
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to analyze resume'
      }));
    }
  }, [formData, jobDescription]);

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
          (updatedFormData[section as keyof FormData] as any) = result.optimized;
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
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => handleModeChange('edit')}
            className={`px-4 py-2 rounded-md ${
              editorState.mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => handleModeChange('preview')}
            className={`px-4 py-2 rounded-md ${
              editorState.mode === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => handleModeChange('analyze')}
            className={`px-4 py-2 rounded-md ${
              editorState.mode === 'analyze' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            Analyze
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {saveState.lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {saveState.lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={saveResume}
            disabled={saveState.isSaving || !editorState.isDirty}
            className={`px-4 py-2 rounded-md ${
              saveState.isSaving || !editorState.isDirty
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {saveState.isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {editorState.mode === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              {/* Form sections go here */}
            </motion.div>
          )}

          {editorState.mode === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              {/* Preview component goes here */}
            </motion.div>
          )}

          {editorState.mode === 'analyze' && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => handleJobDescriptionChange(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full h-40 p-4 border rounded-md"
                  />
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
                </div>

                <div className="space-y-4">
                  {analysisState.error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-md">
                      {analysisState.error}
                    </div>
                  )}

                  {analysisState.atsScore && (
                    <div className="p-4 bg-white rounded-md shadow">
                      <h3 className="text-lg font-semibold mb-4">ATS Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Overall Score</p>
                          <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
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
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 