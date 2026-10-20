-- ==============================================================================
-- AttendPulse - Supabase SQL Database Migration Schema
-- Copy and run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Students Table (Without avatar photos)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    roll_no TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    semester TEXT NOT NULL DEFAULT 'Semester 5',
    attendance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Classes Table with Explicit Timings
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    professor_id TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    room TEXT NOT NULL,
    time TEXT NOT NULL,
    period_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready', -- 'ready', 'live', 'completed', 'locked'
    order_num INTEGER NOT NULL DEFAULT 1,
    total_enrolled INTEGER NOT NULL DEFAULT 5,
    session_date TEXT NOT NULL DEFAULT 'Today',
    credit_hours INTEGER NOT NULL DEFAULT 4,
    color TEXT NOT NULL DEFAULT '#4F46E5',
    is_student_daily BOOLEAN NOT NULL DEFAULT false,
    student_period_order INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Attendance Records Table (For Real-Time QR Scans)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    class_code TEXT NOT NULL,
    class_name TEXT NOT NULL,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT 'Today',
    status TEXT NOT NULL DEFAULT 'present',
    method TEXT NOT NULL DEFAULT 'QR_SCAN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Staff Notifications Table (Sent by Staff to Students)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT 'Today',
    type TEXT NOT NULL DEFAULT 'warning',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS) & Public Policies for Anon Access
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read and write operations for frontend client
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Anon Select Students" ON public.students;
    DROP POLICY IF EXISTS "Public Anon Update Students" ON public.students;
    DROP POLICY IF EXISTS "Public Anon Insert Students" ON public.students;

    DROP POLICY IF EXISTS "Public Anon Select Classes" ON public.classes;
    DROP POLICY IF EXISTS "Public Anon Update Classes" ON public.classes;
    DROP POLICY IF EXISTS "Public Anon Insert Classes" ON public.classes;

    DROP POLICY IF EXISTS "Public Anon Select Records" ON public.attendance_records;
    DROP POLICY IF EXISTS "Public Anon Insert Records" ON public.attendance_records;
    DROP POLICY IF EXISTS "Public Anon Delete Records" ON public.attendance_records;

    DROP POLICY IF EXISTS "Public Anon Select Notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Public Anon Insert Notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Public Anon Update Notifications" ON public.notifications;

    CREATE POLICY "Public Anon Select Students" ON public.students FOR SELECT USING (true);
    CREATE POLICY "Public Anon Update Students" ON public.students FOR UPDATE USING (true);
    CREATE POLICY "Public Anon Insert Students" ON public.students FOR INSERT WITH CHECK (true);

    CREATE POLICY "Public Anon Select Classes" ON public.classes FOR SELECT USING (true);
    CREATE POLICY "Public Anon Update Classes" ON public.classes FOR UPDATE USING (true);
    CREATE POLICY "Public Anon Insert Classes" ON public.classes FOR INSERT WITH CHECK (true);

    CREATE POLICY "Public Anon Select Records" ON public.attendance_records FOR SELECT USING (true);
    CREATE POLICY "Public Anon Insert Records" ON public.attendance_records FOR INSERT WITH CHECK (true);
    CREATE POLICY "Public Anon Delete Records" ON public.attendance_records FOR DELETE USING (true);

    CREATE POLICY "Public Anon Select Notifications" ON public.notifications FOR SELECT USING (true);
    CREATE POLICY "Public Anon Insert Notifications" ON public.notifications FOR INSERT WITH CHECK (true);
    CREATE POLICY "Public Anon Update Notifications" ON public.notifications FOR UPDATE USING (true);
END $$;

