'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className={`min-h-screen ${inter.variable}`}>
        <Navigation />
        <main>{children}</main>
      </div>
    </ClerkProvider>
  );
} 