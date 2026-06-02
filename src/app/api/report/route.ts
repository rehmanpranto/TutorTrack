import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import pool from '../../../lib/db';
import { getStudentId } from '../../../lib/db-init';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const format = searchParams.get('format');
    const period = searchParams.get('period') || 'month';

    if (!year || !format) {
      return NextResponse.json({ error: 'year and format are required' }, { status: 400 });
    }
    if (period === 'month' && !month) {
      return NextResponse.json({ error: 'month is required for monthly reports' }, { status: 400 });
    }

    if (!['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Format must be pdf or excel' }, { status: 400 });
    }
    if (!['month', 'year'].includes(period)) {
      return NextResponse.json({ error: 'period must be month or year' }, { status: 400 });
    }

    const studentId = await getStudentId();
    const client = await pool.connect();

    try {
      const attendanceResult = period === 'year'
        ? await client.query(
            `SELECT attendance_date, status, topic, start_time, end_time
             FROM attendance
             WHERE student_id = $1
             AND EXTRACT(YEAR FROM attendance_date) = $2
             ORDER BY attendance_date`,
            [studentId, parseInt(year)]
          )
        : await client.query(
            `SELECT attendance_date, status, topic, start_time, end_time
             FROM attendance
             WHERE student_id = $1
             AND EXTRACT(MONTH FROM attendance_date) = $2
             AND EXTRACT(YEAR FROM attendance_date) = $3
             ORDER BY attendance_date`,
            [studentId, parseInt(month!), parseInt(year)]
          );

      const studentResult = await client.query('SELECT name FROM students WHERE id = $1', [studentId]);
      const studentName = studentResult.rows[0]?.name || 'Student';

      const totalPresent = attendanceResult.rows.filter(row => row.status === 'Present').length;
      const totalAbsent = attendanceResult.rows.filter(row => row.status === 'Absent').length;

      const reportData = {
        studentName,
        month: month ? parseInt(month) : undefined,
        year: parseInt(year),
        period: period as 'month' | 'year',
        sessions: attendanceResult.rows,
        totalPresent,
        totalAbsent,
        totalSessions: totalPresent + totalAbsent
      };

      if (format === 'pdf') {
        return generatePDFReport(reportData);
      } else {
        return generateExcelReport(reportData);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

interface AttendanceSession {
  attendance_date: string;
  status: string;
  start_time?: string;
  end_time?: string;
  topic?: string;
}

interface ReportData {
  studentName: string;
  month?: number;
  year: number;
  period: 'month' | 'year';
  sessions: AttendanceSession[];
  totalSessions: number;
  totalPresent: number;
  totalAbsent: number;
}

function reportTitle(data: ReportData): string {
  return data.period === 'year'
    ? `Year: ${data.year}`
    : `Month: ${getMonthName(data.month!)} ${data.year}`;
}

function fileSuffix(data: ReportData): string {
  return data.period === 'year' ? `${data.year}-annual` : `${data.year}-${data.month}`;
}

function generatePDFReport(data: ReportData) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('TutorTrack - Attendance Report', 20, 30);

  doc.setFontSize(14);
  doc.text(`Student: ${data.studentName}`, 20, 50);
  doc.text(reportTitle(data), 20, 60);

  doc.setFontSize(12);
  doc.text('Summary:', 20, 80);
  doc.text(`Total Sessions: ${data.totalSessions}`, 30, 90);
  doc.text(`Present: ${data.totalPresent}`, 30, 100);
  doc.text(`Absent: ${data.totalAbsent}`, 30, 110);

  let yPosition = 130;

  // For annual report, add per-month breakdown
  if (data.period === 'year') {
    doc.text('Monthly Breakdown:', 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    const byMonth = new Map<number, { present: number; absent: number }>();
    data.sessions.forEach((s) => {
      const m = new Date(s.attendance_date).getMonth() + 1;
      const entry = byMonth.get(m) || { present: 0, absent: 0 };
      if (s.status === 'Present') entry.present++;
      else entry.absent++;
      byMonth.set(m, entry);
    });
    for (let m = 1; m <= 12; m++) {
      const e = byMonth.get(m) || { present: 0, absent: 0 };
      doc.text(`${getMonthName(m)}: ${e.present} present, ${e.absent} absent`, 30, yPosition);
      yPosition += 7;
      if (yPosition > 270) { doc.addPage(); yPosition = 30; }
    }
    yPosition += 5;
    doc.setFontSize(12);
  }

  doc.text('Attendance Details:', 20, yPosition);
  yPosition += 15;
  doc.setFontSize(10);

  doc.text('Date', 20, yPosition);
  doc.text('Status', 50, yPosition);
  doc.text('Time', 80, yPosition);
  doc.text('Topic', 120, yPosition);
  yPosition += 5;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 5;

  data.sessions.forEach((session: AttendanceSession) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 30;
    }

    const date = new Date(session.attendance_date).toLocaleDateString();
    const timeRange = session.start_time && session.end_time
      ? `${session.start_time} - ${session.end_time}`
      : session.start_time || session.end_time || 'Not recorded';

    doc.text(date, 20, yPosition);
    doc.text(session.status, 50, yPosition);
    doc.text(timeRange, 80, yPosition);
    doc.text(session.topic || 'No topic', 120, yPosition);
    yPosition += 10;
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="attendance-report-${fileSuffix(data)}.pdf"`,
    },
  });
}

function generateExcelReport(data: ReportData) {
  const wb = XLSX.utils.book_new();

  const summaryData: (string | number)[][] = [
    ['TutorTrack - Attendance Report'],
    [''],
    ['Student:', data.studentName],
    [data.period === 'year' ? 'Year:' : 'Month:', data.period === 'year' ? data.year : `${getMonthName(data.month!)} ${data.year}`],
    [''],
    ['Summary:'],
    ['Total Sessions:', data.totalSessions],
    ['Present:', data.totalPresent],
    ['Absent:', data.totalAbsent],
    [''],
    ['Attendance Details:'],
    ['Date', 'Status', 'Time', 'Topic']
  ];

  data.sessions.forEach((session: AttendanceSession) => {
    const date = new Date(session.attendance_date).toLocaleDateString();
    const timeRange = session.start_time && session.end_time
      ? `${session.start_time} - ${session.end_time}`
      : session.start_time || session.end_time || 'Not recorded';
    summaryData.push([date, session.status, timeRange, session.topic || 'No topic']);
  });

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  ws['!cols'] = [{ width: 15 }, { width: 10 }, { width: 20 }, { width: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

  // For annual report, add a monthly breakdown sheet
  if (data.period === 'year') {
    const byMonth = new Map<number, { present: number; absent: number }>();
    data.sessions.forEach((s) => {
      const m = new Date(s.attendance_date).getMonth() + 1;
      const entry = byMonth.get(m) || { present: 0, absent: 0 };
      if (s.status === 'Present') entry.present++;
      else entry.absent++;
      byMonth.set(m, entry);
    });
    const breakdownData: (string | number)[][] = [['Month', 'Present', 'Absent', 'Total']];
    for (let m = 1; m <= 12; m++) {
      const e = byMonth.get(m) || { present: 0, absent: 0 };
      breakdownData.push([getMonthName(m), e.present, e.absent, e.present + e.absent]);
    }
    const bws = XLSX.utils.aoa_to_sheet(breakdownData);
    bws['!cols'] = [{ width: 15 }, { width: 10 }, { width: 10 }, { width: 10 }];
    XLSX.utils.book_append_sheet(wb, bws, 'Monthly Breakdown');
  }

  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="attendance-report-${fileSuffix(data)}.xlsx"`,
    },
  });
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
