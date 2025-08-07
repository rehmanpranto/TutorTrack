import React from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="TutorTrack Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-semibold text-[#57564F]">TutorTrack</h1>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[#7A7A73]">Welcome, {userName}</span>
            <button
              onClick={() => signOut()}
              className="btn text-sm px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
