'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import AttendanceForm from '../components/AttendanceForm';
import ReportGenerator from '../components/ReportGenerator';
import Loading from '../components/Loading';

import NoSSR from '../components/NoSSR';
import { AttendanceRecord } from '../types';
import { formatDate, formatDateSafe, formatMonthYearSafe } from '../lib/utils';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [presentCount, setPresentCount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState({ month: 8, year: 2025 }); // Fixed default to avoid hydration issues
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set initial values after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (!isInitialized) {
      const today = new Date();
      setSelectedDate(formatDate(today));
      setCurrentMonth({
        month: today.getMonth() + 1,
        year: today.getFullYear()
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const loadAttendanceData = useCallback(async () => {
    try {
      // Use Promise.all to make parallel requests if needed
      const [attendanceResponse] = await Promise.all([
        fetch(`/api/attendance?month=${currentMonth.month}&year=${currentMonth.year}`)
      ]);
      
      if (attendanceResponse.ok) {
        const data = await attendanceResponse.json();
        console.log('Attendance data received:', data);
        
        // Handle both old and new API response formats
        if (data.records) {
          setAttendanceData(data.records);
          setPresentCount(data.presentCount || 0);
        } else {
          // Fallback for direct array response
          setAttendanceData(data);
          const presentDays = data.filter((record: AttendanceRecord) => record.status === 'Present').length;
          setPresentCount(presentDays);
        }
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      // Don't throw the error, just log it
    }
  }, [currentMonth.month, currentMonth.year]);

  // Initialize database and load data on mount
  const initializeAndLoadData = useCallback(async () => {
    try {
      // Skip database initialization in development after first run
      if (process.env.NODE_ENV === 'development') {
        await loadAttendanceData();
      } else {
        // Initialize database only in production or first run
        await fetch('/api/init-db');
        await loadAttendanceData();
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      // Don't throw the error, just log it
    } finally {
      setIsLoading(false);
    }
  }, [loadAttendanceData]);

  useEffect(() => {
    if (session) {
      initializeAndLoadData();
    }
  }, [session, currentMonth, initializeAndLoadData]);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleAttendanceSubmit = async (attendanceData: { status: string; topic: string; startTime?: string; endTime?: string }) => {
    try {
      console.log('Submitting attendance:', { date: selectedDate, status: attendanceData.status, topic: attendanceData.topic, startTime: attendanceData.startTime, endTime: attendanceData.endTime });
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          status: attendanceData.status,
          topic: attendanceData.topic,
          startTime: attendanceData.startTime,
          endTime: attendanceData.endTime
        })
      });

      if (response.ok) {
        console.log('Attendance submitted successfully');
        await loadAttendanceData(); // Reload data after successful submission
      } else {
        const errorText = await response.text();
        console.error('Failed to submit attendance:', response.status, errorText);
        alert(`Failed to submit attendance: ${errorText}`);
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert(`Error submitting attendance: ${error}`);
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel', selectedMonth?: number, selectedYear?: number) => {
    try {
      const reportMonth = selectedMonth || currentMonth.month;
      const reportYear = selectedYear || currentMonth.year;
      
      console.log('Generating report:', { month: reportMonth, year: reportYear, format });
      
      const response = await fetch(`/api/report?month=${reportMonth}&year=${reportYear}&format=${format}`);
      
      if (response.ok) {
        console.log('Report generated successfully');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${reportYear}-${reportMonth}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        console.error('Failed to generate report:', response.status, errorText);
        alert(`Failed to generate report: ${errorText}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Error generating report: ${error}`);
    }
  };

  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(prev => {
      const newMonth = direction === 'next' ? prev.month + 1 : prev.month - 1;
      if (newMonth > 12) {
        return { month: 1, year: prev.year + 1 };
      } else if (newMonth < 1) {
        return { month: 12, year: prev.year - 1 };
      }
      return { ...prev, month: newMonth };
    });
  };

  // Show loading screen while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 mesh-gradient">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-pulse shadow-xl shadow-indigo-500/30"></div>
          <div className="absolute inset-0 w-14 h-14 rounded-2xl border-2 border-indigo-300/50 animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>
      </div>
    );
  }

  // Show application loading while fetching data
  if (session && (isLoading || !isInitialized)) {
    return <Loading />;
  }

  // Show sign in page if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 mesh-gradient relative overflow-hidden">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400/5 dark:bg-pink-600/5 rounded-full blur-3xl animate-float-slower"></div>
        </div>
        
        <div className="max-w-md w-full space-y-8 text-center glass-strong rounded-3xl p-10 animate-scale-in relative z-10">
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 transform rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-4xl font-extrabold gradient-text">
              TutorTrack
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Your intelligent tutoring companion
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="btn w-full py-4 text-base shadow-xl shadow-indigo-500/20"
          >
            Get Started
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500">Secure authentication powered by NextAuth</p>
        </div>
      </div>
    );
  }

  const canMarkPresent = presentCount < 16;
  const selectedDateAttendance = attendanceData.find(
    record => record.attendance_date === selectedDate
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 mesh-gradient relative" suppressHydrationWarning>
      {/* Subtle floating accent shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-3xl animate-float-slow"></div>
      </div>
      
      <Header userName={session.user?.name || 'User'} />
      
      <main className="container mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Track your tutoring sessions and progress</p>
              </div>
              <div className="flex items-center space-x-2 glass-strong rounded-2xl p-1.5">
                <button
                  onClick={() => handleMonthChange('prev')}
                  className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-300 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="px-5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-xl min-w-[160px] text-center">
                  <NoSSR
                    fallback={
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {`${currentMonth.year}-${currentMonth.month.toString().padStart(2, '0')}`}
                      </span>
                    }
                  >
                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      {formatMonthYearSafe(currentMonth.year, currentMonth.month)}
                    </span>
                  </NoSSR>
                </div>
                <button
                  onClick={() => handleMonthChange('next')}
                  className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-300 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="glass-strong rounded-2xl p-6 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Present Days</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{presentCount}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (presentCount / 16) * 100)}%` }}></div>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Limit</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">16</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{presentCount}/16</span>
                <span className="ml-1">sessions used</span>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{Math.max(0, 16 - presentCount)}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {16 - presentCount > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Available</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">● Limit reached</span>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Calendar */}
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
                  onDateClick={handleDateClick}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              {/* Attendance Form */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Mark Attendance</h3>
                <AttendanceForm
                  key={`form-${selectedDate}`}
                  selectedDate={selectedDate}
                  onSubmit={handleAttendanceSubmit}
                  presentCount={presentCount}
                  canMarkPresent={canMarkPresent}
                  initialData={selectedDateAttendance ? {
                    status: selectedDateAttendance.status,
                    topic: selectedDateAttendance.topic || '',
                    startTime: selectedDateAttendance.start_time || '',
                    endTime: selectedDateAttendance.end_time || ''
                  } : undefined}
                />
              </div>

              {/* Recent Sessions */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
                {attendanceData.length > 0 ? (
                  <div className="space-y-2.5">
                    {attendanceData.slice(0, 4).map((record, index) => (
                      <div key={`attendance-${record.id}-${index}`} className="p-3.5 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl hover:bg-white dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-1.5">
                          <NoSSR
                            fallback={
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {formatDateSafe(record.attendance_date, 'short')}
                              </span>
                            }
                          >
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {formatDateSafe(record.attendance_date, 'short')}
                            </span>
                          </NoSSR>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            record.status === 'Present' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                          {record.start_time && record.end_time 
                            ? `${record.start_time} – ${record.end_time}`
                            : 'Time not recorded'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {record.topic || 'No topic recorded'}
                        </div>
                      </div>
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

              {/* Reports */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Generate Reports</h3>
                <ReportGenerator
                  month={currentMonth.month}
                  year={currentMonth.year}
                  onGenerate={handleGenerateReport}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
