export const studentResume = `Jordan Rivera
jordan.rivera@example.edu | (301) 555-0142 | github.com/jrivera

EDUCATION
University of Maryland, College Park
B.S. in Computer Science, GPA: 3.7/4.0    Aug 2022 - May 2026

EXPERIENCE
Software Engineering Intern, Northwind Analytics    Jun 2025 - Aug 2025
• Built a REST API in Node.js and PostgreSQL that served 12,000 daily requests
• Reduced report generation time by 40% by caching query results in Redis
• Worked on migrating the legacy dashboard from jQuery to React

Teaching Assistant, University of Maryland    Jan 2024 - May 2024
- Led weekly discussion sections for 35 students in Data Structures
- Graded assignments and held office hours

PROJECTS
SoleFinder (Next.js, Prisma, Cloudflare)
Sneaker price comparison tool with 2,000 monthly visitors.
TaskFlow | Python, Flask, SQLite
- Built a kanban app with drag and drop

SKILLS
Languages: Python, Java, JavaScript, TypeScript, SQL
Tools: Git, Docker, AWS
Soft Skills: Leadership, Communication
`

export const messyResume = `ALEX  CHEN

PROFESSIONAL SUMMARY
Backend engineer with 6 years building payment systems.   I   am passionate about reliability.

WORK EXPERIENCE

Stripe Corp — Senior Software Engineer (Mar 2021 – Present)
● Responsible for maintaining the ledger service handling $2B annually
● Designed idempotent retry logic that cut duplicate charges to
  near zero across 3 regions
● Mentored 4 junior engineers

Acme Logistics
Software Developer
June 2018 to February 2021
▪ Developed internal tooling in Javascript and Nodejs
▪ Was promoted twice in 3 years

Education
Georgia Institute of Technology
M.S. Computer Science, 2018

Technical Skills
Go, Kubernetes, Terraform, PostgreSQL; Kafka
`

export const minimalResume = `Sam Lee
Skills: Excel, Customer Service, Communication
Experience
Cashier at Target, 2019-2021
Handled customer transactions
`

export const noHeadingsResume = `Priya Nair
priya@example.com
Built a mobile app with React Native used by 5k people.
Also did some freelance design work.`

export const jobDescriptions = {
  backend: `Senior Backend Engineer - Fintech

About us
We are a fast-growing fintech startup building payment infrastructure.

Requirements
- 5+ years of experience with Go or Python
- Strong knowledge of PostgreSQL and Kafka
- Experience running services on Kubernetes and AWS
- Excellent communication and mentoring skills

Nice to have
- Terraform experience
- Familiarity with PCI compliance
- Experience with Rust

Benefits
- Health insurance, 401k
`,
  frontend: `Frontend Developer
You will build user interfaces in React and TypeScript. Must have strong JS fundamentals, CSS, and Git.
Experience with Next.js and GraphQL is a plus. We use Agile and Scrum with cross-functional teams.`,
  noTech: `We are looking for a friendly person to join our store team. You will greet customers, keep the shop tidy and go above and beyond. Go-getters welcome!`,
}

export const pipeResume = `MARIA GONZALEZ
EXPERIENCE:
Data Analyst | BrightPath Health | Jan 2022 - Present
- Built Tableau dashboards used by 40 clinicians
- Automated weekly HIPAA reports with Python and SQL, saving 6 hours per week

Research Assistant | Johns Hopkins University | Sep 2020 - Dec 2021
- Cleaned and analyzed survey data for 3 published studies

EDUCATION:
Johns Hopkins University
B.A. Public Health, 2021
Montgomery College
A.A. General Studies, 2019

SKILLS:
Tableau, Excel, Python, SQL, R
`

export const twoLineResume = `Chris Okafor

Experience

Google
Software Engineer III
Jul 2020 - Dec 2023
- Shipped the offline mode for Maps, used by 8M users
- Cut build times 35% by migrating to Bazel

Shopify
Software Engineer
Aug 2017 - Jun 2020
- Built the checkout extensibility API in Ruby

Education
Carnegie Mellon University
Bachelor of Science in Information Systems
2013 - 2017
`

export const longJobDescription = Array.from({ length: 400 }, (_, i) =>
  i % 40 === 0 ? 'Requirements' : `- Experience with Python, SQL and AWS in production environment ${i}`).join('\n')
