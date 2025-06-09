import { FormData, Experience, Education, Skills, Project, PersonalInfo } from '@/app/types';

interface ATSScore {
  overall: number;
  sections: {
    keywords: {
      score: number;
      matches: string[];
      missing: string[];
    };
    formatting: {
      score: number;
      issues: string[];
    };
    content: {
      score: number;
      suggestions: string[];
    };
  };
  recommendations: string[];
}

interface KeywordAnalysis {
  essential: string[];
  preferred: string[];
  skills: string[];
  industry: string[];
}

export async function analyzeATS(resume: FormData, jobDescription: string): Promise<ATSScore> {
  // Extract keywords from job description
  const keywords = await extractKeywords(jobDescription);
  
  // Analyze resume content
  const resumeText = convertResumeToText(resume);
  
  // Calculate keyword matches
  const keywordMatches = analyzeKeywordMatches(resumeText, keywords);
  
  // Check formatting
  const formattingScore = analyzeFormatting(resume);
  
  // Analyze content quality
  const contentScore = analyzeContent(resume, jobDescription);
  
  // Calculate overall score
  const overall = calculateOverallScore(keywordMatches.score, formattingScore.score, contentScore.score);
  
  return {
    overall,
    sections: {
      keywords: keywordMatches,
      formatting: formattingScore,
      content: contentScore
    },
    recommendations: generateRecommendations(keywordMatches, formattingScore, contentScore)
  };
}

async function extractKeywords(jobDescription: string): Promise<KeywordAnalysis> {
  // Use AI to extract and categorize keywords from job description
  const response = await fetch('/api/analyze-job-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: jobDescription })
  });
  
  const analysis = await response.json();
  return analysis.keywords;
}

function convertResumeToText(resume: FormData): string {
  let text = '';
  
  // Personal Info
  const { personalInfo } = resume;
  text += `${personalInfo.fullName}\n${personalInfo.title}\n${personalInfo.email}\n${personalInfo.phone}\n${personalInfo.location}\n\n`;
  
  // Experience
  text += 'EXPERIENCE\n';
  resume.experience.forEach(exp => {
    text += `${exp.position} at ${exp.company}\n`;
    text += `${exp.startDate} - ${exp.endDate}\n`;
    text += `${exp.description}\n`;
    exp.achievements.forEach(achievement => {
      text += `- ${achievement}\n`;
    });
    text += '\n';
  });
  
  // Education
  text += 'EDUCATION\n';
  resume.education.forEach(edu => {
    text += `${edu.degree} in ${edu.field}\n`;
    text += `${edu.institution}\n`;
    text += `${edu.startDate} - ${edu.endDate}\n`;
    edu.achievements.forEach(achievement => {
      text += `- ${achievement}\n`;
    });
    text += '\n';
  });
  
  // Projects
  text += 'PROJECTS\n';
  resume.projects.forEach(project => {
    text += `${project.name}\n`;
    text += `${project.description}\n`;
    text += `Technologies: ${project.technologies.join(', ')}\n`;
    project.achievements.forEach(achievement => {
      text += `- ${achievement}\n`;
    });
    text += '\n';
  });
  
  // Skills
  text += 'SKILLS\n';
  text += `Technical: ${resume.skills.technical.join(', ')}\n`;
  text += `Soft: ${resume.skills.soft.join(', ')}\n`;
  text += `Languages: ${resume.skills.languages.join(', ')}\n`;
  text += `Certifications: ${resume.skills.certifications.join(', ')}\n`;
  
  return text;
}

