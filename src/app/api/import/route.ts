import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import pool from '../../../lib/db';
import { getStudentId } from '../../../lib/db-init';

// Minimal RFC-4180 line/field parser. Supports quoted fields and embedded commas/quotes.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function normalizeStatus(s: string): 'Present' | 'Absent' | null {
  const lower = s.trim().toLowerCase();
  if (lower === 'present' || lower === 'p') return 'Present';
  if (lower === 'absent' || lower === 'a') return 'Absent';
  return null;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) && !isNaN(new Date(s.trim()).getTime());
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const text = await request.text();
  if (!text.trim()) {
    return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });
  }

  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV must have a header and at least one data row' }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf('date');
  const statusIdx = header.indexOf('status');
  const topicIdx = header.indexOf('topic');
  const startIdx = header.indexOf('start_time');
  const endIdx = header.indexOf('end_time');

  if (dateIdx === -1 || statusIdx === -1) {
    return NextResponse.json({ error: 'CSV must include date and status columns' }, { status: 400 });
  }

  const studentId = await getStudentId();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = (row[dateIdx] || '').trim();
      const status = normalizeStatus(row[statusIdx] || '');
      const topic = topicIdx !== -1 ? (row[topicIdx] || '').trim() : '';
      const startTime = startIdx !== -1 ? (row[startIdx] || '').trim() || null : null;
      const endTime = endIdx !== -1 ? (row[endIdx] || '').trim() || null : null;

      if (!isValidDate(date) || !status) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO attendance (student_id, attendance_date, status, topic, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, attendance_date)
         DO UPDATE SET status = $3, topic = $4, start_time = $5, end_time = $6`,
        [studentId, date, status, topic || null, startTime, endTime]
      );
      imported++;
    }

    await client.query('COMMIT');
    return NextResponse.json({ imported, skipped });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
