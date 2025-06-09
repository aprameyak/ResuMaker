'use client';

import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ResuMaker - Professional Resume Builder',
  description: 'Create professional, ATS-friendly resumes with our AI-powered resume builder.',
  keywords: ['resume builder', 'cv maker', 'professional resume', 'AI resume', 'job application'],
  authors: [{ name: 'ResuMaker Team' }],
  metadataBase: new URL('https://resumaker-six.vercel.app'),
  openGraph: {
    title: 'ResuMaker - Create Professional Resumes',
    description: 'Build a standout resume in minutes with our intuitive AI-powered resume builder',
    type: 'website',
    locale: 'en_US',
    siteName: 'ResuMaker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuMaker - Create Professional Resumes',
    description: 'Build a standout resume in minutes with our intuitive AI-powered resume builder',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
