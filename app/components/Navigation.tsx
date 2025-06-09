'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Create Resume', path: '/create' },
    { label: 'Upload Resume', path: '/upload' },
    { label: 'Tailor Resume', path: '/tailor' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname?.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                ResuMaker
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                </span>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 rounded-full",
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/sign-in"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" />
              ) : (
                <FiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive(item.path)
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {/* Mobile auth buttons */}
          {!isSignedIn && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="space-y-1">
                <Link
                  href="/sign-in"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
} 