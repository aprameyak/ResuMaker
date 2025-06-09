import { FormData, LaTeXConfig } from '../types';

const DEFAULT_LATEX_CONFIG = {
  documentClass: 'article',
  fontSize: '11pt',
  margin: '1.4cm',
  packages: [
    'latexsym',
    'fullpage',
    'titlesec',
    'marvosym',
    'color',
    'verbatim',
    'enumitem',
    'hyperref',
    'fancyhdr',
    'babel',
    'tabularx',
    'fontawesome5',
    'multicol'
  ],
  customCommands: [
    '\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{0pt}}}}',
    `\\newcommand{\\resumeSubheading}[4]{
      \\vspace{-2pt}\\item
      \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1} & \\textbf{\\small #2} \\\\
        \\textit{\\small#3} & \\textit{\\small #4} \\\\
      \\end{tabular*}\\vspace{-7pt}
    }`,
    `\\newcommand{\\resumeProjectHeading}[2]{
      \\item
      \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
        \\small#1 & \\textbf{\\small #2}\\\\
      \\end{tabular*}\\vspace{-7pt}
    }`,
    '\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}',
    '\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}',
    '\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.5in, label={}]}',
    '\\newcommand{\\resumeItemListEnd}{\\end{itemize}}'
  ]
} as const;

export const generateLatexDocument = (data: FormData, config: Partial<LaTeXConfig> = {}): string => {
  const finalConfig = { 
    ...DEFAULT_LATEX_CONFIG, 
    ...config,
    packages: config.packages || DEFAULT_LATEX_CONFIG.packages,
    customCommands: config.customCommands || DEFAULT_LATEX_CONFIG.customCommands
  };
  
  return `
\\documentclass[letterpaper,${finalConfig.fontSize}]{${finalConfig.documentClass}}

${finalConfig.packages.map(pkg => `\\usepackage${pkg === 'hyperref' ? '[hidelinks]' : ''}{${pkg}}`).join('\n')}

\\usepackage[margin=${finalConfig.margin}]{geometry}

% Document styling
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

${finalConfig.customCommands.join('\n\n')}

\\begin{document}

%----------HEADING----------
\\begin{center}
    {\\Large \\scshape ${sanitizeForLatex(data.personalInfo.fullName)}} \\\\[2mm]
    \\footnotesize \\raisebox{-0.1\\height}
    \\underline{${sanitizeForLatex(data.personalInfo.phone)}} ~ 
    { \\underline{${sanitizeForLatex(data.personalInfo.email)}}}
    ${data.personalInfo.linkedin || data.personalInfo.github || data.personalInfo.portfolio ? `~ 
    ${data.personalInfo.linkedin ? `{ \\underline{\\href{${sanitizeForLatex(data.personalInfo.linkedin)}}{linkedin.com/in/${sanitizeForLatex(data.personalInfo.linkedin.split('/').pop() || '')}}}}` : ''}
    ${data.personalInfo.github ? `${data.personalInfo.linkedin ? ' ~ ' : ''}{ \\underline{\\href{${sanitizeForLatex(data.personalInfo.github)}}{github.com/${sanitizeForLatex(data.personalInfo.github.split('/').pop() || '')}}}}` : ''}
    ${data.personalInfo.portfolio ? `${data.personalInfo.linkedin || data.personalInfo.github ? ' ~ ' : ''}{ \\underline{\\href{${sanitizeForLatex(data.personalInfo.portfolio)}}{${sanitizeForLatex(data.personalInfo.portfolio.replace('https://', ''))}}}` : ''}` : ''}
    \\vspace{-8pt}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
\\resumeSubHeadingListStart
${data.education.map(edu => `
  \\resumeSubheading
    {${sanitizeForLatex(edu.institution)}}{${sanitizeForLatex(edu.endDate)}}
    {${sanitizeForLatex(edu.degree)} in ${sanitizeForLatex(edu.field)}}{${sanitizeForLatex(edu.location)}}
    ${edu.gpa ? `
    \\resumeItemListStart
      \\resumeItem{\\textbf{GPA: ${sanitizeForLatex(edu.gpa)}}}
    \\resumeItemListEnd` : ''}
    ${edu.achievements.length > 0 ? `
    \\resumeItemListStart
      ${edu.achievements.map(achievement => `\\resumeItem{${sanitizeForLatex(achievement)}}`).join('\n      ')}
    \\resumeItemListEnd` : ''}
`).join('\n')}
\\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
\\resumeSubHeadingListStart
${data.experience.map(exp => `
  \\resumeSubheading
    {${sanitizeForLatex(exp.company)}}{${sanitizeForLatex(exp.startDate)} -- ${sanitizeForLatex(exp.endDate)}}
    {${sanitizeForLatex(exp.position)}}{${sanitizeForLatex(exp.location)}}
    \\resumeItemListStart
      \\resumeItem{${sanitizeForLatex(exp.description)}}
      ${exp.achievements.map(achievement => 
        `\\resumeItem{${sanitizeForLatex(achievement)}}`
      ).join('\n      ')}
    \\resumeItemListEnd
`).join('\n')}
\\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Projects}
\\resumeSubHeadingListStart
${data.projects.map(project => `
  \\resumeProjectHeading
    {\\textbf{${sanitizeForLatex(project.name)}}${project.link ? ` $|$ \\emph{\\href{${sanitizeForLatex(project.link)}}{Source Code}}` : ''}}{${project.technologies.map(tech => sanitizeForLatex(tech)).join(', ')}}
    \\resumeItemListStart
      \\resumeItem{${sanitizeForLatex(project.description)}}
      ${project.achievements.map(achievement => 
        `\\resumeItem{${sanitizeForLatex(achievement)}}`
      ).join('\n      ')}
    \\resumeItemListEnd
`).join('\n')}
\\resumeSubHeadingListEnd

%-----------SKILLS-----------
\\section{Technical Skills}
\\resumeSubHeadingListStart
  \\resumeItem{
    \\textbf{Technical:} ${data.skills.technical.map(skill => sanitizeForLatex(skill)).join(', ')}
  }
  \\resumeItem{
    \\textbf{Soft Skills:} ${data.skills.soft.map(skill => sanitizeForLatex(skill)).join(', ')}
  }
  \\resumeItem{
    \\textbf{Languages:} ${data.skills.languages.map(skill => sanitizeForLatex(skill)).join(', ')}
  }
  \\resumeItem{
    \\textbf{Certifications:} ${data.skills.certifications.map(skill => sanitizeForLatex(skill)).join(', ')}
  }
\\resumeSubHeadingListEnd

\\end{document}
`;
};

export const escapeLatex = (text: string): string => {
  return text.replace(/[&$%#_{}~^\\]/g, '\\$&');
};

export const sanitizeForLatex = (text: string): string => {
  // Remove any potential LaTeX commands that could be injected
  text = text.replace(/\\[a-zA-Z]+/g, '');
  // Escape special characters
  return escapeLatex(text);
}; 