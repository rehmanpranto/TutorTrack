const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTutorUser() {
  const client = await pool.connect();
  
  try {
    // First, initialize the database tables
    console.log('Initializing database tables...');
    
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

    // Create users table
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

    // Create view
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

    console.log('Database tables created successfully!');

    // Insert default student if not exists
    const studentExists = await client.query('SELECT id FROM students LIMIT 1');
    if (studentExists.rows.length === 0) {
      await client.query(`
        INSERT INTO students (name, email) 
        VALUES ($1, $2)
      `, [process.env.STUDENT_NAME || 'Default Student', 'student@example.com']);
      console.log('Default student created!');
    }
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', ['tutor@tutortrack.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists!');
      console.log('\nLogin credentials:');
      console.log('Email: tutor@tutortrack.com');
      console.log('Password: tutor123');
      return;
    }

    // Create hashed password
    const password = 'tutor123'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name`,
      ['tutor@tutortrack.com', hashedPassword, 'Tutor', 'tutor']
    );
    
    console.log('User created successfully:', result.rows[0]);
    console.log('\nLogin credentials:');
    console.log('Email: tutor@tutortrack.com');
    console.log('Password: tutor123');
    console.log('\n🚨 IMPORTANT: Change this password in production!');
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

createTutorUser();
