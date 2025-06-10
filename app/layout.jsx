import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ResuMaker - AI-Powered Resume Builder',
  description: 'Create, optimize, and tailor your resume with AI assistance',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <Navigation />
          <main className="container mx-auto px-4 pt-4">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
} 