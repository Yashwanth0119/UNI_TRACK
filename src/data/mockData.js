// UniTrack - Smart Attendance System
// Standardized Mock Data: 5 Students, 2 Teachers, 3 Subjects, 3 Daily Classes

export const SUBJECTS = [
  {
    code: 'DSA101',
    name: 'Data Structures and Algorithms',
    type: 'Core Mandatory',
    credits: 4,
    professorId: 'FAC-001',
    professorName: 'Dr. Rajesh Sharma',
    room: 'Lab 201 (Computing Wing)',
    color: '#2563EB',
    lightColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  {
    code: 'OS102',
    name: 'Operating Systems',
    type: 'Core Mandatory',
    credits: 4,
    professorId: 'FAC-002',
    professorName: 'Prof. Meera Nair',
    room: 'Hall 102 (Systems Complex)',
    color: '#059669',
    lightColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  {
    code: 'DBMS103',
    name: 'Database Management Systems',
    type: 'Elective / Specialized',
    credits: 3,
    professorId: 'FAC-002',
    professorName: 'Prof. Meera Nair',
    room: 'Hall 305 (Database Lab)',
    color: '#7C3AED',
    lightColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
];

export const TEACHERS = [
  {
    id: 'FAC-001',
    name: 'Dr. Rajesh Sharma',
    empId: 'FAC-001',
    email: 'rajesh.sharma@unitrack.edu',
    username: 'rajesh',
    password: 'rajesh123',
    department: 'Computer Science & Engineering',
    designation: 'Professor & HOD',
    assignedSubjects: ['DSA101'],
    subjectCode: 'DSA101',
    subjectName: 'Data Structures and Algorithms',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'FAC-002',
    name: 'Prof. Meera Nair',
    empId: 'FAC-002',
    email: 'meera.nair@unitrack.edu',
    username: 'meera',
    password: 'meera123',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor & Systems Lead',
    assignedSubjects: ['OS102', 'DBMS103'],
    subjectCode: 'OS102',
    subjectName: 'Operating Systems & DBMS',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  },
];

// Exactly 5 Students
export const STUDENTS = [
  {
    id: 's1',
    name: 'Arun',
    rollNo: '21CS001',
    email: 'arun@unitrack.edu',
    username: 'arun',
    password: 'arun123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    attendance: {
      DSA101:  { attended: 21, total: 30 }, // 70.0% (<75% - Warning)
      OS102:   { attended: 26, total: 30 }, // 86.7%
      DBMS103: { attended: 25, total: 30 }, // 83.3%
    },
  },
  {
    id: 's2',
    name: 'Priya',
    rollNo: '21CS002',
    email: 'priya@unitrack.edu',
    username: 'priya',
    password: 'priya123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    attendance: {
      DSA101:  { attended: 27, total: 30 }, // 90.0%
      OS102:   { attended: 24, total: 30 }, // 80.0%
      DBMS103: { attended: 28, total: 30 }, // 93.3%
    },
  },
  {
    id: 's3',
    name: 'Kavin',
    rollNo: '21CS003',
    email: 'kavin@unitrack.edu',
    username: 'kavin',
    password: 'kavin123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    attendance: {
      DSA101:  { attended: 19, total: 30 }, // 63.3% (<75% - Warning)
      OS102:   { attended: 20, total: 30 }, // 66.7% (<75% - Warning)
      DBMS103: { attended: 27, total: 30 }, // 90.0%
    },
  },
  {
    id: 's4',
    name: 'Divya',
    rollNo: '21CS004',
    email: 'divya@unitrack.edu',
    username: 'divya',
    password: 'divya123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    attendance: {
      DSA101:  { attended: 25, total: 30 }, // 83.3%
      OS102:   { attended: 28, total: 30 }, // 93.3%
      DBMS103: { attended: 21, total: 30 }, // 70.0% (<75% - Warning)
    },
  },
  {
    id: 's5',
    name: 'Sanjay',
    rollNo: '21CS005',
    email: 'sanjay@unitrack.edu',
    username: 'sanjay',
    password: 'sanjay123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    attendance: {
      DSA101:  { attended: 28, total: 30 }, // 93.3%
      OS102:   { attended: 27, total: 30 }, // 90.0%
      DBMS103: { attended: 26, total: 30 }, // 86.7%
    },
  },
];

// Exactly 3 Classes Scheduled for Today (One for each subject)
export const INITIAL_CLASSES = [
  {
    id: 'CLS-DSA101-1',
    code: 'DSA101',
    name: 'Data Structures and Algorithms',
    professorId: 'FAC-001',
    professorName: 'Dr. Rajesh Sharma',
    room: 'Lab 201 (Computing Wing)',
    time: '09:00 AM - 10:15 AM',
    periodName: 'Period 1',
    status: 'ready', // 'ready' | 'live' | 'completed' | 'locked'
    order: 1,
    totalEnrolled: 5,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#2563EB',
    isStudentDaily: true,
    studentPeriodOrder: 1,
    description: 'Binary trees, balanced AVL/Red-Black trees, graph traversals, and asymptotic complexity.',
  },
  {
    id: 'CLS-OS102-1',
    code: 'OS102',
    name: 'Operating Systems',
    professorId: 'FAC-002',
    professorName: 'Prof. Meera Nair',
    room: 'Hall 102 (Systems Complex)',
    time: '10:30 AM - 11:45 AM',
    periodName: 'Period 2',
    status: 'ready',
    order: 2,
    totalEnrolled: 5,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#059669',
    isStudentDaily: true,
    studentPeriodOrder: 2,
    description: 'POSIX process synchronization, mutex locks, semaphores, deadlock avoidance, and virtual memory.',
  },
  {
    id: 'CLS-DBMS103-1',
    code: 'DBMS103',
    name: 'Database Management Systems',
    professorId: 'FAC-002',
    professorName: 'Prof. Meera Nair',
    room: 'Hall 305 (Database Lab)',
    time: '01:00 PM - 02:15 PM',
    periodName: 'Period 3',
    status: 'ready',
    order: 3,
    totalEnrolled: 5,
    sessionDate: 'Today',
    creditHours: 3,
    color: '#7C3AED',
    isStudentDaily: true,
    studentPeriodOrder: 3,
    description: 'Relational algebra, normalization (3NF/BCNF), B+ tree indexing, transaction ACID, and SQL query optimization.',
  },
];

// Initial attendance check-in records for today (starts completely empty)
export const INITIAL_ATTENDANCE_RECORDS = [];

// Initial teacher-to-student notifications (starts empty)
export const INITIAL_NOTIFICATIONS = [];
