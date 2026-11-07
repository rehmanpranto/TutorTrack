'use client';

import Calendar from '../Calendar';
import AttendanceForm from '../AttendanceForm';
import ReportGenerator from '../ReportGenerator';
import NoSSR from '../NoSSR';
import SessionItem from '../SessionItem';
import { AttendanceRecord } from '../../types';
import { formatDateSafe } from '../../lib/utils';

interface OverviewTabProps {
  currentMonth: { month: number; year: number };
  attendanceData: AttendanceRecord[];
  presentCount: number;
  monthlyLimit: number;
  selectedDate: string;
  onDateClick: (date: string) => void;
  onAttendanceSubmit: (data: { date: string; status: 'Present' | 'Absent'; topic: string; startTime?: string; endTime?: string }) => void | Promise<void>;
  onGenerateReport: (format: 'pdf' | 'excel', month?: number, year?: number, period?: 'month' | 'year') => Promise<void>;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => Promise<void>;
}

export default function OverviewTab({
  currentMonth,
  attendanceData,
  presentCount,
  monthlyLimit,
  selectedDate,
  onDateClick,
  onAttendanceSubmit,
  onGenerateReport,
  onEditRecord,
  onDeleteRecord,
}: OverviewTabProps) {
  const canMarkPresent = presentCount < monthlyLimit;
  const selectedDateAttendance = attendanceData.find(
    (record) => record.attendance_date === selectedDate
  );
  const progressPct = Math.min(100, (presentCount / monthlyLimit) * 100);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="glass-strong rounded-xl p-6 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Present Days</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{presentCount}</p>
            </div>
            <div className="w-14 h-14 bg-[#dbe8dc] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-7 h-7 text-[#60806a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div className="bg-[#71947a] h-2 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Limit</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{monthlyLimit}</p>
            </div>
            <div className="w-14 h-14 bg-[#e6ded2] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-7 h-7 text-[#a46f50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{presentCount}/{monthlyLimit}</span>
            <span className="ml-1">sessions used</span>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-6 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{Math.max(0, monthlyLimit - presentCount)}</p>
            </div>
            <div className="w-14 h-14 bg-[#ead5cc] rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/10 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-7 h-7 text-[#aa665d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {monthlyLimit - presentCount > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Available</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-medium">● Limit reached</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calendar</h2>
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                <span>Present</span>
                <span className="w-2 h-2 bg-rose-400 rounded-full ml-3"></span>
                <span>Absent</span>
              </div>
            </div>
            <Calendar
              key={`calendar-${currentMonth.year}-${currentMonth.month}`}
              month={currentMonth.month}
              year={currentMonth.year}
              attendanceData={attendanceData}
              onDateClick={onDateClick}
            />
          </div>
        </div>

        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Mark Attendance</h3>
            <AttendanceForm
              key={`form-${selectedDate}`}
              selectedDate={selectedDate}
              onSubmit={onAttendanceSubmit}
              presentCount={presentCount}
              monthlyLimit={monthlyLimit}
              canMarkPresent={canMarkPresent}
              initialData={selectedDateAttendance ? {
                status: selectedDateAttendance.status,
                topic: selectedDateAttendance.topic || '',
                startTime: selectedDateAttendance.start_time || '',
                endTime: selectedDateAttendance.end_time || ''
              } : undefined}
            />
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
            {attendanceData.length > 0 ? (
              <div className="space-y-2.5">
                {attendanceData.slice(0, 4).map((record) => (
                  <SessionItem
                    key={`recent-${record.id}`}
                    record={record}
                    dateLabel={
                      <NoSSR fallback={<span>{formatDateSafe(record.attendance_date, 'short')}</span>}>
                        <span>{formatDateSafe(record.attendance_date, 'short')}</span>
                      </NoSSR>
                    }
                    onEdit={onEditRecord}
                    onDelete={onDeleteRecord}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No sessions yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Click a date to get started</p>
              </div>
            )}
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Generate Reports</h3>
            <ReportGenerator
              month={currentMonth.month}
              year={currentMonth.year}
              onGenerate={onGenerateReport}
            />
          </div>
        </div>
      </div>
    </>
  );
}
