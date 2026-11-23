export const TECH_TERMS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'sql', 'bash', 'html', 'css', 'sass',
  'react', 'react native', 'next.js', 'vue', 'angular', 'svelte', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot', '.net', 'rails', 'laravel', 'graphql', 'rest', 'grpc',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd', 'linux', 'nginx', 'cloudflare',
  'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'dynamodb', 'elasticsearch', 'kafka', 'rabbitmq', 'snowflake', 'bigquery', 'spark', 'hadoop', 'airflow', 'dbt',
  'git', 'jira', 'figma', 'tableau', 'power bi', 'excel', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'nlp', 'computer vision',
  'junit', 'jest', 'cypress', 'selenium', 'pytest', 'prisma', 'tailwind', 'webpack', 'vite', 'microservices', 'oauth', 'jwt', 'websockets', 'unit testing', 'tdd',
  'data structures', 'algorithms', 'system design', 'distributed systems', 'api design', 'object-oriented programming', 'devops', 'sre', 'etl', 'data analysis', 'data modeling', 'a/b testing',
]

export const BUSINESS_TERMS = [
  'agile', 'scrum', 'kanban', 'stakeholder management', 'cross-functional', 'leadership', 'mentoring', 'project management', 'product management', 'roadmap',
  'communication', 'collaboration', 'problem solving', 'budgeting', 'forecasting', 'compliance', 'documentation', 'customer service', 'client relations', 'strategic planning',
]

export const INDUSTRY_TERMS = [
  'fintech', 'healthcare', 'e-commerce', 'saas', 'b2b', 'b2c', 'edtech', 'cybersecurity', 'blockchain', 'gaming', 'logistics', 'biotech', 'insurance', 'retail',
  'banking', 'telecommunications', 'automotive', 'aerospace', 'startup', 'enterprise', 'hipaa', 'gdpr', 'soc 2', 'pci', 'machine learning', 'adtech', 'iot',
]

const ALIASES_RAW: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  node: 'node.js',
  nodejs: 'node.js',
  'node js': 'node.js',
  nextjs: 'next.js',
  postgres: 'postgresql',
  mongo: 'mongodb',
  k8s: 'kubernetes',
  golang: 'go',
  'amazon web services': 'aws',
  'google cloud': 'gcp',
  'google cloud platform': 'gcp',
  'continuous integration': 'ci/cd',
  cicd: 'ci/cd',
  'ml': 'machine learning',
  'dotnet': '.net',
  'object oriented programming': 'object-oriented programming',
  oop: 'object-oriented programming',
  'scikit learn': 'scikit-learn',
  sklearn: 'scikit-learn',
  reactjs: 'react',
  'react.js': 'react',
  vuejs: 'vue',
  'vue.js': 'vue',
  'a/b tests': 'a/b testing',
}

