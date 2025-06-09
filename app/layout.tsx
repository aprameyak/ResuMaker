import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Navigation from './components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  title: {
    template: '%s | ResuMaker',
    default: 'ResuMaker - Professional Resume Builder with AI',
  },
  description: 'Create professional, ATS-friendly resumes with our AI-powered resume builder. Get personalized suggestions, multiple templates, and instant feedback to land your dream job.',
  keywords: [
    'resume builder',
    'cv maker',
    'professional resume',
    'AI resume',
    'job application',
    'ATS-friendly resume',
    'resume templates',
    'career tools',
    'job search',
    'resume optimization'
  ],
  authors: [{ name: 'ResuMaker Team' }],
  creator: 'ResuMaker',
  publisher: 'ResuMaker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://resumaker.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ResuMaker - Create Professional Resumes with AI',
    description: 'Build a standout resume in minutes with our intuitive AI-powered resume builder. Get personalized suggestions and ATS-friendly templates.',
    url: 'https://resumaker.vercel.app',
    siteName: 'ResuMaker',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResuMaker - Professional Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuMaker - Professional Resume Builder with AI',
    description: 'Create ATS-friendly resumes with AI-powered suggestions. Stand out from the crowd with professional templates.',
    creator: '@resumaker',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'add_your_google_site_verification_here',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full bg-gray-50 ${inter.variable}`}>
      <body className="h-full">
        <ClerkProvider>
          <Navigation />
          <main>{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
