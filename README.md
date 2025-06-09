# ResuMaker

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![Google AI](https://img.shields.io/badge/Google%20AI-4285F4?logo=google&logoColor=white&style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white&style=for-the-badge)

## About

**ResuMaker** is a dynamic web application built with **Next.js** and **TypeScript** that enables users to create professional resumes. It features **AI-enhanced descriptions** for work experiences, ensuring users can easily generate impactful bullet points for their job roles.

## Features

- Dynamic form fields for experience, education, and skills  
- AI-enhanced work experience descriptions via Google's Gemini API  
- Responsive design using Tailwind CSS  
- Serverless API routes for handling resume data  
- Form validation for complete and accurate input

## Technology Stack

- **Frontend**: React.js (Next.js), TypeScript, Tailwind CSS  
- **Backend**: Next.js API Routes  
- **AI Integration**: Google Gemini API (for generating descriptions)  
- **Deployment**: Vercel

## Live Deployment

- **View Here**: [https://resumaker-six.vercel.app/](https://resumaker-six.vercel.app/)

## Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ResuMaker.git
cd ResuMaker
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp env.example .env.local
```

4. Update the environment variables in `.env.local` with your values.

5. Run the development server:
```bash
npm run dev
```

## Deployment on Vercel

1. Fork this repository to your GitHub account.

2. Create a new project on [Vercel](https://vercel.com).

3. Connect your GitHub repository to Vercel.

4. Configure the following environment variables in your Vercel project settings:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `KV_REST_API_URL`: Vercel KV URL (Create in Vercel Storage)
   - `KV_REST_API_TOKEN`: Vercel KV Token
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your production URL (Vercel will set this automatically)

5. Deploy! Vercel will automatically build and deploy your application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
