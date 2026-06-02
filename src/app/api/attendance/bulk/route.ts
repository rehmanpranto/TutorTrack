import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import pool from '../../../../lib/db';
import { getStudentId, getMonthlyLimit } from '../../../../lib/db-init';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from, to, status, topic, startTime, endTime } = await request.json();

  if (!from || !to || !status) {
    return NextResponse.json({ error: 'from, to, and status are required' }, { status: 400 });
  }
  if (status !== 'Present' && status !== 'Absent') {
    return NextResponse.json({ error: 'status must be Present or Absent' }, { status: 400 });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date(s)' }, { status: 400 });
  }
  if (fromDate > toDate) {
    return NextResponse.json({ error: 'from must be <= to' }, { status: 400 });
  }

  // Cap range to avoid runaway requests
  const dayDiff = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDiff > 366) {
    return NextResponse.json({ error: 'Date range cannot exceed 366 days' }, { status: 400 });
  }

  const studentId = await getStudentId();
  const monthlyLimit = await getMonthlyLimit(studentId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enumerate dates in range (UTC-safe by working with date strings)
    const dates: string[] = [];
    const cur = new Date(fromDate.getTime());
    while (cur <= toDate) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cur.getUTCDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // For Present status, check monthly limit per affected month
    if (status === 'Present') {
      const monthGroups: Record<string, string[]> = {};
      for (const date of dates) {
        const [y, m] = date.split('-');
        const key = `${y}-${m}`;
        if (!monthGroups[key]) monthGroups[key] = [];
        monthGroups[key].push(date);
      }

      for (const [key, monthDates] of Object.entries(monthGroups)) {
        const [year, month] = key.split('-');
        const existing = await client.query(
          `SELECT COUNT(*) as count FROM attendance
           WHERE student_id = $1 AND status = 'Present'
           AND EXTRACT(MONTH FROM attendance_date) = $2
           AND EXTRACT(YEAR FROM attendance_date) = $3
           AND attendance_date NOT IN (SELECT unnest($4::date[]))`,
          [studentId, parseInt(month), parseInt(year), monthDates]
        );
        const existingPresent = parseInt(existing.rows[0].count);
        if (existingPresent + monthDates.length > monthlyLimit) {
          await client.query('ROLLBACK');
          return NextResponse.json({
            error: `Would exceed monthly limit of ${monthlyLimit} for ${key} (${existingPresent} existing + ${monthDates.length} new)`,
          }, { status: 400 });
        }
      }
    }

    let inserted = 0;
    for (const date of dates) {
      await client.query(
        `INSERT INTO attendance (student_id, attendance_date, status, topic, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, attendance_date)
         DO UPDATE SET status = $3, topic = $4, start_time = $5, end_time = $6`,
        [studentId, date, status, topic || null, startTime || null, endTime || null]
      );
      inserted++;
    }

    await client.query('COMMIT');
    return NextResponse.json({ inserted });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk attendance error:', error);
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
