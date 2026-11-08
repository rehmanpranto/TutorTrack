'use client';

import { ReactNode } from 'react';
import { signOut } from 'next-auth/react';

export type TabId = 'overview' | 'analytics' | 'history' | 'settings';
interface Tab { id: TabId; label: string; icon: ReactNode; }

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2 7-7 7 7M5 10v10a1 1 0 001 1h3v-4a1 1 0 011-1h4a1 1 0 011 1v4h3a1 1 0 001-1V10"/></svg> },
  { id: 'analytics', label: 'Analytics', icon: <svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3"/></svg> },
  { id: 'history', label: 'History', icon: <svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { id: 'settings', label: 'Settings', icon: <svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.6 1.6-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2H13v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-1.6-1.6.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H7v-2.2h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1 1.6-1.6.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5v-.2h2.2v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 1.6 1.6-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.2V14h-.2a1.7 1.7 0 00-1.5 1z"/></svg> },
];

export default function Tabs({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <aside className="icon-rail" aria-label="Primary navigation">
      <div className="rail-logo" aria-label="TutorTrack">T</div>
      <div className="rail-nav">
        {TABS.map((tab) => <button key={tab.id} onClick={() => onChange(tab.id)} className={`rail-button ${active === tab.id ? 'active' : ''}`} aria-label={tab.label} title={tab.label}>{tab.icon}</button>)}
      </div>
      <div className="rail-bottom"><button onClick={() => signOut()} className="rail-button" aria-label="Sign out" title="Sign out"><svg width="19" height="19" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg></button></div>
    </aside>
  );
}
