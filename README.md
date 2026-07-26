# ResuMaker

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?logo=google&logoColor=white&style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white&style=for-the-badge)

## About

**ResuMaker** is a full-stack resume builder built with **Next.js** and **TypeScript** that lets users create, upload, and tailor professional resumes. It uses the **Google Gemini API** to generate AI-enhanced work experience descriptions and job description analysis, with **Prisma** handling persistent user data and a rate limiter protecting the API routes.

## Features

- AI-generated bullet points for work experience via Google Gemini
- Upload and parse existing resumes (PDF and DOCX supported)
- Job description analyzer to tailor resume content to a specific role
- Resume editor with live preview and multiple export options (PDF via jsPDF, canvas snapshot via html2canvas)
- Authentication with JWT-based sign-up/sign-in and session management
- File upload flow with drag-and-drop support via react-dropzone
- Rate limiting on API routes to prevent abuse

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Prisma), Redis / Upstash KV for rate limiting
- **AI Integration**: Google Gemini API

## Deployment

Visit the live site at [https://resumaker-tan.vercel.app](https://resumaker-tan.vercel.app)
