import React, { useState } from 'react';
import { formatDate, formatDisplayDate } from '../lib/utils';

interface AttendanceFormProps {
  selectedDate: string;
  onSubmit: (data: { date: string; status: 'Present' | 'Absent'; topic: string }) => void;
  presentCount: number;
  canMarkPresent: boolean;
  initialData?: {
    status: 'Present' | 'Absent';
    topic: string;
  };
}

export default function AttendanceForm({ 
  selectedDate, 
  onSubmit, 
  presentCount, 
  canMarkPresent,
  initialData 
}: AttendanceFormProps) {
  const [status, setStatus] = useState<'Present' | 'Absent'>(initialData?.status || 'Present');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        date: selectedDate,
        status,
        topic: status === 'Present' ? topic : ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayDate = (() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return formatDisplayDate(date);
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selected Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#57564F] mb-2">
          Selected Date
        </label>
        <div className="input bg-gray-50 text-[#57564F]">
          {displayDate}
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium text-[#57564F] mb-2">
          Attendance Status
        </label>
        <div className="flex space-x-3">
          <label className="flex items-center">
            <input
              type="radio"
              value="Present"
              checked={status === 'Present'}
              onChange={(e) => setStatus(e.target.value as 'Present' | 'Absent')}
              disabled={status !== 'Present' && !canMarkPresent}
              className="mr-2"
            />
            <span className="text-sm text-[#57564F]">Present</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="Absent"
              checked={status === 'Absent'}
              onChange={(e) => setStatus(e.target.value as 'Present' | 'Absent')}
              className="mr-2"
            />
            <span className="text-sm text-[#57564F]">Absent</span>
          </label>
        </div>
      </div>

      {/* Topic Input */}
      {status === 'Present' && (
        <div>
          <label className="block text-sm font-medium text-[#57564F] mb-2">
            Topic Covered
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter the topic covered today..."
            className="input"
            required={status === 'Present'}
          />
        </div>
      )}

      {/* Monthly Limit Warning */}
      {!canMarkPresent && status === 'Present' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Monthly limit of 16 sessions reached. Cannot mark more present days this month.
          </p>
        </div>
      )}

      {/* Present Count */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-[#7A7A73]">
          Present days this month: <span className="font-semibold text-[#57564F]">{presentCount}/16</span>
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || (!canMarkPresent && status === 'Present')}
        className="btn w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save Attendance'}
      </button>
    </form>
  );
}
