// Mock Data for University Attendance Portal - 3 Specific Subjects & 3 Dedicated Teachers

export const TEACHERS = [
  {
    id: 'PROF-101',
    name: 'Dr. Robert Vance',
    empId: 'FAC-CSE-101',
    email: 'robert.vance@university.edu',
    password: 'vance123',
    department: 'Computer Science & Engineering',
    designation: 'Professor & Practice Head',
    subjectCode: 'APP101',
    subjectName: 'Advanced Programming and Practice',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'PROF-102',
    name: 'Dr. Elena Rostova',
    empId: 'FAC-CSE-102',
    email: 'elena.rostova@university.edu',
    password: 'elena123',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor & Algorithmics Lead',
    subjectCode: 'DSA102',
    subjectName: 'Data Structures and Algorithms',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'PROF-103',
    name: 'Dr. Marcus Chen',
    empId: 'FAC-CSE-103',
    email: 'marcus.chen@university.edu',
    password: 'chen123',
    department: 'Computer Science & Engineering',
    designation: 'Professor & Systems Director',
    subjectCode: 'OS103',
    subjectName: 'Operating Systems',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  },
];

// Students with login credentials and per-subject attendance records
export const STUDENTS = [
  {
    id: 'STU-001',
    name: 'Koshin',
    rollNo: '21BCSE001',
    email: 'koshin@university.edu',
    password: 'koshin123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    attendance: {
      APP101: { attended: 28, total: 30 }, // 93.3%
      DSA102: { attended: 26, total: 32 }, // 81.3%
      OS103:  { attended: 18, total: 27 }, // 66.7% (<75% - Warning)
    },
  },
  {
    id: 'STU-002',
    name: 'Abijith vasudev',
    rollNo: '21BCSE002',
    email: 'abijith.vasudev@university.edu',
    password: 'abijith123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    attendance: {
      APP101: { attended: 20, total: 30 }, // 66.7% (<75% - Warning)
      DSA102: { attended: 29, total: 32 }, // 90.6%
      OS103:  { attended: 25, total: 27 }, // 92.6%
    },
  },
  {
    id: 'STU-003',
    name: 'Enoch john',
    rollNo: '21BCSE003',
    email: 'enoch.john@university.edu',
    password: 'enoch123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    attendance: {
      APP101: { attended: 21, total: 30 }, // 70.0% (<75% - Warning)
      DSA102: { attended: 22, total: 32 }, // 68.8% (<75% - Warning)
      OS103:  { attended: 24, total: 27 }, // 88.9%
    },
  },
  {
    id: 'STU-004',
    name: 'Thirush',
    rollNo: '21BCSE004',
    email: 'thirush@university.edu',
    password: 'thirush123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    attendance: {
      APP101: { attended: 27, total: 30 }, // 90.0%
      DSA102: { attended: 21, total: 32 }, // 65.6% (<75% - Warning)
      OS103:  { attended: 19, total: 27 }, // 70.4% (<75% - Warning)
    },
  },
  {
    id: 'STU-005',
    name: 'Naresh',
    rollNo: '21BCSE005',
    email: 'naresh@university.edu',
    password: 'naresh123',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    attendance: {
      APP101: { attended: 29, total: 30 }, // 96.7%
      DSA102: { attended: 30, total: 32 }, // 93.8%
      OS103:  { attended: 20, total: 27 }, // 74.1% (<75% - Warning)
    },
  },
];

