import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { initializeDatabase } from '../../../lib/db-init';

// Add a simple in-memory flag to avoid repeated initialization
let isInitialized = false;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Skip initialization if already done
    if (isInitialized) {
      return NextResponse.json({ message: 'Database already initialized' });
    }

    await initializeDatabase();
    isInitialized = true;
    
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
