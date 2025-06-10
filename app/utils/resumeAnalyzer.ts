import { FormData, Experience, Education, Project, Skills, PersonalInfo } from '@/app/types';
import { geminiService, ResumeAnalysis, KeywordAnalysis, ContentSuggestion } from './geminiService';

export interface AnalysisResult {
  atsScore: number;
  sectionScores: {
    [key: string]: number;
  };
  missingKeywords: string[];
  suggestions: ContentSuggestion[];
}

export interface OptimizationResult {
  original: string;
  improved: string;
  explanation: string;
  impactScore: number;
}

export class ResumeAnalyzer {
  private static readonly SECTION_WEIGHTS = {
    experience: 0.4,
    skills: 0.3,
    education: 0.2,
    projects: 0.1
  };

  private static calculateSectionScore(
    sectionContent: string,
    keywords: string[]
  ): number {
    const contentLower = sectionContent.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    return (matchedKeywords.length / keywords.length) * 100;
  }

  private static async analyzeSection(
    sectionContent: string,
    context: { role: string; industry: string; level: string }
  ): Promise<OptimizationResult> {
    const result = await geminiService.improveContent(sectionContent, context);
    
    if (result.status === 'error' || !result.data) {
      throw new Error(`Failed to analyze section: ${result.error || 'No data returned'}`);
    }

    const suggestion = result.data;
    const impactScore = ResumeAnalyzer.calculateImpactScore(
      suggestion.original,
      suggestion.improved
    );

    return {
      original: suggestion.original,
      improved: suggestion.improved,
      explanation: suggestion.reasoning,
      impactScore
    };
  }

  private static calculateImpactScore(
    original: string,
    improved: string
  ): number {
    const originalWords = original.split(/\s+/).length;
    const improvedWords = improved.split(/\s+/).length;
    const lengthScore = Math.min(improvedWords / originalWords, 1.5) * 0.3;

    const actionVerbs = [
      'achieved', 'implemented', 'developed', 'led', 'managed',
      'created', 'designed', 'improved', 'increased', 'reduced'
    ];
    const originalActionVerbs = actionVerbs.filter(verb => 
      original.toLowerCase().includes(verb)
    ).length;
    const improvedActionVerbs = actionVerbs.filter(verb => 
      improved.toLowerCase().includes(verb)
    ).length;
    const verbScore = (improvedActionVerbs - originalActionVerbs) * 0.4;

    const metricsPattern = /\d+%|\$\d+|\d+ [a-zA-Z]+/g;
    const originalMetrics = (original.match(metricsPattern) || []).length;
    const improvedMetrics = (improved.match(metricsPattern) || []).length;
    const metricScore = (improvedMetrics - originalMetrics) * 0.3;

    return Math.min(Math.max((lengthScore + verbScore + metricScore) * 100, 0), 100);
  }

  private static getSectionContent(section: keyof FormData, data: FormData): string {
    const content = data[section];
    if (Array.isArray(content)) {
      return content.map(item => {
        if (typeof item === 'string') return item;
        return Object.values(item).join(' ');
      }).join('\n');
    }
    if (typeof content === 'object' && content !== null) {
      return Object.values(content).join(' ');
    }
    return String(content || '');
  }

  static async analyzeResume(resume: FormData, jobDescription: string): Promise<AnalysisResult> {
    try {
      const analysis = await geminiService.analyzeResume(resume, jobDescription);
      
      if (analysis.status === 'error' || !analysis.data) {
        throw new Error(analysis.error || 'Failed to analyze resume');
      }

      return {
        atsScore: analysis.data.score,
        sectionScores: {
          experience: 0.8,
          education: 0.9,
          skills: 0.7,
          projects: 0.85
        },
        missingKeywords: analysis.data.keywords.missing,
        suggestions: analysis.data.suggestions
      };
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  }

  static async optimizeResume(
    resume: FormData,
    context: { role: string; industry: string; level: string }
  ): Promise<Map<keyof FormData, ContentSuggestion>> {
    const optimizations = new Map<keyof FormData, ContentSuggestion>();

    try {
      // Optimize each section
      for (const [section, content] of Object.entries(resume)) {
        if (typeof content === 'string') {
          const result = await geminiService.improveContent(content, context);
          if (result.status === 'success' && result.data) {
            optimizations.set(section as keyof FormData, result.data);
          }
        }
      }

      return optimizations;
    } catch (error) {
      console.error('Error optimizing resume:', error);
      throw error;
    }
  }
} 