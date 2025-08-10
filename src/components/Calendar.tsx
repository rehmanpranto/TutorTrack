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
    <div className="space-y-6">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={`weekday-${index}-${day}`} className="text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-14"></div>;
          }

          const attendance = attendanceMap[day];
          const isToday = isCurrentMonth && currentDay !== null && day === currentDay;
          
          let bgColor = 'bg-white dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600';
          let textStyle = 'text-gray-700 dark:text-gray-300';
          
          if (attendance) {
            if (attendance.status === 'Present') {
              bgColor = 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/30 border-2 border-green-300 dark:border-green-400/50';
              textStyle = 'text-green-800 dark:text-green-300 font-semibold';
            } else {
              bgColor = 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/30 border-2 border-red-300 dark:border-red-400/50';
              textStyle = 'text-red-800 dark:text-red-300 font-semibold';
            }
          }
          
          if (isToday) {
            bgColor += ' ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1 dark:ring-offset-gray-800';
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDateClick(day)}
              className={`h-14 flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer rounded-lg transform hover:scale-105 ${bgColor} relative`}
            >
              <span className={`${textStyle} ${isToday ? 'font-bold' : ''}`}>
                {day}
              </span>
              {attendance && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current opacity-60"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-400/50 rounded-lg flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-green-800 dark:bg-green-300 rounded-full"></div>
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-400/50 rounded-lg flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-red-800 dark:bg-red-300 rounded-full"></div>
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white dark:bg-gray-700/50 rounded-lg border-2 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1 dark:ring-offset-gray-800"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Today</span>
        </div>
      </div>
    </div>
  );
}
