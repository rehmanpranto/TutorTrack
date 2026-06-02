import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import pool from '../../../lib/db';
import { getStudentId } from '../../../lib/db-init';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';
  if (format !== 'csv') {
    return NextResponse.json({ error: 'Only csv format is supported' }, { status: 400 });
  }

  const studentId = await getStudentId();
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT attendance_date::text as date, status, topic, start_time, end_time
       FROM attendance
       WHERE student_id = $1
       ORDER BY attendance_date`,
      [studentId]
    );

    const header = 'date,status,topic,start_time,end_time';
    const rows = result.rows.map((r) =>
      [r.date, r.status, r.topic, r.start_time, r.end_time].map(csvEscape).join(',')
    );
    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
