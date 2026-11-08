'use client';

import { ReactNode, useState } from 'react';
import { AttendanceRecord } from '../types';

interface SessionItemProps {
  record: AttendanceRecord;
  dateLabel: ReactNode;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (id: number) => Promise<void> | void;
}

export default function SessionItem({ record, dateLabel, onEdit, onDelete }: SessionItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try { await onDelete(record.id); } finally { setDeleting(false); setConfirming(false); }
  };
  return (
    <div className="recent-row">
      <div className="date-badge">{dateLabel}</div>
      <div className="session-copy">
        <strong>{record.topic || 'No topic recorded'}</strong>
        <span>{record.start_time && record.end_time ? `${record.start_time} – ${record.end_time}` : 'Time not recorded'}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`status-pill ${record.status === 'Absent' ? 'absent-pill' : ''}`}>{record.status}</span>
        <div className="row-actions">
          {onEdit && <button onClick={() => onEdit(record)} aria-label="Edit session" title="Edit"><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4L16.5 3.5z"/></svg></button>}
          {onDelete && (confirming ? <button onClick={remove} disabled={deleting} aria-label="Confirm delete">{deleting ? '…' : '✓'}</button> : <button onClick={() => setConfirming(true)} aria-label="Delete session" title="Delete"><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4 7h16M10 11v6m4-6v6M9 7V4h6v3m-9 0l1 13h8l1-13"/></svg></button>)}
        </div>
      </div>
    </div>
  );
}