-- 7. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 8. Seed Default Students (Without photos: clean initials only)
INSERT INTO public.students (id, name, roll_no, email, password, department, semester, attendance)
VALUES
('STU-001', 'Koshin', '21BCSE001', 'koshin@university.edu', 'koshin123', 'Computer Science & Engineering', 'Semester 5', '{"APP101":{"attended":28,"total":30},"DSA102":{"attended":26,"total":32},"OS103":{"attended":18,"total":27}}'::jsonb),
('STU-002', 'Abijith vasudev', '21BCSE002', 'abijith.vasudev@university.edu', 'abijith123', 'Computer Science & Engineering', 'Semester 5', '{"APP101":{"attended":20,"total":30},"DSA102":{"attended":29,"total":32},"OS103":{"attended":25,"total":27}}'::jsonb),
('STU-003', 'Enoch john', '21BCSE003', 'enoch.john@university.edu', 'enoch123', 'Computer Science & Engineering', 'Semester 5', '{"APP101":{"attended":21,"total":30},"DSA102":{"attended":22,"total":32},"OS103":{"attended":24,"total":27}}'::jsonb),
('STU-004', 'Thirush', '21BCSE004', 'thirush@university.edu', 'thirush123', 'Computer Science & Engineering', 'Semester 5', '{"APP101":{"attended":27,"total":30},"DSA102":{"attended":21,"total":32},"OS103":{"attended":19,"total":27}}'::jsonb),
('STU-005', 'Naresh', '21BCSE005', 'naresh@university.edu', 'naresh123', 'Computer Science & Engineering', 'Semester 5', '{"APP101":{"attended":29,"total":30},"DSA102":{"attended":30,"total":32},"OS103":{"attended":20,"total":27}}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  roll_no = EXCLUDED.roll_no,
  email = EXCLUDED.email;

-- 9. Seed Sequential Classes with Explicit Timetable Timings
INSERT INTO public.classes (id, code, name, professor_id, professor_name, room, time, period_name, status, order_num, total_enrolled, session_date, credit_hours, color, is_student_daily, student_period_order, description)
VALUES
-- Dr. Vance (APP101) - 4 Sessions
('CLS-APP101-1', 'APP101', 'Advanced Programming - Architecture & Clean Patterns', 'PROF-101', 'Dr. Robert Vance', 'Hall 401 (Software Systems Lab)', '09:00 AM - 10:15 AM', 'Period 1', 'ready', 1, 5, 'Today', 4, '#4F46E5', true, 1, 'Enterprise design patterns, clean architecture, dependency injection, and memory safety.'),
('CLS-APP101-2', 'APP101', 'Advanced Programming - Memory Safety & Pointers Lab', 'PROF-101', 'Dr. Robert Vance', 'Systems Lab 4B', '10:30 AM - 11:45 AM', 'Period 2', 'locked', 2, 5, 'Today', 4, '#6366f1', false, 0, 'Hands-on thread pools, atomic primitives, and asynchronous I/O debugging.'),
('CLS-APP101-3', 'APP101', 'Advanced Programming - Concurrency & Microservices', 'PROF-101', 'Dr. Robert Vance', 'Hall 401 (Software Systems Lab)', '01:00 PM - 02:15 PM', 'Period 3', 'locked', 3, 5, 'Today', 4, '#818cf8', false, 0, 'Peer code review walkthrough, performance profiling, and test coverage evaluation.'),
('CLS-APP101-4', 'APP101', 'Advanced Programming - Capstone Evaluation & Lab Demo', 'PROF-101', 'Dr. Robert Vance', 'Systems Lab 4B', '02:30 PM - 03:45 PM', 'Period 4', 'locked', 4, 5, 'Today', 4, '#4F46E5', true, 4, 'Live interactive demonstrations, benchmark testing, and automated evaluation.'),

-- Dr. Elena Rostova (DSA102) - 4 Sessions
('CLS-DSA102-1', 'DSA102', 'Data Structures - Algorithmic Complexity & Red-Black Trees', 'PROF-102', 'Dr. Elena Rostova', 'Hall 301 (Algorithmic Computing)', '09:00 AM - 10:15 AM', 'Period 1', 'ready', 1, 5, 'Today', 4, '#0284c7', false, 0, 'Dynamic programming, red-black self-balancing trees, and flow network analysis.'),
('CLS-DSA102-2', 'DSA102', 'Data Structures - Dynamic Programming & Flow Networks', 'PROF-102', 'Dr. Elena Rostova', 'Hall 301 (Algorithmic Computing)', '10:30 AM - 11:45 AM', 'Period 2', 'locked', 2, 5, 'Today', 4, '#06b6d4', true, 2, 'Memoization patterns, optimal substructure, and maximum bipartite matching.'),
('CLS-DSA102-3', 'DSA102', 'Data Structures - Graph Algorithms Lab', 'PROF-102', 'Dr. Elena Rostova', 'Lab 3B', '01:00 PM - 02:15 PM', 'Period 3', 'locked', 3, 5, 'Today', 4, '#0284c7', false, 0, 'Shortest path implementation, minimum spanning trees, and network flow algorithms.'),
('CLS-DSA102-4', 'DSA102', 'Data Structures - Competitive Problem Solving Workshop', 'PROF-102', 'Dr. Elena Rostova', 'Lab 3B', '02:30 PM - 03:45 PM', 'Period 4', 'locked', 4, 5, 'Today', 4, '#38bdf8', false, 0, 'LeetCode hard patterns, tree decompositions, and contest simulations.'),

-- Dr. Marcus Chen (OS103) - 4 Sessions
('CLS-OS103-1', 'OS103', 'Operating Systems - Kernel & Virtual Memory Virtualization', 'PROF-103', 'Dr. Marcus Chen', 'Hall 205 (Systems Architecture Complex)', '09:00 AM - 10:15 AM', 'Period 1', 'ready', 1, 5, 'Today', 4, '#059669', false, 0, 'Kernel system calls, page tables, TLB caching, and virtual address translation.'),
('CLS-OS103-2', 'OS103', 'Operating Systems - POSIX Synchronization Lab', 'PROF-103', 'Dr. Marcus Chen', 'Lab 2A', '10:30 AM - 11:45 AM', 'Period 2', 'locked', 2, 5, 'Today', 4, '#10b981', false, 0, 'POSIX mutexes, semaphores, deadlock simulation, and reader-writer problems.'),
('CLS-OS103-3', 'OS103', 'Operating Systems - File Systems & Disk Scheduling', 'PROF-103', 'Dr. Marcus Chen', 'Hall 205 (Systems Architecture Complex)', '01:00 PM - 02:15 PM', 'Period 3', 'locked', 3, 5, 'Today', 4, '#059669', true, 3, 'Ext4 inode structures, journaling, RAID architecture, and cache coherence.'),
('CLS-OS103-4', 'OS103', 'Operating Systems - Deadlock Prevention & Linux Internals', 'PROF-103', 'Dr. Marcus Chen', 'Lab 2A', '02:30 PM - 03:45 PM', 'Period 4', 'locked', 4, 5, 'Today', 4, '#34d399', false, 0, 'Banker algorithm, priority inversion, real-time scheduler, and eBPF tracing.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  room = EXCLUDED.room,
  time = EXCLUDED.time;
