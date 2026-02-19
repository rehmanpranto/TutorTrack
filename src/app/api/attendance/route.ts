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
        SELECT id, attendance_date::text as attendance_date, status, topic, start_time, end_time 
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
      
      // Calculate present count for the current month (always use current month if no month/year specified)
      let presentCount = 0;
      if (month && year) {
        // If month/year filters are applied, count present records in the filtered results
        presentCount = result.rows.filter(row => row.status === 'Present').length;
      } else {
        // If no filters, get present count for current month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        const presentCountResult = await client.query(
          `SELECT COUNT(*) as count FROM attendance 
           WHERE student_id = $1 AND status = 'Present' 
           AND EXTRACT(MONTH FROM attendance_date) = $2 
           AND EXTRACT(YEAR FROM attendance_date) = $3`,
          [studentId, currentMonth, currentYear]
        );
        presentCount = parseInt(presentCountResult.rows[0].count);
      }
      
      // Return structured response
      const responseData = {
        records: result.rows,
        presentCount: presentCount,
        totalRecords: result.rows.length
      };
      
      // Return structured response
      return NextResponse.json(responseData);
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

    const { date, status, topic, startTime, endTime } = await request.json();
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
           AND EXTRACT(YEAR FROM attendance_date) = $3
           AND attendance_date != $4`,
          [studentId, month, year, date]
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
        `INSERT INTO attendance (student_id, attendance_date, status, topic, start_time, end_time) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (student_id, attendance_date) 
         DO UPDATE SET status = $3, topic = $4, start_time = $5, end_time = $6
         RETURNING *`,
        [studentId, date, status, topic, startTime || null, endTime || null]
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

    const { id, status, topic, startTime, endTime } = await request.json();
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE attendance SET status = $1, topic = $2, start_time = $3, end_time = $4 WHERE id = $5 RETURNING *`,
        [status, topic, startTime || null, endTime || null, id]
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
