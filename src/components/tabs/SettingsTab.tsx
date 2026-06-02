'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../ThemeProvider';

interface Settings {
  id: number;
  name: string;
  email: string | null;
  monthly_limit: number;
}

interface SettingsTabProps {
  onSettingsUpdated: () => void;
}

export default function SettingsTab({ onSettingsUpdated }: SettingsTabProps) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [limit, setLimit] = useState(16);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
          setName(data.name || '');
          setEmail(data.email || '');
          setLimit(data.monthly_limit || 16);
        }
      })
      .catch((e) => console.error('Failed to load settings', e));
  }, []);

  const save = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, monthly_limit: limit }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setSavedMsg('✓ Saved');
        onSettingsUpdated();
      } else {
        setSavedMsg(`✗ ${data.error || 'Save failed'}`);
      }
    } catch (err) {
      setSavedMsg(`✗ ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export?format=csv';
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`✓ Imported ${data.imported} record(s)${data.skipped ? `, skipped ${data.skipped}` : ''}`);
        onSettingsUpdated();
      } else {
        setImportMsg(`✗ ${data.error || 'Import failed'}`);
      }
    } catch (err) {
      setImportMsg(`✗ ${err}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Student Settings */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Student</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Profile and monthly limit</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Monthly session limit
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 1)}
              className="input text-sm w-32"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Maximum Present entries allowed per calendar month (1–31)</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{savedMsg}</span>
            <button onClick={save} disabled={saving || !settings} className="btn px-5 py-2 text-sm">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Appearance</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Theme preference</p>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setTheme(opt)}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
                theme === opt
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Data</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">CSV import and export</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Export</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Download all attendance records as CSV</p>
            <button onClick={handleExport} className="btn-secondary px-4 py-2 text-sm">
              Download CSV
            </button>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Import</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Upload CSV with columns: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">date,status,topic,start_time,end_time</code>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
              disabled={importing}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
            />
            {importMsg && <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{importMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
