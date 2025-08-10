import React from 'react';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName }: HeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              {/* Modern minimalist logo with overlapping circles */}
              <div className="w-full h-full relative">
                <div className="absolute top-0 left-0 w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full opacity-80"></div>
                <div className="absolute top-1 right-0 w-6 h-6 bg-purple-500 dark:bg-purple-400 rounded-full opacity-80"></div>
                <div className="absolute bottom-0 left-2 w-6 h-6 bg-blue-600 dark:bg-blue-300 rounded-full opacity-90"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              TutorTrack
            </h1>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Welcome back,</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{userName}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
