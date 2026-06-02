import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import pool from '../../../lib/db';
import { getStudentId } from '../../../lib/db-init';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const studentId = await getStudentId();
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, name, email, monthly_limit FROM students WHERE id = $1',
      [studentId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { monthly_limit, name, email } = await request.json();
  const studentId = await getStudentId();

  if (monthly_limit !== undefined && (typeof monthly_limit !== 'number' || monthly_limit < 1 || monthly_limit > 31)) {
    return NextResponse.json({ error: 'monthly_limit must be between 1 and 31' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const updates: string[] = [];
    const params: (string | number)[] = [];
    let i = 1;

    if (monthly_limit !== undefined) {
      updates.push(`monthly_limit = $${i++}`);
      params.push(monthly_limit);
    }
    if (typeof name === 'string' && name.trim()) {
      updates.push(`name = $${i++}`);
      params.push(name.trim());
    }
    if (typeof email === 'string') {
      updates.push(`email = $${i++}`);
      params.push(email.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    params.push(studentId);
    const result = await client.query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, email, monthly_limit`,
      params
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  } finally {
    client.release();
  }
}
