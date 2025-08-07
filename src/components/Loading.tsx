import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8F3CE] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 relative mx-auto mb-6">
          <Image
            src="/logo.png"
            alt="TutorTrack Logo"
            fill
            className="object-contain animate-pulse"
            priority
          />
        </div>
        <h2 className="text-xl font-semibold text-[#57564F] mb-2">TutorTrack</h2>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-[#57564F] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#57564F] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[#57564F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-[#7A7A73] mt-2">Loading...</p>
      </div>
    </div>
  );
}
