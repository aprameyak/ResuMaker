#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🔐 ResuMaker Environment Setup');
console.log('==============================\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('Please backup and remove it before running this script.\n');
  process.exit(1);
}

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Template for .env.local
const envTemplate = `# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development

# Database Configuration (Required)
# Replace with your actual Neon PostgreSQL connection string
DATABASE_URL="postgresql://neondb_owner:npg_Ldx3HjY9vzNr@ep-weathered-salad-adbwtuy8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Configuration (Required for authentication)
# This secret was generated automatically - keep it secure!
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# Google AI Configuration (Required for resume generation)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Google OAuth (Optional - for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Redis Configuration (Optional - for enhanced rate limiting)
REDIS_URL=redis://xxxxxx

# Rate Limiting Settings (Optional - these are default values)
NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE=10
NEXT_PUBLIC_MAX_CONTENT_LENGTH=5000

# Analytics and Monitoring (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id_here
SENTRY_DSN=your_sentry_dsn_here
`;

try {
  // Write .env.local file
  fs.writeFileSync(envPath, envTemplate);
  
  console.log('✅ .env.local file created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update GOOGLE_AI_API_KEY with your actual key');
  console.log('2. Add other optional configuration as needed');
  console.log('3. Run: npx prisma migrate dev --name init');
  console.log('4. Start your app: npm run dev');
  console.log('\n🔒 Security notes:');
  console.log('- .env.local is already in .gitignore');
  console.log('- JWT_SECRET was generated automatically');
  console.log('- Never commit this file to version control');
  console.log('\n🚨 IMPORTANT: Keep your DATABASE_URL and JWT_SECRET secure!');
  
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  process.exit(1);
}
