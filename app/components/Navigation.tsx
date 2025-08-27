'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLogOut } from 'react-icons/fi';
import Logo from './Logo';

export default function Navigation() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  href="/create" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Create
                </Link>
                <Link 
                  href="/upload" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Upload
                </Link>
                <Link 
                  href="/tailor" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Tailor
                </Link>
                <div className="flex items-center space-x-2">
                  <FiUser className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors ml-2"
                    title="Sign out"
                  >
                    <FiLogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/auth" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
