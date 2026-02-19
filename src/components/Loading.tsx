import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 mesh-gradient flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-60 h-60 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/5 w-72 h-72 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-float-slow"></div>
      </div>
      
      <div className="text-center glass-strong rounded-3xl p-10 relative z-10 animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-indigo-300/40 dark:border-indigo-600/30 animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>
        <h2 className="text-2xl font-extrabold gradient-text mb-4">
          TutorTrack
        </h2>
        <div className="flex items-center justify-center space-x-1.5 mb-4">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}
