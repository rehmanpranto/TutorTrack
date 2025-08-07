import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    };

    // Test database connection
    let dbStatus = 'Unknown';
    try {
      const pool = (await import('../../../lib/db')).default;
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'Connected';
    } catch (error) {
      console.error('Database connection error:', error);
      dbStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: envVars,
      database: dbStatus,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
