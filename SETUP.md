# ResuMaker Setup Guide

## Database Migration from Supabase to Neon PostgreSQL

This guide will help you set up ResuMaker with Neon PostgreSQL and Prisma instead of Supabase.

## 🔐 Security First - Environment Variables

**NEVER commit sensitive information to version control!**

Create a `.env.local` file in your project root with the following variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development

# Database Configuration (Required)
DATABASE_URL="postgresql://neondb_owner:npg_Ldx3HjY9vzNr@ep-weathered-salad-adbwtuy8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Configuration (Required for authentication)
# Generate a secure random string (minimum 32 characters)
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d

# Google AI Configuration (Required for resume generation)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## 🚀 Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
- Copy the `.env.local.example` template
- Fill in your actual values
- **NEVER commit `.env.local` to git**

### 3. Generate JWT Secret
```bash
# Generate a secure random string (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) View your database
npx prisma studio
```

### 5. Start Development Server
```bash
npm run dev
```

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Database-backed session storage
- **Input Validation**: Server-side validation for all inputs
- **Environment Protection**: Sensitive data never exposed to client

## 📊 Database Schema

The new schema includes:
- **Users**: Secure authentication and profile data
- **Resumes**: JSON-based resume storage with templates
- **Job Descriptions**: AI-powered resume tailoring
- **User Actions**: Analytics and tracking
- **Sessions**: Secure session management

## 🚨 Important Security Notes

1. **Never expose DATABASE_URL in client-side code**
2. **Keep JWT_SECRET secure and random**
3. **Use HTTPS in production**
4. **Regularly rotate JWT secrets**
5. **Monitor database access logs**

## 🔧 Troubleshooting

### Common Issues:
- **Database Connection**: Verify DATABASE_URL format
- **JWT Errors**: Ensure JWT_SECRET is set and valid
- **Migration Issues**: Run `npx prisma migrate reset` if needed

### Support:
- Check Prisma documentation: https://pris.ly/docs
- Neon PostgreSQL docs: https://neon.tech/docs
- JWT best practices: https://jwt.io/introduction
