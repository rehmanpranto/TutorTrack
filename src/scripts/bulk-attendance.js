// Bulk Attendance Script for TutorTrack
// Run this with: node src/scripts/bulk-attendance.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const attendanceRecords = [
  {
    date: '2025-08-03',
    time: '3:30 PM - 5:00 PM',
    subject: 'Economics',
    topic: 'Economic Problem',
    status: 'Present'
  },
  {
    date: '2025-08-04', 
    time: '3:30 PM - 5:00 PM',
    subject: 'Economics',
    topic: '',
    status: 'Present'
  },
  {
    date: '2025-08-06',
    time: '3:30 PM - 4:30 PM', 
    subject: 'Economics',
    topic: '',
    status: 'Present'
  },
  {
    date: '2025-08-07',
    time: '3:30 PM - 4:30 PM',
    subject: '',
    topic: '',
    status: 'Present'
  }
];

async function insertBulkAttendance() {
  const client = await pool.connect();
  
  try {
    // Get student ID (assuming default student setup)
    let studentResult = await client.query('SELECT id FROM students LIMIT 1');
    
    if (studentResult.rows.length === 0) {
      // Create default student if none exists
      studentResult = await client.query(
        `INSERT INTO students (name, email, phone) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [process.env.STUDENT_NAME || 'Raj', 'student@example.com', '1234567890']
      );
      console.log('Created default student');
    }
    
    const studentId = studentResult.rows[0].id;
    console.log(`Using student ID: ${studentId}`);
    
    // Insert each attendance record
    for (const record of attendanceRecords) {
      const topicText = record.topic || 
        (record.subject ? `${record.subject} class (${record.time})` : 
         `Class session (${record.time})`);
      
      const result = await client.query(
        `INSERT INTO attendance (student_id, attendance_date, status, topic) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (student_id, attendance_date) 
         DO UPDATE SET status = $3, topic = $4
         RETURNING *`,
        [studentId, record.date, record.status, topicText]
      );
      
      console.log(`✅ Added attendance for ${record.date}: ${record.status} - ${topicText}`);
    }
    
    console.log('\n🎉 All attendance records added successfully!');
    
    // Show summary
    const summaryResult = await client.query(
      `SELECT attendance_date::text as date, status, topic 
       FROM attendance 
       WHERE student_id = $1 
       AND attendance_date >= '2025-08-03' 
       AND attendance_date <= '2025-08-07'
       ORDER BY attendance_date`,
      [studentId]
    );
    
    console.log('\n📋 Summary of added records:');
    summaryResult.rows.forEach(row => {
      console.log(`${row.date}: ${row.status} - ${row.topic}`);
    });
    
  } catch (error) {
    console.error('❌ Error inserting attendance:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

insertBulkAttendance();
