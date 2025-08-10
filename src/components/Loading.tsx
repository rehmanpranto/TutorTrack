import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 flex items-center justify-center relative overflow-hidden">
      {/* Sophisticated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-28 h-28 border border-blue-200/20 dark:border-blue-600/10 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/5 w-36 h-36 border border-purple-200/20 dark:border-purple-600/10 rounded-lg transform rotate-12"></div>
        <div className="absolute top-2/3 right-2/3 w-20 h-20 bg-blue-100/30 dark:bg-blue-600/10 rounded-full"></div>
      </div>
      
      <div className="text-center bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 relative z-10">
        <div className="w-20 h-20 mx-auto mb-6">
          {/* Animated loading logo with orbital elements */}
          <div className="w-full h-full relative flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg"></div>
            <div className="absolute w-16 h-16 border-2 border-blue-300 dark:border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md"></div>
            <div className="absolute w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
          TutorTrack
        </h2>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
      </div>
    </div>
  );
}
