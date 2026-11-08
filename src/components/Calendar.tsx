import React, { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types';
import { getDaysInMonth, getFirstDayOfMonth, formatDateFromYMD, getMonthName } from '../lib/utils';

interface CalendarProps { month: number; year: number; attendanceData: AttendanceRecord[]; onDateClick: (date: string) => void; }

export default function Calendar({ month, year, attendanceData, onDateClick }: CalendarProps) {
  const [today, setToday] = useState<{ day: number; month: number; year: number } | null>(null);
  useEffect(() => { const now = new Date(); setToday({ day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() }); }, []);
  const map = attendanceData.reduce<Record<number, AttendanceRecord>>((result, record) => {
    const day = record.attendance_date.includes('-') ? Number(record.attendance_date.split('-')[2]) : new Date(record.attendance_date).getDate();
    result[day] = record; return result;
  }, {});
  const days = Array.from({ length: getFirstDayOfMonth(month, year) + getDaysInMonth(month, year) }, (_, index) => index < getFirstDayOfMonth(month, year) ? null : index - getFirstDayOfMonth(month, year) + 1);
  const isSameRow = (a: number, b: number) => Math.floor((a + getFirstDayOfMonth(month, year) - 1) / 7) === Math.floor((b + getFirstDayOfMonth(month, year) - 1) / 7);
  const presentDays = Object.keys(map).filter((day) => map[Number(day)].status === 'Present').map(Number);
  const streak = presentDays.length ? Math.max(...presentDays.map((day) => {
    let count = 1; while (presentDays.includes(day + count)) count++; return count;
  })) : 0;
  const present = presentDays.length;
  const absent = Object.values(map).filter((record) => record.status === 'Absent').length;
  return (
    <section className="bento-tile calendar-tile">
      <div className="calendar-heading"><h2>{getMonthName(month)} <span>{year}</span></h2><span className="streak-badge">{streak}-day streak</span></div>
      <div className="calendar-wrap">
        <div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-days">
          {days.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="calendar-day" aria-hidden="true" />;
            const record = map[day];
            const isPresent = record?.status === 'Present';
            const previousPresent = isPresent && map[day - 1]?.status === 'Present' && isSameRow(day - 1, day);
            const nextPresent = isPresent && map[day + 1]?.status === 'Present' && isSameRow(day, day + 1);
            const isToday = today?.day === day && today.month === month && today.year === year;
            const isPast = today && new Date(year, month - 1, day) < new Date(today.year, today.month - 1, today.day);
            return <div key={day} className={`calendar-day ${isPresent ? 'present' : ''} ${isPresent && !previousPresent ? 'first' : ''} ${isPresent && !nextPresent ? 'last' : ''} ${isToday ? 'today' : ''} ${isPast && !record ? 'past-empty' : ''}`}><button onClick={() => onDateClick(formatDateFromYMD(year, month, day))} aria-label={`Select ${getMonthName(month)} ${day}`}>{day}</button></div>;
          })}
        </div>
      </div>
      <div className="calendar-footer"><span><strong>{present}</strong>Present</span><span><strong>{absent}</strong>Absent</span><span className="calendar-note">Click a day to mark attendance</span></div>
    </section>
  );
}
