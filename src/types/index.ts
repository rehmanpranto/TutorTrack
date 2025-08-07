export interface AttendanceRecord {
  id: number;
  attendance_date: string;
  status: 'Present' | 'Absent';
  topic?: string;
  start_time?: string;
  end_time?: string;
}

export interface Student {
  id: number;
  name: string;
  email?: string;
}

export interface MonthlyReport {
  studentName: string;
  month: number;
  year: number;
  sessions: AttendanceRecord[];
  totalPresent: number;
  totalAbsent: number;
  totalSessions: number;
}

export interface DashboardData {
  currentDate: string;
  presentCount: number;
  canMarkPresent: boolean;
  todayAttendance?: AttendanceRecord;
}