function analyzeKeywordMatches(resumeText: string, keywords: KeywordAnalysis) {
  const matches: string[] = [];
  const missing: string[] = [];
  let score = 0;
  
  // Check essential keywords (highest weight)
  keywords.essential.forEach(keyword => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      matches.push(keyword);
      score += 3;
    } else {
      missing.push(keyword);
    }
  });
  
  // Check preferred keywords
  keywords.preferred.forEach(keyword => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      matches.push(keyword);
      score += 2;
    }
  });
  
  // Check skills
  keywords.skills.forEach(keyword => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      matches.push(keyword);
      score += 1;
    }
  });
  
  // Normalize score to 0-100
  const maxPossibleScore = 
    (keywords.essential.length * 3) + 
    (keywords.preferred.length * 2) + 
    (keywords.skills.length);
  
  score = (score / maxPossibleScore) * 100;
  
  return {
    score: Math.round(score),
    matches,
    missing
  };
}

function analyzeFormatting(resume: FormData) {
  const issues: string[] = [];
  let score = 100;
  
  // Check for common formatting issues
  
  // 1. Check for appropriate section headers
  if (!resume.experience.length) {
    issues.push('Missing Experience section');
    score -= 15;
  }
  if (!resume.education.length) {
    issues.push('Missing Education section');
    score -= 15;
  }
  
  // 2. Check contact information
  if (!resume.personalInfo.email || !resume.personalInfo.phone) {
    issues.push('Missing contact information');
    score -= 10;
  }
  
  // 3. Check date formats
  resume.experience.forEach(exp => {
    if (!isValidDateFormat(exp.startDate) || !isValidDateFormat(exp.endDate)) {
      issues.push('Inconsistent date format in experience section');
      score -= 5;
    }
  });
  
  // 4. Check for appropriate length
  const totalBulletPoints = resume.experience.reduce(
    (total, exp) => total + exp.achievements.length, 0
  );
  if (totalBulletPoints > 50) {
    issues.push('Resume may be too long for ATS scanning');
  }
  
  // 5. Check for consistent formatting
  const dateFormats = resume.experience.map(exp => exp.startDate).concat(
    resume.experience.map(exp => exp.endDate)
  );
  const hasInconsistentDates = dateFormats.some(date => {
    const format1 = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    const format2 = /^\d{2}\/\d{2}\/\d{4}$/; // MM/DD/YYYY
    return !format1.test(date) && !format2.test(date) && date !== 'Present';
  });
  if (hasInconsistentDates) {
    issues.push('Use consistent date formatting throughout the resume');
  }
  
  // Check for keyword stuffing
  const experienceKeywords = resume.experience.reduce((keywords: string[], exp) => {
    const expWords = exp.description.toLowerCase().split(/\s+/);
    const achievementWords = exp.achievements.reduce((words: string[], achievement) => {
      return words.concat(achievement.toLowerCase().split(/\s+/));
    }, []);
    return keywords.concat(expWords, achievementWords);
  }, []);

  const skillKeywords = [
    ...resume.skills.technical,
    ...resume.skills.soft,
    ...resume.skills.languages,
    ...resume.skills.certifications
  ].reduce((keywords: string[], skill) => {
    return keywords.concat(skill.toLowerCase().split(/\s+/));
  }, []);

  const allKeywords = [...experienceKeywords, ...skillKeywords];
  const keywordCounts = allKeywords.reduce((counts: { [key: string]: number }, word) => {
    counts[word] = (counts[word] || 0) + 1;
    return counts;
  }, {});

  const stuffedKeywords = Object.entries(keywordCounts)
    .filter(([word, count]) => count > 10 && word.length > 3)
    .map(([word]) => word);

  if (stuffedKeywords.length > 0) {
    issues.push(`Potential keyword stuffing detected for: ${stuffedKeywords.join(', ')}`);
  }
  
  // Check skills formatting and organization
  const skillSections = [
    { name: 'Technical Skills', items: resume.skills.technical },
    { name: 'Soft Skills', items: resume.skills.soft },
    { name: 'Languages', items: resume.skills.languages },
    { name: 'Certifications', items: resume.skills.certifications }
  ];

  skillSections.forEach(section => {
    if (section.items.length === 0) {
      issues.push(`Add ${section.name.toLowerCase()} to your resume`);
    } else if (section.items.some(skill => !skill.trim())) {
      issues.push(`Remove empty entries from ${section.name.toLowerCase()}`);
    }
  });
  
  // Check for skills balance
  const { technical, soft, languages, certifications } = resume.skills;
  if (technical.length < 3) {
    issues.push('Add more technical skills to showcase your expertise');
  }
  if (soft.length < 3) {
    issues.push('Add more soft skills to demonstrate your workplace capabilities');
  }
  if (languages.length === 0) {
    issues.push('Consider adding language proficiencies');
  }
  if (certifications.length === 0) {
    issues.push('Consider adding relevant certifications');
  }
  
  return {
    score: Math.max(0, score),
    issues
  };
}

