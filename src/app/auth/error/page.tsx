'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'Default':
        return 'An error occurred during authentication.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="text-center mb-8">
      <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Authentication Error</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        {getErrorMessage(error)}
      </p>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 mesh-gradient">
      <div className="max-w-md w-full mx-4">
        <div className="glass-strong rounded-3xl p-8 animate-scale-in">
          <Suspense 
            fallback={
              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Authentication Error</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
              </div>
            }
          >
            <ErrorContent />
          </Suspense>

          <div className="space-y-3 mt-8">
            <Link
              href="/auth/signin"
              className="btn w-full py-3 text-center block"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="btn-secondary w-full py-3 text-center block"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
