import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { getDaysInMonth, getFirstDayOfMonth, formatDateFromYMD } from '../lib/utils';

interface CalendarProps {
  month: number;
  year: number;
  attendanceData: AttendanceRecord[];
  onDateClick: (date: string) => void;
}

export default function Calendar({ month, year, attendanceData, onDateClick }: CalendarProps) {
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [isCurrentMonth, setIsCurrentMonth] = useState(false);
  
  // Set current date after component mounts to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    const day = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    setCurrentDay(day);
    setIsCurrentMonth(currentMonth === month && currentYear === year);
  }, [month, year]);

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  // Create a map for quick lookup of attendance data
  const attendanceMap = attendanceData.reduce((map, record) => {
    // Parse date string directly to avoid timezone issues
    const dateStr = record.attendance_date;
    const day = dateStr.includes('-') ? parseInt(dateStr.split('-')[2]) : new Date(dateStr).getDate();
    map[day] = record;
    return map;
  }, {} as Record<number, AttendanceRecord>);

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleDateClick = (day: number) => {
    const dateString = formatDateFromYMD(year, month, day);
    onDateClick(dateString);
  };

  return (
    <div className="space-y-4">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={`weekday-${index}-${day}`} className="text-center py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-14"></div>;
          }

          const attendance = attendanceMap[day];
          const isToday = isCurrentMonth && currentDay !== null && day === currentDay;
          
          let bgColor = 'bg-gray-50/80 dark:bg-gray-700/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-100 dark:border-gray-700/50';
          let textStyle = 'text-gray-600 dark:text-gray-400';
          let dotColor = '';
          
          if (attendance) {
            if (attendance.status === 'Present') {
              bgColor = 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-700/40';
              textStyle = 'text-emerald-700 dark:text-emerald-300 font-bold';
              dotColor = 'bg-emerald-400';
            } else {
              bgColor = 'bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200/60 dark:border-rose-700/40';
              textStyle = 'text-rose-700 dark:text-rose-300 font-bold';
              dotColor = 'bg-rose-400';
            }
          }
          
          if (isToday) {
            bgColor += ' ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-gray-800';
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDateClick(day)}
              className={`h-14 flex flex-col items-center justify-center text-sm transition-all duration-300 cursor-pointer rounded-xl hover:scale-105 ${bgColor} relative group`}
            >
              <span className={`${textStyle} ${isToday ? 'font-extrabold' : ''}`}>
                {day}
              </span>
              {attendance && (
                <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-0.5`}></div>
              )}
              {isToday && !attendance && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
