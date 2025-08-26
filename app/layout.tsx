import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { Analytics } from '@vercel/analytics/next';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ResuMaker - AI-Powered Resume Builder',
  description: 'Create, optimize, and tailor your resume with AI assistance',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/app-icon.svg',
  },
  manifest: '/manifest.json',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ErrorBoundary>
            <Navigation />
            <main className="container mx-auto px-4 pt-4">
              {children}
            </main>
          </ErrorBoundary>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
