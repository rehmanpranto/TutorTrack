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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selected Date */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Selected Date
        </label>
        <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30 text-gray-800 dark:text-gray-100 font-semibold text-sm">
          <ClientOnly fallback={selectedDate || 'Please select a date'}>
            {selectedDate ? displayDate : 'Please select a date'}
          </ClientOnly>
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <label className={`relative flex items-center justify-center p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
            status === 'Present' 
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10' 
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
            <div className="flex flex-col items-center space-y-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'Present' ? 'bg-emerald-400 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-400'} transition-all duration-300`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`text-xs font-semibold ${status === 'Present' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}`}>
                Present
              </span>
            </div>
          </label>
          
          <label className={`relative flex items-center justify-center p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
            status === 'Absent' 
              ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 shadow-lg shadow-rose-500/10' 
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <input
              type="radio"
              value="Absent"
              checked={status === 'Absent'}
              onChange={(e) => setStatus(e.target.value as 'Present' | 'Absent')}
              className="sr-only"
            />
            <div className="flex flex-col items-center space-y-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'Absent' ? 'bg-rose-400 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-400'} transition-all duration-300`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className={`text-xs font-semibold ${status === 'Absent' ? 'text-rose-700 dark:text-rose-300' : 'text-gray-500 dark:text-gray-400'}`}>
                Absent
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Topic Input */}
      {status === 'Present' && (
        <div className="animate-fade-in">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Topic Covered
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What was taught today?"
            className="input text-sm"
            required={status === 'Present'}
          />
        </div>
      )}

      {/* Time Input */}
      {status === 'Present' && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Start
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              End
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>
      )}

      {/* Monthly Limit Warning */}
      {!canMarkPresent && status === 'Present' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            ⚠️ Monthly limit of 16 sessions reached
          </p>
        </div>
      )}

      {/* Present Count */}
      <div className="bg-gray-50/80 dark:bg-gray-700/30 rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sessions this month</span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{presentCount}<span className="text-gray-400 dark:text-gray-500 font-normal">/16</span></span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || (!canMarkPresent && status === 'Present') || !selectedDate}
        className="btn w-full py-3"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : 'Save Attendance'}
      </button>
    </form>
  );
}
