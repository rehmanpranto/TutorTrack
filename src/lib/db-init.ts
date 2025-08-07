import pool from './db';

// Simple cache for student ID to avoid repeated queries
let cachedStudentId: number | null = null;

export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Use transactions for better performance
    await client.query('BEGIN');
    
    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        status VARCHAR(10) CHECK (status IN ('Present', 'Absent')),
        topic VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE (student_id, attendance_date)
      )
    `);

    // Create attendance view with month & year
    await client.query(`
      CREATE OR REPLACE VIEW attendance_with_month_year AS
      SELECT 
        id,
        student_id,
        attendance_date,
        status,
        topic,
        EXTRACT(MONTH FROM attendance_date) AS month,
        EXTRACT(YEAR FROM attendance_date) AS year,
        created_at
      FROM attendance
    `);

    // Create users table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'tutor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default student if not exists
    const studentExists = await client.query('SELECT id FROM students LIMIT 1');
    if (studentExists.rows.length === 0) {
      const result = await client.query(`
        INSERT INTO students (name, email) 
        VALUES ($1, $2) RETURNING id
      `, [process.env.STUDENT_NAME || 'Default Student', 'student@example.com']);
      cachedStudentId = result.rows[0].id;
    } else {
      cachedStudentId = studentExists.rows[0].id;
    }
    
    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getStudentId(): Promise<number> {
  // Return cached value if available
  if (cachedStudentId !== null) {
    return cachedStudentId;
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id FROM students LIMIT 1');
    cachedStudentId = result.rows[0]?.id || 1;
    return cachedStudentId!; // Non-null assertion since we ensure it's set above
  } finally {
    client.release();
  }
}
