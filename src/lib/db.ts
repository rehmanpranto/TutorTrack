import { Pool } from 'pg';

// Create a singleton pool instance with optimized settings
let pool: Pool | null = null;

function createPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection could not be established
      keepAlive: true, // Keep connections alive
    });
  }
  return pool;
}

export default createPool();
