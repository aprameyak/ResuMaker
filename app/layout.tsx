import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'ResuMaker - Resume editor and job matcher',
  description: 'Edit a resume as plain text, check it against your own rules, match it to a job posting, and export a text-based PDF.',
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
    <html lang="en">
      <body>
        <AuthProvider>
          <ErrorBoundary>
            <Navigation />
            <main>
              {children}
            </main>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
