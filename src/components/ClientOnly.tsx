'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

/**
 * Component that only renders its children on the client side
 * to prevent hydration mismatches
 */
export default function ClientOnly({ 
  children, 
  fallback = null, 
  suppressHydrationWarning = true 
}: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div suppressHydrationWarning={suppressHydrationWarning}>{fallback}</div>;
  }

  return <div suppressHydrationWarning={suppressHydrationWarning}>{children}</div>;
}
