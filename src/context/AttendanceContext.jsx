import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TEACHERS,
  STUDENTS,
  INITIAL_CLASSES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabaseClient';

const AttendanceContext = createContext(null);

// Purge old cached records so new accounts and subjects load cleanly
try {
  ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'].forEach((v) => {
    localStorage.removeItem(`attendpulse_classes_${v}`);
    localStorage.removeItem(`attendpulse_records_${v}`);
    localStorage.removeItem(`attendpulse_students_${v}`);
    localStorage.removeItem(`attendpulse_notifs_${v}`);
    localStorage.removeItem(`attendpulse_staff_notifs_${v}`);
    localStorage.removeItem(`attendpulse_role_${v}`);
    localStorage.removeItem(`unitrack_auth_session_${v}`);
    localStorage.removeItem(`attendpulse_curr_stu_${v}`);
    localStorage.removeItem(`attendpulse_curr_prof_${v}`);
    localStorage.removeItem(`attendpulse_sel_class_${v}`);
  });
} catch (e) {}

const STORAGE_KEY_CLASSES = 'attendpulse_classes_v9';
const STORAGE_KEY_RECORDS = 'attendpulse_records_v9';
const STORAGE_KEY_STUDENTS = 'attendpulse_students_v9';
const STORAGE_KEY_NOTIFS = 'attendpulse_notifs_v9';
const STORAGE_KEY_STAFF_NOTIFS = 'attendpulse_staff_notifs_v9';
const STORAGE_KEY_ROLE = 'attendpulse_role_v9';
const STORAGE_KEY_AUTH = 'unitrack_auth_session_v9';
const STORAGE_KEY_CURR_STUDENT = 'attendpulse_curr_stu_v9';
const STORAGE_KEY_CURR_TEACHER = 'attendpulse_curr_prof_v9';
const STORAGE_KEY_SEL_CLASS = 'attendpulse_sel_class_v9';

