import React from 'react';
import { signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName }: HeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const themeIcon = theme === 'system'
    ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
    : resolvedTheme === 'dark'
      ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
      : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );

  const themeLabel = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f4f0e7]/85 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#151c17]/90">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[4.5rem]">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#26372b] dark:bg-[#d9e3d3] rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
              <svg className="w-5 h-5 text-[#d99170] dark:text-[#5f8068]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#26372b] dark:text-[#f4f0e7]">TutorTrack</h1>
              <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7d887d]">Session studio</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tutor</p>
              </div>
            </div>
            <button
              onClick={cycleTheme}
              title={`Theme: ${themeLabel} (click to change)`}
              aria-label={`Theme: ${themeLabel}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#8eaf91] hover:bg-[#8eaf91]/10 rounded-xl transition-all duration-200"
            >
              {themeIcon}
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#d99170] hover:bg-[#d99170]/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