function analyzeContent(resume: FormData, jobDescription: string) {
  const suggestions: string[] = [];
  let score = 100;
  
  // Analyze experience descriptions
  resume.experience.forEach(exp => {
    // Check for measurable achievements
    if (!containsMetrics(exp.description) && (!exp.achievements.some(containsMetrics))) {
      suggestions.push(`Add measurable achievements to ${exp.position} role`);
      score -= 5;
    }
    
    // Check for action verbs
    if (!startsWithActionVerb(exp.description)) {
      suggestions.push(`Start ${exp.position} description with action verbs`);
      score -= 3;
    }
    
    // Check for achievement descriptions
    exp.achievements.forEach(achievement => {
      if (!startsWithActionVerb(achievement)) {
        suggestions.push(`Start achievement "${achievement}" with an action verb`);
        score -= 2;
      }
      if (!containsMetrics(achievement)) {
        suggestions.push(`Add measurable results to achievement "${achievement}"`);
        score -= 2;
      }
    });
  });
  
  // Check skills relevance
  const relevantSkills = getRelevantSkills(jobDescription);
  const allSkills = [
    ...resume.skills.technical,
    ...resume.skills.soft,
    ...resume.skills.languages,
    ...resume.skills.certifications
  ];
  const hasRelevantSkills = allSkills.some(skill => 
    relevantSkills.includes(skill.toLowerCase())
  );
  if (!hasRelevantSkills) {
    suggestions.push('Add more job-relevant skills');
    score -= 15;
  }
  
  // Check skills formatting and organization
  const skillSections = [
    { name: 'Technical Skills', items: resume.skills.technical },
    { name: 'Soft Skills', items: resume.skills.soft },
    { name: 'Languages', items: resume.skills.languages },
    { name: 'Certifications', items: resume.skills.certifications }
  ];

  skillSections.forEach(section => {
    if (section.items.length === 0) {
      suggestions.push(`Add ${section.name.toLowerCase()} to your resume`);
      score -= 5;
    } else if (section.items.some(skill => !skill.trim())) {
      suggestions.push(`Remove empty entries from ${section.name.toLowerCase()}`);
      score -= 2;
    }
  });
  
  return {
    score: Math.max(0, score),
    suggestions
  };
}

function calculateOverallScore(keywordScore: number, formattingScore: number, contentScore: number): number {
  // Weighted average: keywords (40%), formatting (30%), content (30%)
  return Math.round(
    (keywordScore * 0.4) +
    (formattingScore * 0.3) +
    (contentScore * 0.3)
  );
}

function generateRecommendations(
  keywords: { score: number; matches: string[]; missing: string[] },
  formatting: { score: number; issues: string[] },
  content: { score: number; suggestions: string[] }
): string[] {
  const recommendations: string[] = [];
  
  // Prioritize keyword matches
  if (keywords.missing.length > 0) {
    recommendations.push(
      `Consider adding these key terms: ${keywords.missing.join(', ')}`
    );
  }
  
  // Add formatting recommendations
  formatting.issues.forEach(issue => {
    recommendations.push(`Fix formatting: ${issue}`);
  });
  
  // Add content improvements
  content.suggestions.forEach(suggestion => {
    recommendations.push(suggestion);
  });
  
  return recommendations;
}

