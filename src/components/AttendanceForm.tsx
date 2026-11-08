import React, { useState } from 'react';
import { formatDisplayDate } from '../lib/utils';

interface AttendanceFormProps {
  selectedDate: string;
  onSubmit: (data: { date: string; status: 'Present' | 'Absent'; topic: string; startTime?: string; endTime?: string }) => void | Promise<void>;
  presentCount: number;
  canMarkPresent: boolean;
  monthlyLimit?: number;
  initialData?: { status: 'Present' | 'Absent'; topic: string; startTime?: string; endTime?: string };
}

export default function AttendanceForm({ selectedDate, onSubmit, presentCount, canMarkPresent, monthlyLimit = 16, initialData }: AttendanceFormProps) {
  const [status, setStatus] = useState<'Present' | 'Absent'>(initialData?.status || 'Present');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [endTime, setEndTime] = useState(initialData?.endTime || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const displayDate = (() => {
    if (!selectedDate) return 'No date selected';
    const [year, month, day] = selectedDate.split('-').map(Number);
    return Number.isNaN(year) ? selectedDate : formatDisplayDate(new Date(year, month - 1, day));
  })();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) { alert('Please select a date first'); return; }
    setIsSubmitting(true);
    try { await onSubmit({ date: selectedDate, status, topic: status === 'Present' ? topic : '', startTime: status === 'Present' ? startTime : '', endTime: status === 'Present' ? endTime : '' }); }
    finally { setIsSubmitting(false); }
  };
  return (
    <form onSubmit={submit} className="attendance-form">
      <div><label>Selected date</label><div className="date-chip">{displayDate}</div></div>
      <div><label>Status</label><div className="attendance-toggle">
        <label className={status === 'Present' ? 'selected' : ''}><input type="radio" checked={status === 'Present'} onChange={() => setStatus('Present')} disabled={!canMarkPresent && status !== 'Present'} /><span>✓</span>Present</label>
        <label className={`absent ${status === 'Absent' ? 'selected' : ''}`}><input type="radio" checked={status === 'Absent'} onChange={() => setStatus('Absent')} /><span>×</span>Absent</label>
      </div></div>
      {status === 'Present' && <><div><label htmlFor="topic">Topic covered</label><input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What was taught today?" className="input" required /></div>
        <div className="grid grid-cols-2 gap-3"><div><label htmlFor="start-time">Start</label><input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" /></div><div><label htmlFor="end-time">End</label><input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" /></div></div></>}
      {!canMarkPresent && status === 'Present' && <p className="small-muted text-xs">Monthly limit of {monthlyLimit} sessions reached.</p>}
      <div className="flex items-center justify-between small-muted text-xs"><span>Sessions this month</span><strong style={{ color: 'var(--ink)' }}>{presentCount}/{monthlyLimit}</strong></div>
      <button type="submit" disabled={isSubmitting || (!canMarkPresent && status === 'Present') || !selectedDate} className="save-button w-full">{isSubmitting ? 'Saving…' : 'Save attendance'}</button>
    </form>
  );
}