const DISPLAY_RAW: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java', 'c++': 'C++', 'c#': 'C#', go: 'Go', rust: 'Rust', ruby: 'Ruby', php: 'PHP',
  swift: 'Swift', kotlin: 'Kotlin', scala: 'Scala', r: 'R', sql: 'SQL', bash: 'Bash', html: 'HTML', css: 'CSS', sass: 'Sass', react: 'React', 'react native': 'React Native',
  'next.js': 'Next.js', vue: 'Vue', angular: 'Angular', svelte: 'Svelte', 'node.js': 'Node.js', express: 'Express', django: 'Django', flask: 'Flask', fastapi: 'FastAPI',
  spring: 'Spring', 'spring boot': 'Spring Boot', '.net': '.NET', rails: 'Rails', laravel: 'Laravel', graphql: 'GraphQL', rest: 'REST', grpc: 'gRPC', aws: 'AWS',
  azure: 'Azure', gcp: 'GCP', docker: 'Docker', kubernetes: 'Kubernetes', terraform: 'Terraform', ansible: 'Ansible', jenkins: 'Jenkins', 'github actions': 'GitHub Actions',
  'ci/cd': 'CI/CD', linux: 'Linux', nginx: 'NGINX', cloudflare: 'Cloudflare', postgresql: 'PostgreSQL', mysql: 'MySQL', mongodb: 'MongoDB', redis: 'Redis', sqlite: 'SQLite',
  dynamodb: 'DynamoDB', elasticsearch: 'Elasticsearch', kafka: 'Kafka', rabbitmq: 'RabbitMQ', snowflake: 'Snowflake', bigquery: 'BigQuery', spark: 'Spark', hadoop: 'Hadoop',
  airflow: 'Airflow', dbt: 'dbt', git: 'Git', jira: 'Jira', figma: 'Figma', tableau: 'Tableau', 'power bi': 'Power BI', excel: 'Excel', pandas: 'pandas', numpy: 'NumPy',
  'scikit-learn': 'scikit-learn', tensorflow: 'TensorFlow', pytorch: 'PyTorch', 'machine learning': 'machine learning', 'deep learning': 'deep learning', nlp: 'NLP',
  junit: 'JUnit', jest: 'Jest', cypress: 'Cypress', selenium: 'Selenium', pytest: 'pytest', prisma: 'Prisma', tailwind: 'Tailwind', webpack: 'webpack', vite: 'Vite',
  oauth: 'OAuth', jwt: 'JWT', websockets: 'WebSockets', tdd: 'TDD', sre: 'SRE', etl: 'ETL', 'a/b testing': 'A/B testing', saas: 'SaaS', b2b: 'B2B', b2c: 'B2C',
  fintech: 'fintech', hipaa: 'HIPAA', gdpr: 'GDPR', 'soc 2': 'SOC 2', pci: 'PCI', iot: 'IoT', adtech: 'adtech', devops: 'DevOps', 'object-oriented programming': 'object-oriented programming',
}

export const BRAND_FIXES: Array<[RegExp, string]> = [
  [/\bjavascript\b/g, 'JavaScript'],
  [/\bJavascript\b/g, 'JavaScript'],
  [/\bTypescript\b/g, 'TypeScript'],
  [/\bGithub\b/g, 'GitHub'],
  [/\bNodejs\b/g, 'Node.js'],
  [/\bNode JS\b/g, 'Node.js'],
  [/\bNextjs\b/g, 'Next.js'],
  [/\bMongodb\b/g, 'MongoDB'],
  [/\bPostgresql\b/g, 'PostgreSQL'],
  [/\bMysql\b/g, 'MySQL'],
  [/\bGraphql\b/g, 'GraphQL'],
  [/\bLinkedin\b/g, 'LinkedIn'],
  [/\bPytorch\b/g, 'PyTorch'],
  [/\bTensorflow\b/g, 'TensorFlow'],
]

const GERUNDS_RAW: Record<string, string> = {
  managing: 'Managed', developing: 'Developed', leading: 'Led', building: 'Built', creating: 'Created', designing: 'Designed',
  implementing: 'Implemented', maintaining: 'Maintained', coordinating: 'Coordinated', analyzing: 'Analyzed', writing: 'Wrote',
  testing: 'Tested', supporting: 'Supported', overseeing: 'Oversaw', handling: 'Handled', organizing: 'Organized', training: 'Trained',
  planning: 'Planned', monitoring: 'Monitored', delivering: 'Delivered', maintaining_: 'Maintained', preparing: 'Prepared', processing: 'Processed',
  producing: 'Produced', reviewing: 'Reviewed', running: 'Ran', setting: 'Set', improving: 'Improved', optimizing: 'Optimized', deploying: 'Deployed',
  architecting: 'Architected', automating: 'Automated', integrating: 'Integrated', researching: 'Researched', resolving: 'Resolved', conducting: 'Conducted',
}

// Null-prototype copies: user-supplied text is used as a key, so "constructor" or "__proto__" must not resolve.
function nullProto(raw: Record<string, string>): Record<string, string> {
  return Object.assign(Object.create(null), raw)
}
export const ALIASES = nullProto(ALIASES_RAW)
export const DISPLAY = nullProto(DISPLAY_RAW)
export const GERUNDS = nullProto(GERUNDS_RAW)
