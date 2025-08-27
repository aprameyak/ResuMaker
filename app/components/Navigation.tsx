'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            ResuMaker
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link 
                  href="/create" 
                  className="nav-link font-medium"
                >
                  Create
                </Link>
                <Link 
                  href="/upload" 
                  className="nav-link font-medium"
                >
                  Upload
                </Link>
                <Link 
                  href="/tailor" 
                  className="nav-link font-medium"
                >
                  Tailor
                </Link>
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                    title="Sign out"
                  >
                    <FiLogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/auth" 
                className="btn-primary"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user ? (
              <div className="space-y-4">
                <Link 
                  href="/create" 
                  className="block nav-link font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create
                </Link>
                <Link 
                  href="/upload" 
                  className="block nav-link font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upload
                </Link>
                <Link 
                  href="/tailor" 
                  className="block nav-link font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tailor
                </Link>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-100 w-full"
                  >
                    <FiLogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/auth" 
                className="btn-primary w-full text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
