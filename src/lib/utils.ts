export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateFromYMD(year: number, month: number, day: number): string {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Safe client-side date formatting to prevent hydration mismatches
export function formatDateSafe(dateStr: string, format: 'short' | 'long' = 'short'): string {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    // Server-side fallback
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      return format === 'short' ? `${month}/${day}` : `${month}-${day}`;
    }
    return dateStr;
  }
  
  // Client-side formatting
  try {
    const date = new Date(dateStr);
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  } catch {
    return dateStr;
  }
}

// Safe month/year formatting to prevent hydration mismatches
export function formatMonthYearSafe(year: number, month: number): string {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    // Server-side fallback
    return `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  // Client-side formatting
  try {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return `${year}-${month.toString().padStart(2, '0')}`;
  }
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month - 1, 1).getDay();
}
