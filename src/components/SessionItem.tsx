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

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(record.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="p-3.5 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl hover:bg-white dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{dateLabel}</span>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            record.status === 'Present'
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
          }`}>
            {record.status}
          </span>
          {(onEdit || onDelete) && (
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onEdit && (
                <button
                  onClick={() => onEdit(record)}
                  title="Edit"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                confirming ? (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md transition-colors"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                      className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    title="Delete"
                    className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
        {record.start_time && record.end_time
          ? `${record.start_time} – ${record.end_time}`
          : 'Time not recorded'}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
        {record.topic || 'No topic recorded'}
      </div>
    </div>
  );
}
