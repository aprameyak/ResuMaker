'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';

export default function Navigation() {
  const { userId, isLoaded } = useAuth();
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700';
  };

  return (
    <nav className="bg-white shadow-md px-6 py-3 w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ResuMaker
        </Link>

        <div className="flex items-center space-x-6">
          {isLoaded && userId ? (
            <>
              <Link href="/create" className={`font-medium ${isActive('/create')}`}>
                Create
              </Link>
              <Link href="/upload" className={`font-medium ${isActive('/upload')}`}>
                Upload
              </Link>
              <Link href="/tailor" className={`font-medium ${isActive('/tailor')}`}>
                Tailor
              </Link>
              <div className="ml-4">
                <UserButton afterSignOutUrl="/" />
              </div>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={`font-medium ${isActive('/sign-in')}`}>
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 