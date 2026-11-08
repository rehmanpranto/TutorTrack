'use client';

import Calendar from '../Calendar';
import AttendanceForm from '../AttendanceForm';
import ReportGenerator from '../ReportGenerator';
import SessionItem from '../SessionItem';
import { AttendanceRecord } from '../../types';

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

export default function OverviewTab(props: OverviewTabProps) {
  const { currentMonth, attendanceData, presentCount, monthlyLimit, selectedDate, onDateClick, onAttendanceSubmit, onGenerateReport, onEditRecord, onDeleteRecord } = props;
  const selected = attendanceData.find((record) => record.attendance_date === selectedDate);
  const progress = monthlyLimit ? Math.min(100, (presentCount / monthlyLimit) * 100) : 0;
  const remaining = Math.max(0, monthlyLimit - presentCount);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bento-grid">
      <div className="left-stack">
        <section className="bento-tile progress-tile">
          <div className="flex items-center justify-between text-sm font-bold"><span>Sessions this month</span><span>{presentCount} / {monthlyLimit}</span></div>
          <div className="progress-ring">
            <svg width="174" height="174" viewBox="0 0 174 174" aria-label={`${presentCount} of ${monthlyLimit} sessions used`}>
              <circle cx="87" cy="87" r={radius} fill="none" stroke="rgba(16,19,10,.14)" strokeWidth="16" />
              <circle cx="87" cy="87" r={radius} fill="none" stroke="var(--brand-deep)" strokeWidth="16" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} />
            </svg>
            <div className="progress-ring-content"><strong>{remaining}</strong><span>remaining</span></div>
          </div>
          <div className="stat-chips"><div className="stat-chip"><strong>{presentCount}</strong>Present days</div><div className="stat-chip"><strong>{monthlyLimit}</strong>Monthly limit</div></div>
        </section>

        <section className="bento-tile">
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Recent sessions</h2><span className="small-muted text-xs">Latest</span></div>
          <div className="recent-list">
            {attendanceData.length > 0 ? attendanceData.slice(0, 4).map((record) => (
              <SessionItem key={`recent-${record.id}`} record={record} dateLabel={<><strong>{Number(record.attendance_date.split('-')[2])}</strong><span>NOV</span></>} onEdit={onEditRecord} onDelete={onDeleteRecord} />
            )) : <p className="small-muted text-sm py-4">No sessions recorded yet.</p>}
          </div>
        </section>
      </div>

      <Calendar key={`${currentMonth.year}-${currentMonth.month}`} month={currentMonth.month} year={currentMonth.year} attendanceData={attendanceData} onDateClick={onDateClick} />

      <div className="right-stack">
        <section className="bento-tile">
          <div className="form-title"><h2 className="text-xl font-bold">Mark attendance</h2><span className="date-chip">{selectedDate || 'Select a date'}</span></div>
          <AttendanceForm key={`form-${selectedDate}`} selectedDate={selectedDate} onSubmit={onAttendanceSubmit} presentCount={presentCount} monthlyLimit={monthlyLimit} canMarkPresent={presentCount < monthlyLimit} initialData={selected ? { status: selected.status, topic: selected.topic || '', startTime: selected.start_time || '', endTime: selected.end_time || '' } : undefined} />
        </section>
        <section className="bento-tile report-tile">
          <h2 className="text-xl font-bold mb-4">Generate reports</h2>
          <ReportGenerator month={currentMonth.month} year={currentMonth.year} onGenerate={onGenerateReport} />
        </section>
      </div>
    </div>
  );
}
