import React from 'react';
import { useTheme } from './ThemeProvider';
import { formatMonthYearSafe } from '../lib/utils';

interface HeaderProps {
  userName?: string;
  month?: number;
  year?: number;
  onMonthChange?: (direction: 'next' | 'prev') => void;
}

export default function Header({ userName, month, year, onMonthChange }: HeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const icon = theme === 'system' ? '◐' : resolvedTheme === 'dark' ? '◑' : '☀';

  return (
    <header className="page-header">
      <div>
        <p className="small-muted text-xs font-medium mb-2">Your teaching workspace</p>
        <h1 className="dashboard-heading text-3xl sm:text-4xl font-bold tracking-tight">
          Good to see you, <span style={{ color: 'var(--brand)' }}>{userName?.split(' ')[0] || 'Tutor'}.</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {month && year && onMonthChange && (
          <div className="month-switcher">
            <button onClick={() => onMonthChange('prev')} aria-label="Previous month">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="month-label">{formatMonthYearSafe(year, month)}</div>
            <button onClick={() => onMonthChange('next')} aria-label="Next month">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--brand-deep)' }}>
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="small-muted text-xs">{userName}</span>
        </div>
        <button className="rail-button" onClick={() => setTheme(nextTheme)} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}>
          <span aria-hidden="true">{icon}</span>
        </button>
      </div>
    </header>
  );
}
