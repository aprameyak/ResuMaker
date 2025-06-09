import { FormData, Experience, Education, Project, Skills, PersonalInfo } from '@/app/types';
import { geminiService, ResumeAnalysis, KeywordAnalysis, ContentSuggestion } from './geminiService';

export interface AnalysisResult {
  atsScore: number;
  keywordMatch: number;
  suggestions: string[];
  missingKeywords: string[];
  sectionScores: {
    [key: string]: number;
  };
}

export interface OptimizationResult {
  original: string;
  optimized: string;
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
    
    if (result.status === 'error') {
      throw new Error(`Failed to analyze section: ${result.error}`);
    }

    const suggestion = result.data;
    const impactScore = ResumeAnalyzer.calculateImpactScore(
      suggestion.original,
      suggestion.improved
    );

    return {
      original: suggestion.original,
      optimized: suggestion.improved,
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

  public static async analyzeResume(
    resume: FormData,
    jobDescription: string
  ): Promise<AnalysisResult> {
    const [keywordAnalysis, resumeAnalysis] = await Promise.all([
      geminiService.analyzeJobDescription(jobDescription),
      geminiService.analyzeResume(resume, jobDescription)
    ]);

    if (keywordAnalysis.status === 'error') {
      throw new Error(`Failed to analyze keywords: ${keywordAnalysis.error}`);
    }
    if (resumeAnalysis.status === 'error') {
      throw new Error(`Failed to analyze resume: ${resumeAnalysis.error}`);
    }

    const sectionScores: { [key: string]: number } = {};
    for (const [section, weight] of Object.entries(this.SECTION_WEIGHTS)) {
      const sectionContent = this.getSectionContent(section as keyof FormData, resume);
      if (sectionContent) {
        const allKeywords = [
          ...keywordAnalysis.data.essential,
          ...keywordAnalysis.data.preferred,
          ...keywordAnalysis.data.skills
        ];
        sectionScores[section] = this.calculateSectionScore(sectionContent, allKeywords);
      }
    }

    return {
      atsScore: resumeAnalysis.data.score,
      keywordMatch: resumeAnalysis.data.matchRate,
      suggestions: resumeAnalysis.data.suggestions.map(s => s.improved),
      missingKeywords: resumeAnalysis.data.keywords.missing,
      sectionScores
    };
  }

  public static async optimizeResume(
    resume: FormData,
    jobContext: { role: string; industry: string; level: string }
  ): Promise<Map<string, OptimizationResult>> {
    const optimizationResults = new Map<string, OptimizationResult>();
    
    for (const section of Object.keys(this.SECTION_WEIGHTS)) {
      const content = this.getSectionContent(section as keyof FormData, resume);
      if (content) {
        const result = await this.analyzeSection(content, jobContext);
        optimizationResults.set(section, result);
      }
    }

    return optimizationResults;
  }
} 