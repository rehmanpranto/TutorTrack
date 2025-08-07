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

    if (!month || !year || !format) {
      return NextResponse.json({ error: 'Month, year, and format are required' }, { status: 400 });
    }

    if (!['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Format must be pdf or excel' }, { status: 400 });
    }

    const studentId = await getStudentId();
    const client = await pool.connect();

    try {
      // Get all attendance records for the month
      const attendanceResult = await client.query(
        `SELECT attendance_date, status, topic, start_time, end_time 
         FROM attendance 
         WHERE student_id = $1 
         AND EXTRACT(MONTH FROM attendance_date) = $2 
         AND EXTRACT(YEAR FROM attendance_date) = $3
         ORDER BY attendance_date`,
        [studentId, parseInt(month), parseInt(year)]
      );

      // Get student name
      const studentResult = await client.query('SELECT name FROM students WHERE id = $1', [studentId]);
      const studentName = studentResult.rows[0]?.name || 'Student';

      // Calculate totals
      const totalPresent = attendanceResult.rows.filter(row => row.status === 'Present').length;
      const totalAbsent = attendanceResult.rows.filter(row => row.status === 'Absent').length;

      const reportData = {
        studentName,
        month: parseInt(month),
        year: parseInt(year),
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

function generatePDFReport(data: any) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('TutorTrack - Attendance Report', 20, 30);
  
  // Student info
  doc.setFontSize(14);
  doc.text(`Student: ${data.studentName}`, 20, 50);
  doc.text(`Month: ${getMonthName(data.month)} ${data.year}`, 20, 60);
  
  // Summary
  doc.setFontSize(12);
  doc.text('Summary:', 20, 80);
  doc.text(`Total Sessions: ${data.totalSessions}`, 30, 90);
  doc.text(`Present: ${data.totalPresent}`, 30, 100);
  doc.text(`Absent: ${data.totalAbsent}`, 30, 110);
  
  // Attendance details
  doc.text('Attendance Details:', 20, 130);
  
  let yPosition = 145;
  doc.setFontSize(10);
  
  // Headers
  doc.text('Date', 20, yPosition);
  doc.text('Status', 50, yPosition);
  doc.text('Time', 80, yPosition);
  doc.text('Topic', 120, yPosition);
  yPosition += 10;
  
  // Draw line under headers
  doc.line(20, yPosition - 5, 190, yPosition - 5);
  
  // Data rows
  data.sessions.forEach((session: any, index: number) => {
    if (yPosition > 270) { // New page if needed
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
      'Content-Disposition': `attachment; filename="attendance-report-${data.year}-${data.month}.pdf"`,
    },
  });
}

function generateExcelReport(data: any) {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Summary data
  const summaryData = [
    ['TutorTrack - Attendance Report'],
    [''],
    ['Student:', data.studentName],
    ['Month:', `${getMonthName(data.month)} ${data.year}`],
    [''],
    ['Summary:'],
    ['Total Sessions:', data.totalSessions],
    ['Present:', data.totalPresent],
    ['Absent:', data.totalAbsent],
    [''],
    ['Attendance Details:'],
    ['Date', 'Status', 'Time', 'Topic']
  ];
  
  // Add attendance data
  data.sessions.forEach((session: any) => {
    const date = new Date(session.attendance_date).toLocaleDateString();
    const timeRange = session.start_time && session.end_time 
      ? `${session.start_time} - ${session.end_time}`
      : session.start_time || session.end_time || 'Not recorded';
    summaryData.push([date, session.status, timeRange, session.topic || 'No topic']);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  ws['!cols'] = [
    { width: 15 }, // Date
    { width: 10 }, // Status
    { width: 20 }, // Time
    { width: 30 }  // Topic
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
  
  // Generate Excel buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="attendance-report-${data.year}-${data.month}.xlsx"`,
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