export const AttendanceProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ROLE) || 'student';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Default to false so user MUST log in with credentials
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    return saved === 'true';
  });

  const [activeStudentId, setActiveStudentId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CURR_STUDENT) || STUDENTS[0].id;
  });

  const [activeTeacherId, setActiveTeacherId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CURR_TEACHER) || TEACHERS[0].id;
  });

  const [classes, setClasses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_CLASSES;
  });

  const [selectedClassId, setSelectedClassId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SEL_CLASS) || null;
  });

  const [studentsList, setStudentsList] = useState(() => {
    const ALLOWED_NAMES = ['koshin', 'abijith', 'enoch', 'naresh', 'thirush'];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((s) =>
            ALLOWED_NAMES.some((n) => (s.name || '').toLowerCase().includes(n))
          );
          if (filtered.length === STUDENTS.length) return filtered;
        }
      }
    } catch (e) {}
    return STUDENTS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  // Student notifications (sent ONLY by staff)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Staff notifications (sent by students regarding low percentage)
  const [staffNotifications, setStaffNotifications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STAFF_NOTIFS);
    return saved ? JSON.parse(saved) : [];
  });

  const [qrTokenSalt, setQrTokenSalt] = useState(() => Date.now().toString());

  // Broadcast channel for multi-tab sync
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('attendpulse_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'ATTENDANCE_MARKED') {
          setAttendanceRecords(event.data.records);
          if (event.data.studentsList) {
            setStudentsList(event.data.studentsList);
          }
        } else if (event.data?.type === 'CLASS_STATUS_UPDATED') {
          setClasses(event.data.classes);
        } else if (event.data?.type === 'NOTIFICATION_SENT') {
          setNotifications(event.data.notifications);
        } else if (event.data?.type === 'STAFF_NOTIFICATION_SENT') {
          setStaffNotifications(event.data.staffNotifications);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  // Supabase Database Sync & Realtime Listener
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let realtimeSubscription = null;

    const syncWithSupabase = async () => {
      try {
        const [clsRes, stuRes, recRes, notifRes] = await Promise.all([
          supabase.from('classes').select('*'),
          supabase.from('students').select('*'),
          supabase.from('attendance_records').select('*').order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        ]);

        if (clsRes.data && clsRes.data.length > 0) {
          const mapped = clsRes.data.map((c) => ({
            ...c,
            order: c.order_num ?? c.order,
            isStudentDaily: c.is_student_daily ?? c.isStudentDaily,
            studentPeriodOrder: c.student_period_order ?? c.studentPeriodOrder,
            sessionDate: c.session_date ?? c.sessionDate,
            totalEnrolled: c.total_enrolled ?? c.totalEnrolled,
            creditHours: c.credit_hours ?? c.creditHours,
            professorId: c.professor_id ?? c.professorId,
            professorName: c.professor_name ?? c.professorName,
            periodName: c.period_name ?? c.periodName,
          }));
          const existingIds = new Set(mapped.map((c) => c.id));
          const merged = [...mapped, ...INITIAL_CLASSES.filter((ic) => !existingIds.has(ic.id))];
          setClasses(merged);
        } else {
          setClasses((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : INITIAL_CLASSES));
        }

        if (stuRes.data && stuRes.data.length > 0) {
          const ALLOWED_NAMES = ['koshin', 'abijith', 'enoch', 'naresh', 'thirush'];
          const filtered = stuRes.data
            .filter((s) => ALLOWED_NAMES.some((n) => (s.name || '').toLowerCase().includes(n)))
            .map((s) => {
              const defaultStu = STUDENTS.find(
                (d) => d.rollNo === (s.roll_no ?? s.rollNo) || d.id === s.id
              );
              return {
                ...s,
                rollNo: s.roll_no ?? s.rollNo,
                attendance:
                  s.attendance && s.attendance.DSA101
                    ? s.attendance
                    : defaultStu
                    ? defaultStu.attendance
                    : s.attendance,
              };
            });
          if (filtered.length > 0) {
            setStudentsList(filtered);
          }
        }

        if (recRes.data) {
          setAttendanceRecords(
            recRes.data.map((r) => ({
              ...r,
              classId: r.class_id ?? r.classId,
              classCode: r.class_code ?? r.classCode,
              className: r.class_name ?? r.className,
              studentId: r.student_id ?? r.studentId,
              studentName: r.student_name ?? r.studentName,
              rollNo: r.roll_no ?? r.rollNo,
            }))
          );
        }

        if (notifRes.data && notifRes.data.length > 0) {
          setNotifications(
            notifRes.data.map((n) => ({
              ...n,
              studentId: n.student_id ?? n.studentId,
              senderName: n.sender_name ?? n.senderName,
              subjectCode: n.subject_code ?? n.subjectCode,
              isRead: n.is_read ?? n.isRead,
            }))
          );
        }
      } catch (err) {
        console.warn('Initial Supabase sync fallback to local storage:', err);
      }

      // Supabase Realtime channel for multi-device instant sync
      try {
        realtimeSubscription = supabase
          .channel('attendpulse_db_changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'attendance_records' },
            (payload) => {
              if (payload.new) {
                const r = payload.new;
                const newRec = {
                  id: r.id,
                  classId: r.class_id,
                  classCode: r.class_code,
                  className: r.class_name,
                  studentId: r.student_id,
                  studentName: r.student_name,
                  rollNo: r.roll_no,
                  timestamp: r.timestamp,
                  date: r.date,
                  status: r.status,
                  method: r.method,
                };
                setAttendanceRecords((prev) => {
                  if (prev.some((x) => x.id === newRec.id)) return prev;
                  return [newRec, ...prev];
                });
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'attendance_records' },
            (payload) => {
              if (payload.old) {
                setAttendanceRecords((prev) => prev.filter((r) => r.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'students' },
            (payload) => {
              if (payload.new) {
                const updatedStu = payload.new;
                setStudentsList((prev) =>
                  prev.map((s) =>
                    s.id === updatedStu.id || (updatedStu.roll_no && (s.rollNo === updatedStu.roll_no || s.roll_no === updatedStu.roll_no))
                      ? {
                          ...s,
                          attendance: updatedStu.attendance || s.attendance,
                        }
                      : s
                  )
                );
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'classes' },
            (payload) => {
              if (payload.new) {
                const c = payload.new;
                setClasses((prev) =>
                  prev.map((item) => (item.id === c.id ? { ...item, status: c.status } : item))
                );
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Supabase realtime subscription note:', e);
      }
    };

    syncWithSupabase();

    // 3-second background polling ensures multi-device instant sync even if WebSockets are slow
    const pollTimer = setInterval(async () => {
      try {
        const { data: latest } = await supabase
          .from('attendance_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (latest !== undefined && latest !== null) {
          const mapped = latest.map((r) => ({
            id: r.id,
            classId: r.class_id ?? r.classId,
            classCode: r.class_code ?? r.classCode,
            className: r.class_name ?? r.className,
            studentId: r.student_id ?? r.studentId,
            studentName: r.student_name ?? r.studentName,
            rollNo: r.roll_no ?? r.rollNo,
            timestamp: r.timestamp,
            date: r.date,
            status: r.status,
            method: r.method,
          }));

          setAttendanceRecords(mapped);
        }
      } catch (e) {}
    }, 3000);

    return () => {
      clearInterval(pollTimer);
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
      }
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(studentsList));
  }, [studentsList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STAFF_NOTIFS, JSON.stringify(staffNotifications));
  }, [staffNotifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURR_STUDENT, activeStudentId);
  }, [activeStudentId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURR_TEACHER, activeTeacherId);
  }, [activeTeacherId]);

  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem(STORAGE_KEY_SEL_CLASS, selectedClassId);
    }
  }, [selectedClassId]);

  // Current logged in student & teacher objects
  const currentStudent =
    studentsList.find(
      (s) =>
        s.id === activeStudentId ||
        s.rollNo === activeStudentId ||
        (s.id === 's1' && activeStudentId === 'STU-001') ||
        (s.id === 'STU-001' && activeStudentId === 's1')
    ) || studentsList[0];
  const currentProfessor = TEACHERS.find((t) => t.id === activeTeacherId) || TEACHERS[0];

  // Distinct 3 subjects for student aggregate statistics
  const DISTINCT_SUBJECTS = [
    { code: 'DSA101', name: 'Data Structures and Algorithms', professor: 'Dr. Rajesh Sharma', color: '#2457FF' },
    { code: 'OS102', name: 'Operating Systems', professor: 'Prof. Meera Nair', color: '#059669' },
    { code: 'DBMS103', name: 'Database Management Systems', professor: 'Prof. Meera Nair', color: '#7C3AED' },
  ];

  const subjectStats = DISTINCT_SUBJECTS.map((sub) => {
    const studentSubjectData = currentStudent.attendance?.[sub.code] || { attended: 0, total: 30 };
    return {
      code: sub.code,
      name: sub.name,
      attended: studentSubjectData.attended,
      total: studentSubjectData.total,
      professor: sub.professor,
      color: sub.color,
    };
  });

  const totalAttended = subjectStats.reduce((acc, curr) => acc + curr.attended, 0);
  const totalClassesCount = subjectStats.reduce((acc, curr) => acc + curr.total, 0);
  const overallPercentage = totalClassesCount > 0 ? ((totalAttended / totalClassesCount) * 100).toFixed(1) : 0;

  // Active live class helper (only 1 can be live across the entire portal)
  const activeLiveClass = classes.find((c) => c.status === 'live') || null;

  // Teacher portal data: classes assigned to current teacher
  const effectiveClasses = Array.isArray(classes) && classes.length > 0 ? classes : INITIAL_CLASSES;
  const assignedCodes = Array.isArray(currentProfessor?.assignedSubjects)
    ? currentProfessor.assignedSubjects.map((s) => s.toUpperCase())
    : [currentProfessor?.subjectCode?.toUpperCase()].filter(Boolean);

  let teacherClasses = effectiveClasses
    .filter((c) => {
      const cProfId = (c.professorId || c.professor_id || '').toLowerCase();
      const currProfId = (currentProfessor?.id || '').toLowerCase();
      const cCode = (c.code || '').toUpperCase();
      return (cProfId && cProfId === currProfId) || assignedCodes.includes(cCode);
    })
    .sort((a, b) => (a.order || a.order_num || 0) - (b.order || b.order_num || 0));

  if (teacherClasses.length === 0) {
    teacherClasses = INITIAL_CLASSES
      .filter((c) => c.professorId === currentProfessor?.id || assignedCodes.includes((c.code || '').toUpperCase()))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Student portal data: exactly 3 classes for student's daily schedule
  let studentDailyClasses = effectiveClasses
    .filter((c) => c.isStudentDaily || c.is_student_daily)
    .sort((a, b) => (a.studentPeriodOrder || a.student_period_order || 0) - (b.studentPeriodOrder || b.student_period_order || 0));

  if (studentDailyClasses.length === 0) {
    studentDailyClasses = INITIAL_CLASSES
      .filter((c) => c.isStudentDaily)
      .sort((a, b) => (a.studentPeriodOrder || 0) - (b.studentPeriodOrder || 0));
  }

  // Determine current active/selected teacher class
  const currentTeacherClass =
    teacherClasses.find((c) => c.id === selectedClassId) ||
    teacherClasses.find((c) => c.status === 'live') ||
    teacherClasses.find((c) => c.status === 'ready') ||
    teacherClasses[0];

  // Active subject for current teacher class
  const activeTeacherSubjectCode = currentTeacherClass?.code || currentProfessor?.subjectCode || 'DSA101';

  // Students attendance list for current teacher's active subject
  const teacherSubjectStudents = studentsList.map((stu) => {
    const defaultAtt = STUDENTS.find((s) => s.id === stu.id)?.attendance?.[activeTeacherSubjectCode] || { attended: 22, total: 30 };
    const stuAtt = stu.attendance?.[activeTeacherSubjectCode];
    const att = (stuAtt && (stuAtt.attended !== undefined || stuAtt.total !== undefined)) ? stuAtt : defaultAtt;
    const pct = att.total > 0 ? ((att.attended / att.total) * 100).toFixed(1) : '0.0';
    const isBelow75 = parseFloat(pct) < 75;
    return {
      ...stu,
      subjectCode: activeTeacherSubjectCode,
      subjectAttended: att.attended,
      subjectTotal: att.total,
      percentage: pct,
      isBelow75,
    };
  });

  // Notifications for current student (received ONLY from staff)
  const studentNotifications = notifications.filter((n) => n.studentId === currentStudent.id);
  const unreadNotificationCount = studentNotifications.filter((n) => !n.isRead).length;

  // Notifications for current staff member (sent by students with low attendance)
  const currentTeacherStaffNotifs = staffNotifications.filter(
    (n) => n.teacherId === currentProfessor.id || n.subjectCode === currentProfessor.subjectCode
  );
  const unreadStaffNotifsCount = currentTeacherStaffNotifs.filter((n) => !n.isRead).length;

  // Switch Role
  const switchRole = (newRole) => {
    setRole(newRole);
  };

  // Switch Teacher
  const switchTeacher = (teacherId) => {
    setActiveTeacherId(teacherId);
    setSelectedClassId(null);
    sounds.playBeep();
  };

  // Switch Student
  const switchStudent = (studentId) => {
    setActiveStudentId(studentId);
    sounds.playBeep();
  };

  // Single unified login handler
  const login = (identifier, password, chosenRole) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const lookupStudents = (studentsList && studentsList.length > 0)
      ? [...studentsList, ...STUDENTS]
      : STUDENTS;

    const isStudentMatch = (s) => {
      const sEmail = (s.email || '').toLowerCase().trim();
      const sRoll = (s.rollNo || s.roll_no || '').toLowerCase().trim();
      const sName = (s.name || '').toLowerCase().trim();
      const sFirstName = sName.split(' ')[0];
      const sUsername = (s.username || '').toLowerCase().trim();
      const sId = (s.id || '').toLowerCase().trim();

      const idMatches =
        sEmail === cleanId ||
        sRoll === cleanId ||
        sName === cleanId ||
        sFirstName === cleanId ||
        sUsername === cleanId ||
        sId === cleanId;

      if (!idMatches) return false;

      return (
        cleanPass === 'student123' ||
        cleanPass === 'password' ||
        cleanPass === 'password123' ||
        cleanPass === `${sFirstName}123` ||
        cleanPass === `${sUsername}123` ||
        cleanPass === s.password
      );
    };

    const isTeacherMatch = (t) => {
      const tEmail = (t.email || '').toLowerCase().trim();
      const tEmpId = (t.empId || t.emp_id || '').toLowerCase().trim();
      const tName = (t.name || '').toLowerCase().trim();
      const tFirstName = tName.split(' ')[0];
      const tUsername = (t.username || '').toLowerCase().trim();
      const tId = (t.id || '').toLowerCase().trim();

      const idMatches =
        tEmail === cleanId ||
        tEmpId === cleanId ||
        tUsername === cleanId ||
        tName.includes(cleanId) ||
        tFirstName.includes(cleanId) ||
        tId === cleanId ||
        (cleanId === 'teacher1' && t.id === 'FAC-001') ||
        (cleanId === 'teacher2' && t.id === 'FAC-002');

      if (!idMatches) return false;

      return (
        cleanPass === 'teacher123' ||
        cleanPass === 'faculty123' ||
        cleanPass === 'staff123' ||
        cleanPass === 'password' ||
        cleanPass === 'password123' ||
        cleanPass === `${tUsername}123` ||
        cleanPass === t.password
      );
    };

    if (chosenRole === 'student') {
      const matched = lookupStudents.find(isStudentMatch);
      if (matched) {
        setActiveStudentId(matched.id);
        setRole('student');
        setIsAuthenticated(true);
        sounds.playSuccess();
        return { success: true, role: 'student', user: matched };
      }
    } else if (chosenRole === 'professor' || chosenRole === 'staff' || chosenRole === 'teacher') {
      const matched = TEACHERS.find(isTeacherMatch);
      if (matched) {
        setActiveTeacherId(matched.id);
        setRole('professor');
        setIsAuthenticated(true);
        sounds.playSuccess();
        return { success: true, role: 'professor', user: matched };
      }
    } else {
      // Auto-detect role
      const studentMatch = lookupStudents.find(isStudentMatch);
      if (studentMatch) {
        setActiveStudentId(studentMatch.id);
        setRole('student');
        setIsAuthenticated(true);
        sounds.playSuccess();
        return { success: true, role: 'student', user: studentMatch };
      }

      const teacherMatch = TEACHERS.find(isTeacherMatch);
      if (teacherMatch) {
        setActiveTeacherId(teacherMatch.id);
        setRole('professor');
        setIsAuthenticated(true);
        sounds.playSuccess();
        return { success: true, role: 'professor', user: teacherMatch };
      }
    }

    sounds.playError();
    return {
      success: false,
      error: 'Invalid credentials. Please verify your student email/roll no or staff email/ID and password.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem('attendpulse_auth_v6');
    sounds.playBeep();
  };

  // Generate QR payload
  const getQrPayload = (classId) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls) return '';
    return JSON.stringify({
      protocol: 'ATTEND_PULSE_V2',
      classId: cls.id,
      code: cls.code,
      name: cls.name,
      professorId: cls.professorId,
      room: cls.room,
      date: new Date().toISOString().split('T')[0],
      sessionToken: `${cls.id}_${qrTokenSalt}`,
      timestamp: Date.now(),
    });
  };

  const rotateQrToken = () => {
    setQrTokenSalt(Date.now().toString());
  };

  // Select a class in teacher portal
  const selectTeacherClass = (classId) => {
    setSelectedClassId(classId);
    sounds.playBeep();
  };

  // Activate Class QR Code: Makes this class LIVE
  const activateClassQr = (classId) => {
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return { ...c, status: 'live' };
      }
      // Only 1 class can be live at a time
      if (c.status === 'live') {
        return { ...c, status: 'completed' };
      }
      return c;
    });

    setClasses(updated);
    setSelectedClassId(classId);
    rotateQrToken();

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({ type: 'CLASS_STATUS_UPDATED', classes: updated });
      channel.close();
    } catch (e) {}

    // Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase.from('classes').update({ status: 'live' }).eq('id', classId).then(() => {});
      const previousLive = classes.find((c) => c.status === 'live');
      if (previousLive && previousLive.id !== classId) {
        supabase.from('classes').update({ status: 'completed' }).eq('id', previousLive.id).then(() => {});
      }
    }

    sounds.playSuccess();
    return { success: true };
  };

  // Complete a Class Session: Marks current class 'completed' and UNLOCKS the next class!
  const completeClassSession = (classId) => {
    const currentClass = classes.find((c) => c.id === classId);
    if (!currentClass) return;

    // Find all classes for this teacher in order
    const profClasses = classes
      .filter((c) => c.professorId === currentClass.professorId || c.code === currentClass.code)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const currentIndex = profClasses.findIndex((c) => c.id === classId);
    const nextClass = currentIndex >= 0 && currentIndex < profClasses.length - 1 ? profClasses[currentIndex + 1] : null;

    const updated = classes.map((c) => {
      if (c.id === classId) {
        return { ...c, status: 'completed' };
      }
      // Unlock the next class!
      if (nextClass && c.id === nextClass.id && c.status === 'locked') {
        return { ...c, status: 'ready' };
      }
      return c;
    });

    setClasses(updated);

    // Automatically switch selection to newly unlocked class if available
    if (nextClass) {
      setSelectedClassId(nextClass.id);
    }

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({ type: 'CLASS_STATUS_UPDATED', classes: updated });
      channel.close();
    } catch (e) {}

    // Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase.from('classes').update({ status: 'completed' }).eq('id', classId).then(() => {});
      if (nextClass) {
        supabase.from('classes').update({ status: 'ready' }).eq('id', nextClass.id).then(() => {});
      }
    }

    sounds.playSuccess();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#2457FF', '#DFF7FF', '#10b981', '#5784FF'],
    });

    return {
      success: true,
      completedClass: currentClass,
      nextUnlockedClass: nextClass,
    };
  };

  // Restart Teacher Classes: Resets all sessions for this teacher so staff can restart after completing all classes
  const restartTeacherClasses = (teacherId) => {
    const profId = teacherId || currentProfessor.id;
    const profCode = currentProfessor.subjectCode;

    // Find all classes for this teacher
    const profClasses = classes
      .filter((c) => {
        const cProfId = (c.professorId || c.professor_id || '').toLowerCase();
        const currProfId = (profId || '').toLowerCase();
        const cCode = (c.code || '').toLowerCase();
        const currSubCode = (profCode || '').toLowerCase();
        return (cProfId && cProfId === currProfId) || (cCode && cCode === currSubCode);
      })
      .sort((a, b) => (a.order || a.order_num || 0) - (b.order || b.order_num || 0));

    const profClassIds = new Set(profClasses.map((c) => c.id));

    // Reset classes: session 1 becomes 'ready', subsequent sessions become 'locked'
    const updatedClasses = classes.map((c) => {
      if (profClassIds.has(c.id)) {
        const order = c.order || c.order_num || 1;
        return {
          ...c,
          status: order === 1 ? 'ready' : 'locked',
        };
      }
      return c;
    });

    setClasses(updatedClasses);

    // Set selected class to the first session
    if (profClasses.length > 0) {
      setSelectedClassId(profClasses[0].id);
    }

    // Clear today's attendance records for these restarted classes so students can scan again
    const updatedRecords = attendanceRecords.filter((r) => !profClassIds.has(r.classId));
    setAttendanceRecords(updatedRecords);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'CLASS_STATUS_UPDATED',
        classes: updatedClasses,
        records: updatedRecords,
      });
      channel.close();
    } catch (e) {}

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      profClasses.forEach((cls) => {
        const order = cls.order || cls.order_num || 1;
        const newStatus = order === 1 ? 'ready' : 'locked';
        supabase.from('classes').update({ status: newStatus }).eq('id', cls.id).then(() => {});
      });
    }

    sounds.playSuccess();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#2457FF', '#DFF7FF', '#10b981', '#5784FF'],
    });

    return {
      success: true,
      message: 'Classes schedule has been reset & restarted! Session 1 is now ready to conduct.',
    };
  };

  // Set class status utility
  const setClassStatus = (classId, newStatus) => {
    if (newStatus === 'live') {
      activateClassQr(classId);
    } else if (newStatus === 'completed') {
      completeClassSession(classId);
    } else {
      const updated = classes.map((c) => (c.id === classId ? { ...c, status: newStatus } : c));
      setClasses(updated);
    }
  };

  // Mark attendance from scan
  const markAttendanceFromScan = (scannedText) => {
    try {
      let data = null;
      if (typeof scannedText === 'string') {
        const trimmed = scannedText.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            data = JSON.parse(trimmed);
          } catch (e) {}
        }

        if (!data) {
          if (trimmed.includes('scan=') || trimmed.includes('classId=')) {
            const match = trimmed.match(/(?:scan|classId)=([^&#\s]+)/i);
            if (match) {
              const classParam = decodeURIComponent(match[1]);
              const matchedClass = classes.find(
                (c) =>
                  c.id.toLowerCase() === classParam.toLowerCase() ||
                  c.code.toLowerCase() === classParam.toLowerCase()
              );
              if (matchedClass) {
                data = { classId: matchedClass.id, code: matchedClass.code, name: matchedClass.name };
              }
            }
          }

          if (!data) {
            const matchedClass = classes.find(
              (c) =>
                c.id.toLowerCase() === trimmed.toLowerCase() ||
                c.code.toLowerCase() === trimmed.toLowerCase() ||
                trimmed.toLowerCase().includes(c.code.toLowerCase()) ||
                trimmed.toLowerCase().includes(c.id.toLowerCase())
            );
            if (matchedClass) {
              data = { classId: matchedClass.id, code: matchedClass.code, name: matchedClass.name };
            }
          }
        }
      } else if (scannedText && typeof scannedText === 'object') {
        data = scannedText;
      }

      if (!data) {
        throw new Error('Invalid QR code format');
      }

      const cls = classes.find((c) => c.id === data.classId || c.code === data.code);
      if (!cls) {
        sounds.playError();
        return {
          success: false,
          error: 'Unrecognized classroom QR code. Please scan the official display.',
        };
      }

      if (cls.status === 'completed') {
        sounds.playError();
        return {
          success: false,
          error: `Attendance session for ${cls.name} (${cls.code}) has been closed by the faculty. No further QR submissions are accepted.`,
        };
      }

      // If class is not yet marked live in this client, scanning the professor's QR code activates it
      if (cls.status !== 'live') {
        setClasses((prev) =>
          prev.map((c) => (c.id === cls.id ? { ...c, status: 'live' } : c))
        );
      }

      // Check if student already marked today for this specific class session
      const alreadyMarked = attendanceRecords.some(
        (rec) =>
          rec.classId === cls.id &&
          (rec.studentId === currentStudent.id ||
            rec.rollNo === currentStudent.rollNo ||
            (currentStudent.roll_no && rec.rollNo === currentStudent.roll_no))
      );

      if (alreadyMarked) {
        sounds.playSuccess();
        const existingRec = attendanceRecords.find(
          (rec) =>
            rec.classId === cls.id &&
            (rec.studentId === currentStudent.id ||
              rec.rollNo === currentStudent.rollNo ||
              (currentStudent.roll_no && rec.rollNo === currentStudent.roll_no))
        );
        const currentAtt = currentStudent.attendance?.[cls.code] || { attended: 0, total: 30 };
        const currentSubPct = currentAtt.total > 0 ? ((currentAtt.attended / currentAtt.total) * 100).toFixed(1) : '0.0';
        return {
          success: true,
          alreadyMarked: true,
          message: `Attendance is verified and marked for ${cls.name}! Status: PRESENT ✓`,
          record: existingRec || {
            timestamp: 'Verified today',
            status: 'present',
            method: 'QR_SCAN',
          },
          classInfo: cls,
          prevSubAttended: currentAtt.attended,
          newSubAttended: currentAtt.attended,
          prevSubTotal: currentAtt.total,
          newSubTotal: currentAtt.total,
          prevTotalAttended: totalAttended,
          newTotalAttended: totalAttended,
          totalClassesCount,
          prevSubPct: currentSubPct,
          newSubPct: currentSubPct,
          prevOverallPct: overallPercentage,
          newOverallPct: overallPercentage,
          studentName: currentStudent.name,
          rollNo: currentStudent.rollNo,
        };
      }

      // Create new record
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newRecord = {
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        classId: cls.id,
        classCode: cls.code,
        className: cls.name,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        rollNo: currentStudent.rollNo,
        timestamp: timeStr,
        date: 'Today',
        status: 'present',
        method: 'QR_SCAN',
      };

      const updatedRecords = [newRecord, ...attendanceRecords];
      setAttendanceRecords(updatedRecords);

      // Compute previous and new attendance percentages for THIS particular subject
      const currentAtt = currentStudent.attendance?.[cls.code] || { attended: 0, total: 30 };
      const prevSubAttended = currentAtt.attended;
      const prevSubTotal = currentAtt.total;
      const prevSubPct = prevSubTotal > 0 ? ((prevSubAttended / prevSubTotal) * 100).toFixed(1) : '0.0';

      const newSubAttended = prevSubAttended + 1;
      const newSubTotal = Math.max(prevSubTotal, newSubAttended);
      const newSubPct = ((newSubAttended / newSubTotal) * 100).toFixed(1);

      const prevTotalAttended = totalAttended;
      const prevOverallPct = overallPercentage;
      const newTotalAttended = prevTotalAttended + 1;
      const newOverallPct = totalClassesCount > 0 ? ((newTotalAttended / totalClassesCount) * 100).toFixed(1) : '0.0';

      // Increment student attendance for this particular subject
      const updatedStudents = studentsList.map((stu) => {
        const isMatch =
          stu.id === currentStudent.id ||
          (currentStudent.rollNo && (stu.rollNo === currentStudent.rollNo || stu.roll_no === currentStudent.rollNo)) ||
          (currentStudent.roll_no && (stu.rollNo === currentStudent.roll_no || stu.roll_no === currentStudent.roll_no)) ||
          (currentStudent.email && stu.email === currentStudent.email);
        if (isMatch) {
          const stuAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
          const updatedAttended = stuAtt.attended + 1;
          const updatedTotal = Math.max(stuAtt.total, updatedAttended);
          return {
            ...stu,
            attendance: {
              ...stu.attendance,
              [cls.code]: {
                attended: updatedAttended,
                total: updatedTotal,
              },
            },
          };
        }
        return stu;
      });
      setStudentsList(updatedStudents);

      try {
        const channel = new BroadcastChannel('attendpulse_sync');
        channel.postMessage({
          type: 'ATTENDANCE_MARKED',
          records: updatedRecords,
          studentsList: updatedStudents,
        });
        channel.close();
      } catch (e) {}

      // Save to Supabase
      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('attendance_records')
          .insert({
            id: newRecord.id,
            class_id: newRecord.classId,
            class_code: newRecord.classCode,
            class_name: newRecord.className,
            student_id: newRecord.studentId,
            student_name: newRecord.studentName,
            roll_no: newRecord.rollNo,
            timestamp: newRecord.timestamp,
            date: newRecord.date,
            status: newRecord.status,
            method: newRecord.method,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase attendance record save note:', error);
          });

        const targetStudent = updatedStudents.find(
          (s) =>
            s.id === currentStudent.id ||
            s.rollNo === currentStudent.rollNo ||
            (currentStudent.roll_no && s.rollNo === currentStudent.roll_no)
        );
        if (targetStudent) {
          supabase
            .from('students')
            .update({ attendance: targetStudent.attendance })
            .eq('id', targetStudent.id)
            .then(({ error }) => {
              if (error) console.warn('Supabase student update note:', error);
            });
        }
      }

      sounds.playSuccess();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2457FF', '#DFF7FF', '#10b981', '#5784FF', '#fbbf24'],
      });

      return {
        success: true,
        message: `Attendance marked successfully for ${cls.name}!`,
        record: newRecord,
        classInfo: cls,
        prevSubAttended,
        newSubAttended,
        prevSubTotal,
        newSubTotal,
        prevTotalAttended,
        newTotalAttended,
        totalClassesCount,
        prevSubPct,
        newSubPct,
        prevOverallPct,
        newOverallPct,
        studentName: currentStudent.name,
        rollNo: currentStudent.rollNo,
      };
    } catch (err) {
      sounds.playError();
      return {
        success: false,
        error: err.message || 'Failed to process QR code.',
      };
    }
  };

  // Staff Sends Low Attendance Reminder Notification to a Student
  const sendStudentReminder = (studentId, customNote, specificSubjectCode) => {
    const student = studentsList.find((s) => s.id === studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    const targetSubCode = specificSubjectCode || currentTeacherClass?.code || currentProfessor?.subjectCode || 'DSA101';
    const subObj = DISTINCT_SUBJECTS.find((s) => s.code === targetSubCode) || {
      code: targetSubCode,
      name: currentProfessor?.subjectName || 'Course',
    };

    const studentSubjectData = student.attendance?.[targetSubCode] || { attended: 0, total: 30 };
    const pct = studentSubjectData.total > 0
      ? ((studentSubjectData.attended / studentSubjectData.total) * 100).toFixed(1)
      : '0.0';

    const defaultMsg = `Your attendance in ${subObj.name} (${subObj.code}) has fallen below 75% (${pct}%). Please attend upcoming classes regularly to improve your attendance.`;

    const newNotification = {
      id: `NOTIF-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      teacherId: currentProfessor.id,
      teacherName: currentProfessor.name,
      subjectCode: subObj.code,
      subjectName: subObj.name,
      percentage: pct,
      senderRole: 'staff',
      message: customNote || defaultMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      isRead: false,
    };

    const updatedNotifs = [newNotification, ...notifications];
    setNotifications(updatedNotifs);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'NOTIFICATION_SENT',
        notifications: updatedNotifs,
      });
      channel.close();
    } catch (e) {}

    // Persist to Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase.from('notifications').insert({
        id: newNotification.id,
        student_id: newNotification.studentId,
        student_name: newNotification.studentName,
        teacher_id: newNotification.teacherId,
        teacher_name: newNotification.teacherName,
        subject_code: newNotification.subjectCode,
        subject_name: newNotification.subjectName,
        message: newNotification.message,
        percentage: newNotification.percentage,
        is_read: false,
      }).then(({ error }) => {
        if (error) console.warn('Supabase notification note:', error);
      });
    }

    sounds.playSuccess();
    return {
      success: true,
      message: `Low attendance notification sent directly to ${student.name} (${student.rollNo}) for ${subObj.name}!`,
    };
  };

  // Student Sends Low Attendance Notification to Staff
  // (Button for the student to notify staff that they have low percentage)
  const sendStudentShortageNotice = (subjectCode, studentNote) => {
    const sub = DISTINCT_SUBJECTS.find((s) => s.code === subjectCode) || DISTINCT_SUBJECTS[0];
    const teacher = TEACHERS.find((t) => t.subjectCode === sub.code) || TEACHERS[0];
    const studentSubjectData = currentStudent.attendance?.[sub.code] || { attended: 0, total: 30 };
    const pct = studentSubjectData.total > 0
      ? ((studentSubjectData.attended / studentSubjectData.total) * 100).toFixed(1)
      : '0.0';

    const newStaffNotification = {
      id: `STAFF-NOTIF-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      rollNo: currentStudent.rollNo,
      teacherId: teacher.id,
      teacherName: teacher.name,
      subjectCode: sub.code,
      subjectName: sub.name,
      percentage: pct,
      message:
        studentNote ||
        `Student ${currentStudent.name} (${currentStudent.rollNo}) has formally notified you regarding their low attendance in ${sub.name} (${pct}%). They have acknowledged the shortage and requested review / makeup class consideration.`,
      timestamp: 'Just now',
      isRead: false,
    };

    const updatedStaffNotifs = [newStaffNotification, ...staffNotifications];
    setStaffNotifications(updatedStaffNotifs);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'STAFF_NOTIFICATION_SENT',
        staffNotifications: updatedStaffNotifs,
      });
      channel.close();
    } catch (e) {}

    sounds.playSuccess();
    return {
      success: true,
      message: `Low attendance notification sent to ${teacher.name} (${sub.code})!`,
    };
  };

  // Mark student notification read
  const markNotificationRead = (notifId) => {
    const updated = notifications.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
    setNotifications(updated);
  };

  // Mark staff notification read
  const markStaffNotificationRead = (notifId) => {
    const updated = staffNotifications.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
    setStaffNotifications(updated);
  };

  // Helper to match student across different ID formats
  const isStudentRecMatch = (rec, classId, student) => {
    if (rec.classId !== classId) return false;
    const stuId = (student.id || '').toLowerCase();
    const stuRoll = (student.rollNo || student.roll_no || '').toLowerCase();
    const recStuId = (rec.studentId || '').toLowerCase();
    const recRoll = (rec.rollNo || '').toLowerCase();
    return (
      (stuId && recStuId === stuId) ||
      (stuRoll && recRoll === stuRoll) ||
      (stuRoll && recStuId === stuRoll) ||
      (stuId && recRoll === stuId)
    );
  };

  // Helper to match student in studentList
  const isStudentListMatch = (stu, student) => {
    const stuId = (stu.id || '').toLowerCase();
    const stuRoll = (stu.rollNo || stu.roll_no || '').toLowerCase();
    const targetId = (student.id || '').toLowerCase();
    const targetRoll = (student.rollNo || student.roll_no || '').toLowerCase();
    return (
      (targetId && stuId === targetId) ||
      (targetRoll && stuRoll === targetRoll) ||
      (targetRoll && stuId === targetRoll) ||
      (targetId && stuRoll === targetId)
    );
  };

  // Explicit Mark Present by Professor/Staff
  const markStudentPresent = (classId, student) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls || !student) return { success: false };

    const existingIndex = attendanceRecords.findIndex((r) => isStudentRecMatch(r, cls.id, student));
    if (existingIndex >= 0) {
      sounds.playBeep();
      return { success: true, alreadyMarked: true, message: `${student.name} is already marked Present ✓` };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newRec = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      classId: cls.id,
      classCode: cls.code,
      className: cls.name,
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo || student.roll_no,
      timestamp: timeStr,
      date: 'Today',
      status: 'present',
      method: 'MANUAL_OVERRIDE',
    };

    const updatedRecords = [newRec, ...attendanceRecords];
    setAttendanceRecords(updatedRecords);

    // Increase the student's attendance for this specific subject
    const updatedStudents = studentsList.map((stu) => {
      if (isStudentListMatch(stu, student)) {
        const currentAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
        const newAttended = currentAtt.attended + 1;
        const newTotal = Math.max(currentAtt.total, newAttended);
        return {
          ...stu,
          attendance: {
            ...stu.attendance,
            [cls.code]: {
              attended: newAttended,
              total: newTotal,
            },
          },
        };
      }
      return stu;
    });
    setStudentsList(updatedStudents);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'ATTENDANCE_MARKED',
        records: updatedRecords,
        studentsList: updatedStudents,
      });
      channel.close();
    } catch (e) {}

    // Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('attendance_records')
        .insert({
          id: newRec.id,
          class_id: newRec.classId,
          class_code: newRec.classCode,
          class_name: newRec.className,
          student_id: newRec.studentId,
          student_name: newRec.studentName,
          roll_no: newRec.rollNo,
          timestamp: newRec.timestamp,
          date: newRec.date,
          status: newRec.status,
          method: newRec.method,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase mark present insert note:', error);
        });

      const updatedStu = updatedStudents.find((s) => isStudentListMatch(s, student));
      if (updatedStu) {
        supabase
          .from('students')
          .update({ attendance: updatedStu.attendance })
          .eq('id', updatedStu.id)
          .then(({ error }) => {
            if (error) console.warn('Supabase student update note:', error);
          });
      }
    }

    sounds.playSuccess();
    return { success: true, message: `Marked ${student.name} as Present ✓ (Attendance increased)` };
  };

  // Explicit Mark Absent by Professor/Staff
  const markStudentAbsent = (classId, student) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls || !student) return { success: false };

    const existingIndex = attendanceRecords.findIndex((r) => isStudentRecMatch(r, cls.id, student));
    if (existingIndex < 0) {
      sounds.playBeep();
      return { success: true, alreadyMarked: true, message: `${student.name} is already marked Absent.` };
    }

    const removedRec = attendanceRecords[existingIndex];
    const updatedRecords = attendanceRecords.filter((_, idx) => idx !== existingIndex);
    setAttendanceRecords(updatedRecords);

    // Decrease the student's attendance for this specific subject (reverting present mark)
    const updatedStudents = studentsList.map((stu) => {
      if (isStudentListMatch(stu, student)) {
        const currentAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
        return {
          ...stu,
          attendance: {
            ...stu.attendance,
            [cls.code]: {
              ...currentAtt,
              attended: Math.max(0, currentAtt.attended - 1),
            },
          },
        };
      }
      return stu;
    });
    setStudentsList(updatedStudents);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'ATTENDANCE_MARKED',
        records: updatedRecords,
        studentsList: updatedStudents,
      });
      channel.close();
    } catch (e) {}

    // Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      if (removedRec?.id) {
        supabase.from('attendance_records').delete().eq('id', removedRec.id).then(({ error }) => {
          if (error) console.warn('Supabase mark absent delete note:', error);
        });
      } else {
        supabase
          .from('attendance_records')
          .delete()
          .match({ class_id: cls.id, student_id: student.id })
          .then(({ error }) => {
            if (error) console.warn('Supabase mark absent delete note:', error);
          });
      }

      const updatedStu = updatedStudents.find((s) => isStudentListMatch(s, student));
      if (updatedStu) {
        supabase
          .from('students')
          .update({ attendance: updatedStu.attendance })
          .eq('id', updatedStu.id)
          .then(({ error }) => {
            if (error) console.warn('Supabase student update note:', error);
          });
      }
    }

    sounds.playBeep();
    return { success: true, message: `Marked ${student.name} as Absent.` };
  };

  // Toggle student attendance by professor
  const toggleStudentAttendance = (classId, student) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls || !student) return;

    const existingIndex = attendanceRecords.findIndex((r) => isStudentRecMatch(r, cls.id, student));
    if (existingIndex >= 0) {
      return markStudentAbsent(classId, student);
    } else {
      return markStudentPresent(classId, student);
    }
  };

  // Bulk Mark All Students Present
  const markAllStudentsPresent = (classId) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newRecordsToAdd = [];
    studentsList.forEach((stu) => {
      const alreadyPresent = attendanceRecords.some((r) => isStudentRecMatch(r, cls.id, stu));
      if (!alreadyPresent) {
        newRecordsToAdd.push({
          id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          classId: cls.id,
          classCode: cls.code,
          className: cls.name,
          studentId: stu.id,
          studentName: stu.name,
          rollNo: stu.rollNo || stu.roll_no,
          timestamp: timeStr,
          date: 'Today',
          status: 'present',
          method: 'MANUAL_OVERRIDE',
        });
      }
    });

    if (newRecordsToAdd.length === 0) {
      sounds.playBeep();
      return { success: true, message: 'All students are already marked Present!' };
    }

    const updatedRecords = [...newRecordsToAdd, ...attendanceRecords];
    setAttendanceRecords(updatedRecords);

    const addedIds = new Set(newRecordsToAdd.map((r) => (r.studentId || '').toLowerCase()));
    const addedRolls = new Set(newRecordsToAdd.map((r) => (r.rollNo || '').toLowerCase()));

    const updatedStudents = studentsList.map((stu) => {
      const match =
        addedIds.has((stu.id || '').toLowerCase()) ||
        addedRolls.has((stu.rollNo || stu.roll_no || '').toLowerCase());
      if (match) {
        const currentAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
        const newAttended = currentAtt.attended + 1;
        const newTotal = Math.max(currentAtt.total, newAttended);
        return {
          ...stu,
          attendance: {
            ...stu.attendance,
            [cls.code]: {
              attended: newAttended,
              total: newTotal,
            },
          },
        };
      }
      return stu;
    });
    setStudentsList(updatedStudents);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'ATTENDANCE_MARKED',
        records: updatedRecords,
        studentsList: updatedStudents,
      });
      channel.close();
    } catch (e) {}

    if (isSupabaseConfigured() && supabase) {
      newRecordsToAdd.forEach((nr) => {
        supabase.from('attendance_records').insert({
          id: nr.id,
          class_id: nr.classId,
          class_code: nr.classCode,
          class_name: nr.className,
          student_id: nr.studentId,
          student_name: nr.studentName,
          roll_no: nr.rollNo,
          timestamp: nr.timestamp,
          date: nr.date,
          status: nr.status,
          method: nr.method,
        }).then(() => {});
      });

      updatedStudents.forEach((st) => {
        supabase.from('students').update({ attendance: st.attendance }).eq('id', st.id).then(() => {});
      });
    }

    sounds.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    return { success: true, message: `Marked all students as Present ✓` };
  };

  // Bulk Mark All Students Absent
  const markAllStudentsAbsent = (classId) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls) return;

    const recordsToRemove = attendanceRecords.filter((r) => r.classId === cls.id);
    if (recordsToRemove.length === 0) {
      sounds.playBeep();
      return { success: true, message: 'All students are already marked Absent.' };
    }

    const removedIds = new Set(recordsToRemove.map((r) => (r.studentId || '').toLowerCase()));
    const removedRolls = new Set(recordsToRemove.map((r) => (r.rollNo || '').toLowerCase()));

    const updatedRecords = attendanceRecords.filter((r) => r.classId !== cls.id);
    setAttendanceRecords(updatedRecords);

    const updatedStudents = studentsList.map((stu) => {
      const match =
        removedIds.has((stu.id || '').toLowerCase()) ||
        removedRolls.has((stu.rollNo || stu.roll_no || '').toLowerCase());
      if (match) {
        const currentAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
        return {
          ...stu,
          attendance: {
            ...stu.attendance,
            [cls.code]: {
              ...currentAtt,
              attended: Math.max(0, currentAtt.attended - 1),
            },
          },
        };
      }
      return stu;
    });
    setStudentsList(updatedStudents);

    try {
      const channel = new BroadcastChannel('attendpulse_sync');
      channel.postMessage({
        type: 'ATTENDANCE_MARKED',
        records: updatedRecords,
        studentsList: updatedStudents,
      });
      channel.close();
    } catch (e) {}

    if (isSupabaseConfigured() && supabase) {
      supabase.from('attendance_records').delete().eq('class_id', cls.id).then(() => {});
      updatedStudents.forEach((st) => {
        supabase.from('students').update({ attendance: st.attendance }).eq('id', st.id).then(() => {});
      });
    }

    sounds.playBeep();
    return { success: true, message: `Marked all students as Absent.` };
  };

  // Clear all scanned attendance records for a class session
  const clearSessionAttendance = (classId) => {
    const targetClass = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!targetClass) return { success: false, message: 'Class session not found.' };
    const res = markAllStudentsAbsent(targetClass.id);
    return {
      success: true,
      message: `Cleared all live attendee records for ${targetClass.name}. Feed is now empty.`,
    };
  };

  const resetDemoData = () => {
    setClasses(INITIAL_CLASSES);
    setStudentsList(STUDENTS);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setStaffNotifications([]);
    setSelectedClassId(null);
    localStorage.removeItem(STORAGE_KEY_CLASSES);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_STUDENTS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_STAFF_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_SEL_CLASS);
    sounds.playBeep();
  };

  return (
    <AttendanceContext.Provider
      value={{
        role,
        switchRole,
        isAuthenticated,
        login,
        logout,
        currentStudent,
        currentProfessor,
        switchTeacher,
        switchStudent,
        teachers: TEACHERS,
        students: studentsList,
        allStudents: studentsList,
        classes,
        subjects: DISTINCT_SUBJECTS,
        activeLiveClass,
        setClassStatus,
        attendanceRecords,
        subjectStats,
        overallPercentage,
        totalAttended,
        totalClassesCount,
        qrTokenSalt,
        rotateQrToken,
        getQrPayload,
        markAttendanceFromScan,
        toggleStudentAttendance,
        markStudentPresent,
        markStudentAbsent,
        markAllStudentsPresent,
        markAllStudentsAbsent,
        clearSessionAttendance,
        resetDemoData,
        studentDailyClasses,
        // Sequential Teacher Class Operations
        teacherClasses,
        currentTeacherClass,
        selectedClassId,
        selectTeacherClass,
        activateClassQr,
        completeClassSession,
        restartTeacherClasses,
        teacherSubjectStudents,
        sendStudentReminder,
        // Student Shortage Notification
        sendStudentShortageNotice,
        // Notifications
        notifications,
        studentNotifications,
        unreadNotificationCount,
        markNotificationRead,
        staffNotifications: currentTeacherStaffNotifs,
        unreadStaffNotifsCount,
        markStaffNotificationRead,
        // Supabase Cloud Status
        isSupabaseConfigured: isSupabaseConfigured(),
        supabaseStatus: getSupabaseConfigStatus(),
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
