import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import SessionWrapper from './components/SessionWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ResuMaker - AI-Powered Resume Builder',
  description: 'Create, optimize, and tailor your resume with AI assistance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionWrapper>
          <ErrorBoundary>
            <Navigation />
            <main className="container mx-auto px-4 pt-4">
              {children}
            </main>
          </ErrorBoundary>
        </SessionWrapper>
      </body>
    </html>
  );
} 