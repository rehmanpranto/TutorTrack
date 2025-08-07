import React from 'react';
import { AttendanceRecord } from '../types';
import { formatDisplayDate, getMonthName, getDaysInMonth, getFirstDayOfMonth, formatDateFromYMD } from '../lib/utils';

interface CalendarProps {
  month: number;
  year: number;
  attendanceData: AttendanceRecord[];
  onDateClick: (date: string) => void;
}

export default function Calendar({ month, year, attendanceData, onDateClick }: CalendarProps) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

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
          const isToday = isCurrentMonth && day === today.getDate();
          
          let bgColor = 'bg-white hover:bg-gray-50';
          if (attendance) {
            bgColor = attendance.status === 'Present' 
              ? 'bg-green-100 hover:bg-green-200' 
              : 'bg-red-100 hover:bg-red-200';
          }
          
          if (isToday) {
            bgColor += ' ring-2 ring-[#57564F]';
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDateClick(day)}
              className={`calendar-day h-12 flex items-center justify-center text-sm font-medium text-[#57564F] transition-colors cursor-pointer ${bgColor}`}
            >
              <span className={isToday ? 'font-bold' : ''}>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 rounded border"></div>
          <span className="text-[#7A7A73]">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-100 rounded border"></div>
          <span className="text-[#7A7A73]">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded border-2 border-[#57564F]"></div>
          <span className="text-[#7A7A73]">Today</span>
        </div>
      </div>
    </div>
  );
}
