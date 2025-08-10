'use client';

import { useEffect, useState } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * A more robust hydration-safe wrapper that prevents hydration mismatches
 * by ensuring content only renders after client-side hydration is complete
 */
export default function HydrationSafe({ 
  children, 
  fallback = null, 
  className 
}: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Use a small delay to ensure hydration is completely finished
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) {
    return (
      <div className={className} suppressHydrationWarning>
        {fallback}
      </div>
    );
  }

  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}
