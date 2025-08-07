import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import pool from '../../../lib/db';
import { getStudentId } from '../../../lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const studentId = await getStudentId();
    const client = await pool.connect();

    try {
      // Get all attendance records for the month
      const attendanceResult = await client.query(
        `SELECT attendance_date, status, topic 
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

      const report = {
        studentName,
        month: parseInt(month),
        year: parseInt(year),
        sessions: attendanceResult.rows,
        totalPresent,
        totalAbsent,
        totalSessions: totalPresent + totalAbsent
      };

      return NextResponse.json(report);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
