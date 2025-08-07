'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);

  useEffect(() => {
    const loadProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    loadProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#DDDAD0]">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 relative mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="TutorTrack Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-[#57564F]">TutorTrack</h2>
            <p className="text-[#7A7A73] mt-2">
              Sign in to access your attendance tracker
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#57564F] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#57564F] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#7A7A73]">Or</span>
              </div>
            </div>
          </div>

          {/* OAuth Providers */}
          <div className="space-y-3">
            {providers && Object.values(providers).map((provider: { id: string; name: string }) => {
              if (provider.id === 'credentials') return null;
              
              return (
                <button
                  key={provider.name}
                  onClick={() => signIn(provider.id)}
                  className="btn w-full flex items-center justify-center space-x-2"
                >
                  <span>Continue with {provider.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
