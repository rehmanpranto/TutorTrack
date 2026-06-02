'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Loading from '../components/Loading';
import NoSSR from '../components/NoSSR';
import Tabs, { TabId } from '../components/Tabs';
import OverviewTab from '../components/tabs/OverviewTab';
import HistoryTab from '../components/tabs/HistoryTab';
import SettingsTab from '../components/tabs/SettingsTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import { AttendanceRecord } from '../types';
import { formatDate, formatMonthYearSafe } from '../lib/utils';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [presentCount, setPresentCount] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(16);
  const [currentMonth, setCurrentMonth] = useState({ month: 8, year: 2025 });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

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
      const res = await fetch(`/api/attendance?month=${currentMonth.month}&year=${currentMonth.year}`);
      if (res.ok) {
        const data = await res.json();
        if (data.records) {
          setAttendanceData(data.records);
          setPresentCount(data.presentCount || 0);
          if (typeof data.monthlyLimit === 'number') setMonthlyLimit(data.monthlyLimit);
        } else {
          setAttendanceData(data);
          const presentDays = (data as AttendanceRecord[]).filter((r) => r.status === 'Present').length;
          setPresentCount(presentDays);
        }
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    }
  }, [currentMonth.month, currentMonth.year]);

  const initializeAndLoadData = useCallback(async () => {
    try {
      await fetch('/api/init-db');
      await loadAttendanceData();
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
  }, [session, currentMonth, initializeAndLoadData, refreshKey]);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleAttendanceSubmit = async (attendanceData: { date: string; status: 'Present' | 'Absent'; topic: string; startTime?: string; endTime?: string }) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: attendanceData.date,
          status: attendanceData.status,
          topic: attendanceData.topic,
          startTime: attendanceData.startTime,
          endTime: attendanceData.endTime
        })
      });

      if (response.ok) {
        await loadAttendanceData();
      } else {
        const errorText = await response.text();
        alert(`Failed to submit attendance: ${errorText}`);
      }
    } catch (error) {
      alert(`Error submitting attendance: ${error}`);
    }
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedDate(record.attendance_date);
    setActiveTab('overview');
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const res = await fetch(`/api/attendance?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
        await loadAttendanceData();
      } else {
        const err = await res.text();
        alert(`Failed to delete: ${err}`);
      }
    } catch (error) {
      alert(`Error deleting record: ${error}`);
    }
  };

  const handleGenerateReport = async (
    format: 'pdf' | 'excel',
    selectedMonth?: number,
    selectedYear?: number,
    period: 'month' | 'year' = 'month'
  ) => {
    try {
      const reportMonth = selectedMonth || currentMonth.month;
      const reportYear = selectedYear || currentMonth.year;
      const url = period === 'year'
        ? `/api/report?year=${reportYear}&format=${format}&period=year`
        : `/api/report?month=${reportMonth}&year=${reportYear}&format=${format}`;

      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        a.download = period === 'year'
          ? `attendance-report-${reportYear}-annual.${ext}`
          : `attendance-report-${reportYear}-${reportMonth}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objUrl);
      } else {
        const errorText = await response.text();
        alert(`Failed to generate report: ${errorText}`);
      }
    } catch (error) {
      alert(`Error generating report: ${error}`);
    }
  };

  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(prev => {
      const newMonth = direction === 'next' ? prev.month + 1 : prev.month - 1;
      if (newMonth > 12) return { month: 1, year: prev.year + 1 };
      if (newMonth < 1) return { month: 12, year: prev.year - 1 };
      return { ...prev, month: newMonth };
    });
  };

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

  if (session && (isLoading || !isInitialized)) {
    return <Loading />;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 mesh-gradient relative overflow-hidden">
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
            <h2 className="text-4xl font-extrabold gradient-text">TutorTrack</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Your intelligent tutoring companion</p>
          </div>
          <button onClick={() => signIn()} className="btn w-full py-4 text-base shadow-xl shadow-indigo-500/20">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 mesh-gradient relative" suppressHydrationWarning>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <Header userName={session.user?.name || 'User'} />

      <main className="container mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Track your tutoring sessions and progress</p>
              </div>
              {activeTab === 'overview' && (
                <div className="flex items-center space-x-2 glass-strong rounded-2xl p-1.5">
                  <button
                    onClick={() => handleMonthChange('prev')}
                    className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-300 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="px-5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-xl min-w-[160px] text-center">
                    <NoSSR fallback={<span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{`${currentMonth.year}-${currentMonth.month.toString().padStart(2, '0')}`}</span>}>
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{formatMonthYearSafe(currentMonth.year, currentMonth.month)}</span>
                    </NoSSR>
                  </div>
                  <button
                    onClick={() => handleMonthChange('next')}
                    className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-300 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <Tabs active={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <OverviewTab
              currentMonth={currentMonth}
              attendanceData={attendanceData}
              presentCount={presentCount}
              monthlyLimit={monthlyLimit}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              onAttendanceSubmit={handleAttendanceSubmit}
              onGenerateReport={handleGenerateReport}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsTab refreshKey={refreshKey} />}
          {activeTab === 'history' && (
            <HistoryTab
              onEditRecord={(record) => { handleEditRecord(record); }}
              onDeleteRecord={handleDeleteRecord}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              onSettingsUpdated={() => { setRefreshKey((k) => k + 1); loadAttendanceData(); }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
