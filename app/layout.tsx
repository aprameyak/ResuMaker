import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { ReactNode } from 'react';

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
    <html lang="en">
      <head>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f9fafb;
            color: #111827;
            line-height: 1.6;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
          }
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <ErrorBoundary>
            <Navigation />
            <main style={{ padding: '16px 0' }}>
              {children}
            </main>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
