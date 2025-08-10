import React, { useState } from 'react';
import { formatDisplayDate } from '../lib/utils';
import ClientOnly from './ClientOnly';

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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selected Date
        </label>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <ClientOnly fallback={selectedDate || 'Please select a date'}>
            {selectedDate ? displayDate : 'Please select a date'}
          </ClientOnly>
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Attendance Status
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            status === 'Present' 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-400/50' 
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
          } ${!canMarkPresent && status !== 'Present' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              value="Present"
              checked={status === 'Present'}
              onChange={(e) => setStatus(e.target.value as 'Present' | 'Absent')}
              disabled={status !== 'Present' && !canMarkPresent}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              status === 'Present' ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-500'
            }`}>
              {status === 'Present' && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <span className={`text-sm font-medium ${status === 'Present' ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
              Present
            </span>
          </label>
          
          <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            status === 'Absent' 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-200 dark:ring-red-400/50' 
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <input
              type="radio"
              value="Absent"
              checked={status === 'Absent'}
              onChange={(e) => setStatus(e.target.value as 'Present' | 'Absent')}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              status === 'Absent' ? 'border-red-500 bg-red-500' : 'border-gray-300 dark:border-gray-500'
            }`}>
              {status === 'Absent' && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <span className={`text-sm font-medium ${status === 'Absent' ? 'text-red-800 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
              Absent
            </span>
          </label>
        </div>
      </div>

      {/* Topic Input */}
      {status === 'Present' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topic Covered
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter the topic covered today..."
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            required={status === 'Present'}
          />
        </div>
      )}

      {/* Time Input */}
      {status === 'Present' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 3:30 PM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 5:00 PM"
            />
          </div>
        </div>
      )}

      {/* Monthly Limit Warning */}
      {!canMarkPresent && status === 'Present' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-400/50 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Monthly limit of 16 sessions reached. Cannot mark more present days this month.
          </p>
        </div>
      )}

      {/* Present Count */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Present days this month: <span className="font-semibold text-gray-900 dark:text-gray-100">{presentCount}/16</span>
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || (!canMarkPresent && status === 'Present') || !selectedDate}
        className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isSubmitting ? 'Saving...' : 'Save Attendance'}
      </button>
    </form>
  );
}
