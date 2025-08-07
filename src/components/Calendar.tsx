import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { formatDisplayDate, getMonthName, getDaysInMonth, getFirstDayOfMonth, formatDateFromYMD } from '../lib/utils';

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
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={`weekday-${index}-${day}`} className="calendar-day text-center py-2 text-sm font-medium text-[#57564F] bg-gray-100">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day h-12"></div>;
          }

          const attendance = attendanceMap[day];
          const isToday = isCurrentMonth && currentDay !== null && day === currentDay;
          
          let bgColor = 'bg-white hover:bg-gray-50 border border-gray-200';
          let textStyle = 'text-[#57564F]';
          
          if (attendance) {
            // Make recorded dates look "pressed/selected"
            if (attendance.status === 'Present') {
              bgColor = 'bg-green-200 hover:bg-green-300 border-2 border-green-400 shadow-inner';
              textStyle = 'text-green-800 font-semibold';
            } else {
              bgColor = 'bg-red-200 hover:bg-red-300 border-2 border-red-400 shadow-inner';
              textStyle = 'text-red-800 font-semibold';
            }
          }
          
          if (isToday) {
            bgColor += ' ring-2 ring-[#57564F] ring-offset-1';
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDateClick(day)}
              className={`calendar-day h-12 flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer transform relative ${attendance ? 'scale-95' : 'hover:scale-105'} ${bgColor}`}
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
      <div className="flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded shadow-inner flex items-center justify-center">
            <div className="w-1 h-1 bg-green-800 rounded-full"></div>
          </div>
          <span className="text-[#7A7A73]">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 border-2 border-red-400 rounded shadow-inner flex items-center justify-center">
            <div className="w-1 h-1 bg-red-800 rounded-full"></div>
          </div>
          <span className="text-[#7A7A73]">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white rounded border-2 border-[#57564F] ring-1 ring-[#57564F] ring-offset-1"></div>
          <span className="text-[#7A7A73]">Today</span>
        </div>
      </div>
    </div>
  );
}
