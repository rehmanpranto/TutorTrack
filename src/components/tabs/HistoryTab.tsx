'use client';

import { useEffect, useState, useCallback } from 'react';
import { AttendanceRecord } from '../../types';
import { formatDateFromYMD } from '../../lib/utils';
import SessionItem from '../SessionItem';
import NoSSR from '../NoSSR';
import { formatDateSafe } from '../../lib/utils';

interface HistoryTabProps {
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => Promise<void>;
  refreshKey: number;
}

export default function HistoryTab({ onEditRecord, onDeleteRecord, refreshKey }: HistoryTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Absent'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'Present' | 'Absent'>('Absent');
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => {
    const timer = setTimeout(loadRecords, 300);
    return () => clearTimeout(timer);
  }, [loadRecords, refreshKey]);

  const handleBulkSubmit = async () => {
    if (!bulkFrom || !bulkTo) {
      alert('Please pick both start and end dates');
      return;
    }
    if (bulkFrom > bulkTo) {
      alert('Start date must be before end date');
      return;
    }
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: bulkFrom,
          to: bulkTo,
          status: bulkStatus,
          topic: bulkStatus === 'Present' ? bulkTopic : '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResult(`✓ ${data.inserted} record(s) saved`);
        loadRecords();
      } else {
        setBulkResult(`✗ ${data.error || 'Bulk update failed'}`);
      }
    } catch (err) {
      setBulkResult(`✗ ${err}`);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const copyLastTopic = async () => {
    if (records.length === 0) return;
    const lastWithTopic = records.find((r) => r.topic && r.status === 'Present');
    if (lastWithTopic) {
      setBulkTopic(lastWithTopic.topic || '');
      setBulkStatus('Present');
    } else {
      alert('No previous topic found');
    }
  };

  const today = formatDateFromYMD(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Search & Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Search topic</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. algebra"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Present' | 'Absent')}
              className="input text-sm"
            >
              <option value="all">All</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input text-sm"
                max={today}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input text-sm"
                max={today}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter('all'); setFromDate(''); setToDate(''); }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen((o) => !o)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {bulkOpen ? 'Hide bulk actions' : 'Bulk actions ▾'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {bulkOpen && (
        <div className="glass-strong rounded-2xl p-6 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Bulk actions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Mark a date range with one status. Existing records on those dates are overwritten.</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">From</label>
              <input type="date" value={bulkFrom} onChange={(e) => setBulkFrom(e.target.value)} className="input text-sm" max={today} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">To</label>
              <input type="date" value={bulkTo} onChange={(e) => setBulkTo(e.target.value)} className="input text-sm" max={today} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as 'Present' | 'Absent')} className="input text-sm">
                <option value="Absent">Absent</option>
                <option value="Present">Present</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <span>Topic (if Present)</span>
                <button type="button" onClick={copyLastTopic} className="text-indigo-600 dark:text-indigo-400 normal-case font-medium hover:underline">Copy last topic</button>
              </label>
              <input type="text" value={bulkTopic} onChange={(e) => setBulkTopic(e.target.value)} placeholder="Optional" className="input text-sm" disabled={bulkStatus !== 'Present'} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">{bulkResult}</span>
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting}
              className="btn px-5 py-2 text-sm"
            >
              {bulkSubmitting ? 'Saving...' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Sessions</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">{records.length} result{records.length === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Loading…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No sessions match your filters</p>
        ) : (
          <div className="space-y-2.5">
            {records.map((record) => (
              <SessionItem
                key={`hist-${record.id}`}
                record={record}
                dateLabel={
                  <NoSSR fallback={<span>{formatDateSafe(record.attendance_date, 'long')}</span>}>
                    <span>{formatDateSafe(record.attendance_date, 'long')}</span>
                  </NoSSR>
                }
                onEdit={onEditRecord}
                onDelete={onDeleteRecord}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