// Helper functions
function isValidDateFormat(date: string): boolean {
  // Accept common date formats: MM/YYYY, MM-YYYY, Month YYYY
  const dateRegex = /^(0[1-9]|1[0-2])\/?-?\s?\d{4}$|^[A-Za-z]+\s\d{4}$/;
  return dateRegex.test(date);
}

function containsMetrics(text: string): boolean {
  // Check for numbers, percentages, currency amounts, etc.
  const metricsRegex = /\d+%|\$\d+|\d+ (users|people|clients|customers|projects|teams|members)/i;
  return metricsRegex.test(text);
}

function startsWithActionVerb(text: string): boolean {
  const actionVerbs = [
    'developed', 'implemented', 'created', 'managed', 'led', 'designed',
    'built', 'improved', 'increased', 'reduced', 'analyzed', 'launched'
  ];
  const firstWord = text.trim().split(/\s+/)[0].toLowerCase();
  return actionVerbs.includes(firstWord);
}

function getRelevantSkills(jobDescription: string): string[] {
  // This would ideally use AI to extract relevant skills
  // For now, return common technical skills
  return [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql',
    'aws', 'docker', 'kubernetes', 'machine learning', 'agile'
  ];
}

export function analyzeExperience(experience: Experience): number {
  let score = 0;

  // Check for comprehensive description
  if (experience.description.length > 50) score += 2;

  // Check for achievements
  if (experience.achievements.length > 0) {
    score += experience.achievements.length;
  }

  // Check for duration
  const startDate = new Date(experience.startDate);
  const endDate = experience.endDate === 'Present' ? new Date() : new Date(experience.endDate);
  const durationInMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (durationInMonths > 12) score += 2;
  if (durationInMonths > 24) score += 1;

  return Math.min(score, 10); // Cap at 10 points
}

export function analyzeEducation(education: Education): number {
  let score = 0;

  // Check for degree level
  const degreeLevel = education.degree.toLowerCase();
  if (degreeLevel.includes('phd') || degreeLevel.includes('doctorate')) score += 4;
  else if (degreeLevel.includes('master')) score += 3;
  else if (degreeLevel.includes('bachelor')) score += 2;
  else score += 1;

  // Check for field relevance
  if (education.field.length > 0) score += 1;

  // Check for achievements
  if (education.achievements.length > 0) {
    score += Math.min(education.achievements.length, 3);
  }

  return Math.min(score, 10); // Cap at 10 points
}

export function analyzeSkills(skills: Skills): number {
  let score = 0;

  // Check for technical skills
  if (skills.technical.length > 0) {
    score += Math.min(skills.technical.length, 5);
  }

  // Check for soft skills
  if (skills.soft.length > 0) {
    score += Math.min(skills.soft.length, 3);
  }

  // Check for languages
  if (skills.languages.length > 0) {
    score += Math.min(skills.languages.length, 2);
  }

  // Check for certifications
  if (skills.certifications.length > 0) {
    score += Math.min(skills.certifications.length, 3);
  }

  return Math.min(score, 10); // Cap at 10 points
}

export function analyzeProjects(projects: Project[]): number {
  let score = 0;

  projects.forEach(project => {
    // Check for comprehensive description
    if (project.description.length > 50) score += 1;

    // Check for technologies used
    if (project.technologies.length > 0) {
      score += Math.min(project.technologies.length, 2);
    }

    // Check for achievements
    if (project.achievements.length > 0) {
      score += Math.min(project.achievements.length, 2);
    }
  });

  return Math.min(score, 10); // Cap at 10 points
}

export function analyzePersonalInfo(personalInfo: PersonalInfo): number {
  let score = 0;

  // Check for completeness
  if (personalInfo.fullName) score += 1;
  if (personalInfo.title) score += 1;
  if (personalInfo.email) score += 1;
  if (personalInfo.phone) score += 1;
  if (personalInfo.location) score += 1;
  if (personalInfo.portfolio) score += 2;
  if (personalInfo.linkedin) score += 2;
  if (personalInfo.github) score += 1;

  return Math.min(score, 10); // Cap at 10 points
}

