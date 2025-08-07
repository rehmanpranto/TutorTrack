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

    const studentId = await getStudentId();
    const client = await pool.connect();

    try {
      let query = `
        SELECT id, attendance_date::text as attendance_date, status, topic 
        FROM attendance 
        WHERE student_id = $1
      `;
      const params: (string | number)[] = [studentId];

      if (month && year) {
        query += ` AND EXTRACT(MONTH FROM attendance_date) = $2 AND EXTRACT(YEAR FROM attendance_date) = $3`;
        params.push(parseInt(month), parseInt(year));
      }

      query += ` ORDER BY attendance_date DESC`;

      const result = await client.query(query, params);
      
      // Add cache headers for better performance
      const response = NextResponse.json(result.rows);
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, status, topic } = await request.json();
    const studentId = await getStudentId();
    
    // Check if this month already has 16 present entries
    if (status === 'Present') {
      const attendanceDate = new Date(date);
      const month = attendanceDate.getMonth() + 1;
      const year = attendanceDate.getFullYear();
      
      const client = await pool.connect();
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) as count FROM attendance 
           WHERE student_id = $1 AND status = 'Present' 
           AND EXTRACT(MONTH FROM attendance_date) = $2 
           AND EXTRACT(YEAR FROM attendance_date) = $3`,
          [studentId, month, year]
        );
        
        const presentCount = parseInt(countResult.rows[0].count);
        if (presentCount >= 16) {
          return NextResponse.json({ 
            error: 'Maximum 16 present entries per month reached' 
          }, { status: 400 });
        }
      } finally {
        client.release();
      }
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO attendance (student_id, attendance_date, status, topic) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (student_id, attendance_date) 
         DO UPDATE SET status = $3, topic = $4
         RETURNING *`,
        [studentId, date, status, topic]
      );

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, topic } = await request.json();
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE attendance SET status = $1, topic = $2 WHERE id = $3 RETURNING *`,
        [status, topic, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM attendance WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Attendance record deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json({ error: 'Failed to delete attendance' }, { status: 500 });
  }
}
