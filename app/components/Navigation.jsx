'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

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
          {session ? (
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
              <div className="ml-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => signIn()}
                className={`font-medium ${isActive('/auth/signin')}`}
              >
                Sign In
              </button>
              <button
                onClick={() => signIn()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 