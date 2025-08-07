import { Pool } from 'pg';

// Create a singleton pool instance with optimized settings for Vercel
let pool: Pool | null = null;

function createPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set');
      throw new Error('DATABASE_URL environment variable is required');
    }

    pool = new Pool({
      connectionString,
      max: 1, // Reduced for serverless environment
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout
      keepAlive: true,
      // Add SSL configuration for production databases
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Add error handling
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export default createPool();
