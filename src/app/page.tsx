'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import AttendanceForm from '../components/AttendanceForm';
import ReportGenerator from '../components/ReportGenerator';
import Loading from '../components/Loading';
import ClientOnly from '../components/ClientOnly';
import { AttendanceRecord } from '../types';
import { formatDate } from '../lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-200 dark:border-blue-400 border-t-blue-600 dark:border-t-blue-300"></div>
      </div>
    );
  }

  // Show application loading while fetching data
  if (session && isLoading) {
    return <Loading />;
  }

  // Show sign in page if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 relative overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-40 h-40 border border-blue-200/20 dark:border-blue-600/10 rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 border border-purple-200/20 dark:border-purple-600/10 rounded-lg transform rotate-45"></div>
          <div className="absolute top-1/2 right-1/2 w-24 h-24 bg-blue-100/30 dark:bg-blue-600/10 rounded-full"></div>
        </div>
        
        <div className="max-w-md w-full space-y-8 text-center bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 relative z-10">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto">
              {/* Modern hexagonal logo with animated elements */}
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 transform rotate-45 rounded-lg shadow-xl"></div>
                <div className="absolute w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg"></div>
                <div className="absolute w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-ping"></div>
                <div className="absolute w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              TutorTrack
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please sign in to access your tutoring attendance tracker
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  const canMarkPresent = presentCount < 16;
  const selectedDateAttendance = attendanceData.find(
    record => record.attendance_date === selectedDate
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 relative overflow-hidden">
      {/* Modern geometric background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 border border-blue-200/30 dark:border-blue-600/20 rounded-full"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-purple-200/30 dark:border-purple-600/20 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-100/40 dark:bg-blue-600/10 rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-20 h-20 border-2 border-purple-200/40 dark:border-purple-600/20 rounded-lg transform rotate-12"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-100/20 dark:border-blue-700/20 rounded-full"></div>
      </div>
      
      <Header userName={session.user?.name || 'User'} />
      
      <main className="container mx-auto px-6 py-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Track your tutoring sessions and progress</p>
              </div>
              <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleMonthChange('prev')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ←
                </button>
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    <ClientOnly fallback={`${currentMonth.year}-${currentMonth.month.toString().padStart(2, '0')}`}>
                      {new Date(currentMonth.year, currentMonth.month - 1).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </ClientOnly>
                  </span>
                </div>
                <button
                  onClick={() => handleMonthChange('next')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center relative">
                  <div className="w-8 h-8 border-2 border-green-500 dark:border-green-400 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Days</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{presentCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center relative">
                  <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-4 bg-blue-500 dark:bg-blue-400 rounded-sm"></div>
                    <div className="w-1 h-3 bg-blue-500 dark:bg-blue-400 rounded-sm ml-0.5"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Limit</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">16</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl flex items-center justify-center relative">
                  <div className="w-8 h-8 border-2 border-purple-500 dark:border-purple-400 rounded-lg flex items-center justify-center">
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-2 bg-purple-500 dark:bg-purple-400 rounded-sm"></div>
                      <div className="w-1 h-3 bg-purple-500 dark:bg-purple-400 rounded-sm"></div>
                      <div className="w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-sm mt-2"></div>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.max(0, 16 - presentCount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendar - Takes up 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Calendar</h2>
                <Calendar
                  key={`calendar-${currentMonth.year}-${currentMonth.month}`}
                  month={currentMonth.month}
                  year={currentMonth.year}
                  attendanceData={attendanceData}
                  onDateClick={handleDateClick}
                />
              </div>
            </div>

            {/* Sidebar - Takes up 1 column */}
            <div className="space-y-6">
              {/* Attendance Form */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Mark Attendance</h3>
                <AttendanceForm
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
                {attendanceData.length > 0 ? (
                  <div className="space-y-3">
                    {attendanceData.slice(0, 4).map((record, index) => (
                      <div key={`attendance-${record.id}-${index}`} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            <ClientOnly fallback={record.attendance_date.split('-').slice(1).join('/')}>
                              {new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </ClientOnly>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'Present' 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {record.start_time && record.end_time 
                            ? `${record.start_time} - ${record.end_time}`
                            : 'Time not recorded'}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {record.topic || 'No topic recorded'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No sessions yet</p>
                  </div>
                )}
              </div>

              {/* Reports */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Generate Reports</h3>
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
