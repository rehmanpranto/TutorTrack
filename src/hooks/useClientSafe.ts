import { useEffect, useState } from 'react';

/**
 * Hook to safely handle client-side only rendering to prevent hydration mismatches
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook to safely format dates on the client side only
 */
export function useSafeDate() {
  const isClient = useIsClient();

  const formatDate = (date: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!isClient) {
      // Return a simple fallback for server-side rendering
      if (typeof date === 'string') {
        return date.split('-').slice(1).join('/');
      }
      return date.toISOString().split('T')[0];
    }
    
    // Client-side formatting with proper locale support
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', options);
  };

  return { isClient, formatDate };
}
