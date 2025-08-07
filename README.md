# TutorTrack - Tutoring Attendance & Topic Tracking Web App

A secure and responsive web application for private online tutors to track student attendance, record teaching topics, and generate monthly reports. Built with Next.js, TypeScript, PostgreSQL, and TailwindCSS.

## 🎯 Features

### Core Functionality
- **Single-user Authentication** - Secure login for tutors
- **Daily Attendance Tracking** - Mark students present/absent with topic recording
- **16-Day Monthly Limit** - Automatic enforcement of maximum 16 present days per month
- **Interactive Calendar View** - Visual representation of attendance and topics
- **Monthly Report Generation** - Export reports as PDF or Excel files
- **Edit/Delete Records** - Modify past attendance entries
- **Mobile-Responsive Design** - Works perfectly on all devices

### Technical Features
- **Real-time Data Updates** - Instant UI updates after data changes
- **Database Integration** - PostgreSQL with SSL support
- **Secure Authentication** - NextAuth.js with credential and Google OAuth support
- **Modern UI/UX** - Clean, intuitive interface with TailwindCSS
- **Type Safety** - Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to the provided PostgreSQL database

### Installation

1. **Clone and setup the project:**
   ```bash
   cd h:\tutortrack
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env.local` file with the following variables:
   ```env
   DATABASE_URL=your_postgresql_database_url_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secure-secret-key-here
   APP_NAME=TutorTrack
   STUDENT_NAME=Your Student Name
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

3. **Initialize the database and create a user:**
   ```bash
   npm run create-user
   ```
   This will prompt you to create a tutor account with your preferred email and password.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) and login with the credentials you created.

## 📖 Usage Guide

### Daily Workflow

1. **Login** to the TutorTrack dashboard
2. **Select a date** (defaults to today)
3. **Mark attendance** as Present or Absent
4. **Enter topic taught** (required for Present status)
5. **Save** the attendance record

### Monthly Report Generation

1. Navigate to the current month using month navigation
2. Click **"Generate Report"**
3. Review the report summary
4. Download as **PDF** or **Excel** format

### Calendar Navigation

- **Click any date** to quickly mark attendance for that day
- **Visual indicators:** Green (Present), Red (Absent), Blue (Today)
- **Month navigation** using Previous/Next buttons
- **Hover over dates** to see attendance details

## 🗃️ Database Schema

The application uses PostgreSQL with the following structure:

### Students Table
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Present', 'Absent')),
    topic VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE (student_id, attendance_date)
);
```

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'tutor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **NextAuth.js** - Authentication solution

### Backend Stack
- **Next.js API Routes** - Server-side API endpoints
- **PostgreSQL** - Primary database (Supabase hosted)
- **bcryptjs** - Password hashing
- **node-postgres** - Database connection

### Export Libraries
- **jsPDF** - PDF generation
- **SheetJS (xlsx)** - Excel file generation

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- **Desktop computers** (1024px+)
- **Tablets** (768px - 1023px)
- **Mobile phones** (320px - 767px)

Key responsive features:
- Adaptive grid layouts
- Touch-friendly buttons
- Optimized navigation
- Readable typography at all sizes

## 🔐 Security Features

- **Secure Authentication** - Password hashing with bcrypt
- **Session Management** - JWT-based sessions
- **Database Security** - SSL connections and prepared statements
- **Input Validation** - Server-side validation for all inputs
- **CSRF Protection** - Built-in Next.js protection

## 🚀 Deployment

### Environment Variables for Production
Update `.env.local` for production:
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-secret-key
DATABASE_URL=your_production_database_url
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm run build
# Deploy the .next folder
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧮 Business Logic: 16-Day Rule

The application enforces a maximum of 16 "Present" entries per calendar month:

1. **Counter Display** - Shows current present count (e.g., "12/16")
2. **Automatic Enforcement** - Disables "Present" option after 16 entries
3. **Monthly Reset** - Counter resets automatically each new month
4. **Backend Validation** - Server-side checks prevent circumvention

## 📊 Report Features

### PDF Reports Include:
- Student name and reporting period
- Complete session list with dates and topics
- Present/Absent totals
- Professional formatting

### Excel Reports Include:
- Structured data in spreadsheet format
- Sortable columns
- Sum calculations
- Easy data manipulation

## 🔧 Customization

### Adding New Students
Modify the database initialization in `src/lib/db-init.ts`:
```typescript
await client.query(`
  INSERT INTO students (name, email) 
  VALUES ($1, $2)
`, ['New Student Name', 'student@email.com']);
```

### Changing the Monthly Limit
Update the limit in `src/app/api/attendance/route.ts`:
```typescript
if (presentCount >= 20) { // Changed from 16 to 20
  return NextResponse.json({ 
    error: 'Maximum 20 present entries per month reached' 
  }, { status: 400 });
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify the DATABASE_URL in `.env.local`
   - Check internet connectivity
   - Ensure SSL is enabled
   - Contact your database provider for connection issues

2. **Authentication Issues**
   - Clear browser cookies and localStorage
   - Verify NEXTAUTH_SECRET is set
   - Check user credentials

3. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Clear Next.js cache: `rm -rf .next`
   - Check TypeScript errors with `npm run lint`

## 📝 Development Notes

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main dashboard
├── components/         # React components
├── lib/               # Utility functions
└── types/             # TypeScript definitions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run create-user` - Create new tutor user
- `npm run lint` - Run ESLint

## 🎉 Success Metrics

The application successfully delivers:
- ✅ **Complete Attendance Tracking** - Daily session management
- ✅ **Monthly Reporting** - PDF and Excel export functionality  
- ✅ **16-Day Limit Enforcement** - Automatic business rule compliance
- ✅ **Mobile-First Design** - Works on all devices
- ✅ **Secure Authentication** - Protected tutor access
- ✅ **Calendar Integration** - Visual attendance overview
- ✅ **Data Persistence** - PostgreSQL database storage

---

**TutorTrack** - Making tutoring session management simple, secure, and efficient! 🎓📚