// TODAY'S SEQUENTIAL CLASS SCHEDULE FOR EACH FACULTY MEMBER (4 CLASSES PER DAY)
export const INITIAL_CLASSES = [
  // Dr. Robert Vance (APP101) - 4 Sessions Today
  {
    id: 'CLS-APP101-1',
    code: 'APP101',
    name: 'Advanced Programming - Architecture & Clean Patterns',
    professorId: 'PROF-101',
    professorName: 'Dr. Robert Vance',
    room: 'Hall 401 (Software Systems Lab)',
    time: '09:00 AM - 10:15 AM',
    periodName: 'Period 1',
    status: 'ready', // First class is ready to be conducted
    order: 1,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#4F46E5',
    isStudentDaily: true, // Included in student's 4-class daily schedule
    studentPeriodOrder: 1,
    description: 'Enterprise design patterns, clean architecture, dependency injection, and memory safety.',
  },
  {
    id: 'CLS-APP101-2',
    code: 'APP101',
    name: 'Advanced Programming - Memory Safety & Pointers Lab',
    professorId: 'PROF-101',
    professorName: 'Dr. Robert Vance',
    room: 'Systems Lab 4B',
    time: '10:30 AM - 11:45 AM',
    periodName: 'Period 2',
    status: 'locked', // Locked until Class 1 completes
    order: 2,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#6366f1',
    isStudentDaily: false,
    description: 'Hands-on thread pools, atomic primitives, and asynchronous I/O debugging.',
  },
  {
    id: 'CLS-APP101-3',
    code: 'APP101',
    name: 'Advanced Programming - Concurrency & Microservices',
    professorId: 'PROF-101',
    professorName: 'Dr. Robert Vance',
    room: 'Hall 401 (Software Systems Lab)',
    time: '01:00 PM - 02:15 PM',
    periodName: 'Period 3',
    status: 'locked', // Locked until Class 2 completes
    order: 3,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#818cf8',
    isStudentDaily: false,
    description: 'Peer code review walkthrough, performance profiling, and test coverage evaluation.',
  },
  {
    id: 'CLS-APP101-4',
    code: 'APP101',
    name: 'Advanced Programming - Capstone Evaluation & Lab Demo',
    professorId: 'PROF-101',
    professorName: 'Dr. Robert Vance',
    room: 'Systems Lab 4B',
    time: '02:30 PM - 03:45 PM',
    periodName: 'Period 4',
    status: 'locked', // Locked until Class 3 completes
    order: 4,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#4F46E5',
    isStudentDaily: true, // Included in student's 4-class daily schedule (Lab period)
    studentPeriodOrder: 4,
    description: 'Live interactive demonstrations, benchmark testing, and automated evaluation.',
  },

  // Dr. Elena Rostova (DSA102) - 4 Sessions Today
  {
    id: 'CLS-DSA102-1',
    code: 'DSA102',
    name: 'Data Structures - Algorithmic Complexity & Red-Black Trees',
    professorId: 'PROF-102',
    professorName: 'Dr. Elena Rostova',
    room: 'Hall 301 (Algorithmic Computing)',
    time: '09:00 AM - 10:15 AM',
    periodName: 'Period 1',
    status: 'ready',
    order: 1,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#0284c7',
    isStudentDaily: false,
    description: 'Dynamic programming, red-black self-balancing trees, and flow network analysis.',
  },
  {
    id: 'CLS-DSA102-2',
    code: 'DSA102',
    name: 'Data Structures - Dynamic Programming & Flow Networks',
    professorId: 'PROF-102',
    professorName: 'Dr. Elena Rostova',
    room: 'Hall 301 (Algorithmic Computing)',
    time: '10:30 AM - 11:45 AM',
    periodName: 'Period 2',
    status: 'locked',
    order: 2,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#06b6d4',
    isStudentDaily: true, // Included in student's 4-class daily schedule
    studentPeriodOrder: 2,
    description: 'Memoization patterns, optimal substructure, and maximum bipartite matching.',
  },
  {
    id: 'CLS-DSA102-3',
    code: 'DSA102',
    name: 'Data Structures - Graph Algorithms Lab',
    professorId: 'PROF-102',
    professorName: 'Dr. Elena Rostova',
    room: 'Lab 3B',
    time: '01:00 PM - 02:15 PM',
    periodName: 'Period 3',
    status: 'locked',
    order: 3,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#0284c7',
    isStudentDaily: false,
    description: 'Shortest path implementation, minimum spanning trees, and network flow algorithms.',
  },
  {
    id: 'CLS-DSA102-4',
    code: 'DSA102',
    name: 'Data Structures - Competitive Problem Solving Workshop',
    professorId: 'PROF-102',
    professorName: 'Dr. Elena Rostova',
    room: 'Lab 3B',
    time: '02:30 PM - 03:45 PM',
    periodName: 'Period 4',
    status: 'locked',
    order: 4,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#38bdf8',
    isStudentDaily: false,
    description: 'LeetCode hard patterns, tree decompositions, and contest simulations.',
  },

  // Dr. Marcus Chen (OS103) - 4 Sessions Today
  {
    id: 'CLS-OS103-1',
    code: 'OS103',
    name: 'Operating Systems - Kernel & Virtual Memory Virtualization',
    professorId: 'PROF-103',
    professorName: 'Dr. Marcus Chen',
    room: 'Hall 205 (Systems Architecture Complex)',
    time: '09:00 AM - 10:15 AM',
    periodName: 'Period 1',
    status: 'ready',
    order: 1,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#059669',
    isStudentDaily: false,
    description: 'Kernel system calls, page tables, TLB caching, and virtual address translation.',
  },
  {
    id: 'CLS-OS103-2',
    code: 'OS103',
    name: 'Operating Systems - POSIX Synchronization Lab',
    professorId: 'PROF-103',
    professorName: 'Dr. Marcus Chen',
    room: 'Lab 2A',
    time: '10:30 AM - 11:45 AM',
    periodName: 'Period 2',
    status: 'locked',
    order: 2,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#10b981',
    isStudentDaily: false,
    description: 'POSIX mutexes, semaphores, deadlock simulation, and reader-writer problems.',
  },
  {
    id: 'CLS-OS103-3',
    code: 'OS103',
    name: 'Operating Systems - File Systems & Disk Scheduling',
    professorId: 'PROF-103',
    professorName: 'Dr. Marcus Chen',
    room: 'Hall 205 (Systems Architecture Complex)',
    time: '01:00 PM - 02:15 PM',
    periodName: 'Period 3',
    status: 'locked',
    order: 3,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#059669',
    isStudentDaily: true, // Included in student's 4-class daily schedule
    studentPeriodOrder: 3,
    description: 'Ext4 inode structures, journaling, RAID architecture, and cache coherence.',
  },
  {
    id: 'CLS-OS103-4',
    code: 'OS103',
    name: 'Operating Systems - Deadlock Prevention & Linux Internals',
    professorId: 'PROF-103',
    professorName: 'Dr. Marcus Chen',
    room: 'Lab 2A',
    time: '02:30 PM - 03:45 PM',
    periodName: 'Period 4',
    status: 'locked',
    order: 4,
    totalEnrolled: 8,
    sessionDate: 'Today',
    creditHours: 4,
    color: '#34d399',
    isStudentDaily: false,
    description: 'Banker algorithm, priority inversion, real-time scheduler, and eBPF tracing.',
  },
];

// Initial Subject Stats for default student Koshin
export const INITIAL_SUBJECT_STATS = [
  {
    code: 'APP101',
    name: 'Advanced Programming and Practice',
    attended: 28,
    total: 30, // 93.3%
    professor: 'Dr. Robert Vance',
    color: '#4F46E5',
  },
  {
    code: 'DSA102',
    name: 'Data Structures and Algorithms',
    attended: 26,
    total: 32, // 81.3%
    professor: 'Dr. Elena Rostova',
    color: '#0284c7',
  },
  {
    code: 'OS103',
    name: 'Operating Systems',
    attended: 18,
    total: 27, // 66.7% (<75% - Warning)
    professor: 'Dr. Marcus Chen',
    color: '#DC2626',
  },
];

// Initial check-in records for today's live class
export const INITIAL_ATTENDANCE_RECORDS = [];

// Notifications in student portal are ONLY sent by staff (empty initially)
export const INITIAL_NOTIFICATIONS = [];

