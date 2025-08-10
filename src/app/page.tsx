'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import AttendanceForm from '../components/AttendanceForm';
import ReportGenerator from '../components/ReportGenerator';
import Loading from '../components/Loading';
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
      <div className="min-h-screen flex items-center justify-center bg-[#DDDAD0]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#57564F] border-t-transparent"></div>
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
      <div className="min-h-screen flex items-center justify-center bg-[#DDDAD0]">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-bold text-[#57564F]">TutorTrack</h2>
            <p className="mt-4 text-[#7A7A73]">
              Please sign in to access your tutoring attendance tracker
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="btn w-full"
          >
            Sign In
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
    <div className="min-h-screen bg-[#DDDAD0]">
      <Header userName={session.user?.name || 'User'} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#57564F] mb-2">
              Dashboard
            </h2>
            <p className="text-[#7A7A73]">
              Manage student attendance and track progress
            </p>
          </div>

          {/* Monthly Summary */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">📅</span>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A73]">Present Days</p>
                  <p className="text-2xl font-bold text-[#57564F]">{presentCount}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🎯</span>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A73]">Monthly Limit</p>
                  <p className="text-2xl font-bold text-[#57564F]">16</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A73]">Remaining</p>
                  <p className="text-2xl font-bold text-[#57564F]">{Math.max(0, 16 - presentCount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Calendar */}
            <div>
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#57564F]">
                    Calendar
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMonthChange('prev')}
                      className="btn px-3 py-1 text-xs"
                    >
                      ←
                    </button>
                    <div className="bg-white border border-gray-200 px-3 py-1 rounded-lg">
                      <h4 className="text-xs font-medium text-[#57564F]">
                        {isInitialized ? new Date(currentMonth.year, currentMonth.month - 1).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        }) : `${currentMonth.year}-${currentMonth.month.toString().padStart(2, '0')}`}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleMonthChange('next')}
                      className="btn px-3 py-1 text-xs"
                    >
                      →
                    </button>
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

            {/* Right Column - Forms and Info */}
            <div className="space-y-6">
              {/* Attendance Form */}
              <div className="card">
                <h3 className="text-lg font-semibold text-[#57564F] mb-4">
                  Mark Attendance
                </h3>
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

              {/* Bottom Row - Recent Sessions and Reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent Sessions */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-[#57564F] mb-4">
                    Recent Sessions
                  </h3>
                  {attendanceData.length > 0 ? (
                    <div className="space-y-2">
                      {attendanceData.slice(0, 4).map((record, index) => (
                        <div key={`attendance-${record.id}-${index}`} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#57564F]">
                              {isInitialized ? new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : record.attendance_date}
                            </span>
                            <span className={`badge text-xs px-2 py-1 ${
                              record.status === 'Present' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#7A7A73] mb-1">
                            {record.start_time && record.end_time 
                              ? `${record.start_time} - ${record.end_time}`
                              : record.start_time || record.end_time || 'Time not recorded'}
                          </div>
                          <div className="text-xs text-[#57564F] truncate">
                            {record.topic || 'No topic recorded'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">📚</span>
                      </div>
                      <p className="text-xs text-[#7A7A73]">No sessions yet</p>
                    </div>
                  )}
                </div>

                {/* Reports */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-[#57564F] mb-4">
                    Reports
                  </h3>
                  <ReportGenerator
                    month={currentMonth.month}
                    year={currentMonth.year}
                    onGenerate={handleGenerateReport}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
