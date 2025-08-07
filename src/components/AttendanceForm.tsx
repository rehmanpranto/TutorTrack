import React, { useState } from 'react';
import { formatDisplayDate } from '../lib/utils';

interface AttendanceFormProps {
  selectedDate: string;
  onSubmit: (data: { date: string; status: 'Present' | 'Absent'; topic: string; startTime?: string; endTime?: string }) => void;
  presentCount: number;
  canMarkPresent: boolean;
  initialData?: {
    status: 'Present' | 'Absent';
    topic: string;
    startTime?: string;
    endTime?: string;
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
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [endTime, setEndTime] = useState(initialData?.endTime || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { date: selectedDate, status, topic, startTime, endTime });
    
    if (!selectedDate) {
      alert('Please select a date first');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        date: selectedDate,
        status,
        topic: status === 'Present' ? topic : '',
        startTime: status === 'Present' ? startTime : '',
        endTime: status === 'Present' ? endTime : ''
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayDate = (() => {
    if (!selectedDate) return 'No date selected';
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return selectedDate; // Fallback to raw date string
      }
      const date = new Date(year, month - 1, day);
      return formatDisplayDate(date);
    } catch {
      return selectedDate; // Fallback to raw date string on error
    }
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selected Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#57564F] mb-2">
          Selected Date
        </label>
        <div className="input bg-gray-50 text-[#57564F]">
          {selectedDate ? displayDate : 'Please select a date'}
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

      {/* Time Input */}
      {status === 'Present' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#57564F] mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
              placeholder="e.g., 3:30 PM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#57564F] mb-2">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
              placeholder="e.g., 5:00 PM"
            />
          </div>
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
        disabled={isSubmitting || (!canMarkPresent && status === 'Present') || !selectedDate}
        className="btn w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save Attendance'}
      </button>
    </form>
  );
}