export function analyzeKeywords(text: string, keywords: string[]): {
  matched: string[];
  missing: string[];
} {
  const matched: string[] = [];
  const missing: string[] = [];

  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  return { matched, missing };
}

export function extractResumeText(resume: FormData): string {
  let text = '';

  // Personal Info
  const { personalInfo } = resume;
  text += `${personalInfo.fullName}\n${personalInfo.title}\n${personalInfo.email}\n${personalInfo.phone}\n${personalInfo.location}\n\n`;

  // Experience
  text += 'EXPERIENCE\n';
  resume.experience.forEach(exp => {
    text += `${exp.position} at ${exp.company}\n`;
    text += `${exp.startDate} - ${exp.endDate}\n`;
    text += `${exp.description}\n`;
    exp.achievements.forEach(achievement => {
      text += `- ${achievement}\n`;
    });
    text += '\n';
  });

  // Education
  text += 'EDUCATION\n';
  resume.education.forEach(edu => {
    text += `${edu.degree} in ${edu.field}\n`;
    text += `${edu.institution}\n`;
    text += `${edu.startDate} - ${edu.endDate}\n`;
    edu.achievements.forEach(achievement => {
      text += `- ${achievement}\n`;
    });
    text += '\n';
  });

  // Projects
  text += 'PROJECTS\n';
  resume.projects.forEach(project => {
    text += `${project.name}\n`;
    text += `${project.description}\n`;
    text += `Technologies: ${project.technologies.join(', ')}\n`;
    project.achievements.forEach(achievement => {
      text += `- ${achievement}\n`;
    });
    text += '\n';
  });

  // Skills
  text += 'SKILLS\n';
  text += `Technical: ${resume.skills.technical.join(', ')}\n`;
  text += `Soft: ${resume.skills.soft.join(', ')}\n`;
  text += `Languages: ${resume.skills.languages.join(', ')}\n`;
  text += `Certifications: ${resume.skills.certifications.join(', ')}\n`;

  return text;
}

export function analyzeResume(resume: FormData): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let totalScore = 0;

  // Analyze personal info
  const personalInfoScore = analyzePersonalInfo(resume.personalInfo);
  totalScore += personalInfoScore;
  if (personalInfoScore < 8) {
    feedback.push('Consider adding more contact information and professional links');
  }

  // Analyze experience
  let experienceScore = 0;
  resume.experience.forEach(exp => {
    experienceScore += analyzeExperience(exp);
  });
  experienceScore = Math.min(experienceScore, 30);
  totalScore += experienceScore;
  if (experienceScore < 20) {
    feedback.push('Add more details to your work experience, including specific achievements');
  }

  // Analyze education
  let educationScore = 0;
  resume.education.forEach(edu => {
    educationScore += analyzeEducation(edu);
  });
  educationScore = Math.min(educationScore, 20);
  totalScore += educationScore;
  if (educationScore < 15) {
    feedback.push('Include more academic achievements and relevant coursework');
  }

  // Analyze skills
  const skillsScore = analyzeSkills(resume.skills);
  totalScore += skillsScore * 2;
  if (skillsScore < 8) {
    feedback.push('Add more diverse skills, including both technical and soft skills');
  }

  // Analyze projects
  const projectsScore = analyzeProjects(resume.projects);
  totalScore += projectsScore * 2;
  if (projectsScore < 8) {
    feedback.push('Include more project details and highlight technologies used');
  }

  // Normalize total score to 0-100
  totalScore = Math.min(Math.round(totalScore), 100);

  return {
    score: totalScore,
    feedback: feedback.length > 0 ? feedback : ['Your resume looks great! Keep it up!'],
  };
} 