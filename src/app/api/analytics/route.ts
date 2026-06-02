import { NextResponse } from 'next/server';
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
    // Totals
    const totalsRes = await client.query(
      `SELECT
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::int as present,
         SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END)::int as absent,
         COUNT(*)::int as total
       FROM attendance WHERE student_id = $1`,
      [studentId]
    );
    const totals = {
      present: totalsRes.rows[0].present || 0,
      absent: totalsRes.rows[0].absent || 0,
      total: totalsRes.rows[0].total || 0,
    };
    const attendanceRate = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;

    // Monthly trend - last 12 months
    const trendRes = await client.query(
      `SELECT
         TO_CHAR(attendance_date, 'YYYY-MM') as month,
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::int as present,
         SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END)::int as absent
       FROM attendance
       WHERE student_id = $1
         AND attendance_date >= (CURRENT_DATE - INTERVAL '12 months')
       GROUP BY 1
       ORDER BY 1`,
      [studentId]
    );

    // Fill missing months
    const monthlyTrend: { month: string; present: number; absent: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = trendRes.rows.find((r) => r.month === key);
      monthlyTrend.push({
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        present: found?.present || 0,
        absent: found?.absent || 0,
      });
    }

    // Topic frequency - top 8
    const topicRes = await client.query(
      `SELECT topic, COUNT(*)::int as count
       FROM attendance
       WHERE student_id = $1
         AND topic IS NOT NULL
         AND topic <> ''
         AND status = 'Present'
       GROUP BY topic
       ORDER BY count DESC
       LIMIT 8`,
      [studentId]
    );
    const topicFrequency = topicRes.rows.map((r) => ({
      topic: r.topic.length > 24 ? r.topic.slice(0, 24) + '…' : r.topic,
      count: r.count,
    }));

    // Month-over-month
    const currMonth = now.getMonth() + 1;
    const currYear = now.getFullYear();
    const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
    const prevYear = currMonth === 1 ? currYear - 1 : currYear;

    const momRes = await client.query(
      `SELECT
         SUM(CASE WHEN EXTRACT(MONTH FROM attendance_date) = $2 AND EXTRACT(YEAR FROM attendance_date) = $3 AND status = 'Present' THEN 1 ELSE 0 END)::int as current,
         SUM(CASE WHEN EXTRACT(MONTH FROM attendance_date) = $4 AND EXTRACT(YEAR FROM attendance_date) = $5 AND status = 'Present' THEN 1 ELSE 0 END)::int as previous
       FROM attendance WHERE student_id = $1`,
      [studentId, currMonth, currYear, prevMonth, prevYear]
    );
    const current = momRes.rows[0].current || 0;
    const previous = momRes.rows[0].previous || 0;
    const deltaPct = previous === 0
      ? (current > 0 ? 100 : 0)
      : Math.round(((current - previous) / previous) * 100);

    return NextResponse.json({
      totals,
      attendanceRate,
      monthlyTrend,
      topicFrequency,
      monthOverMonth: { current, previous, deltaPct },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  } finally {
    client.release();
  }
}
