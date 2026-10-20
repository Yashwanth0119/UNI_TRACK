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

const STORAGE_KEY_CLASSES = 'attendpulse_classes_v6';
const STORAGE_KEY_RECORDS = 'attendpulse_records_v6';
const STORAGE_KEY_STUDENTS = 'attendpulse_students_v6';
const STORAGE_KEY_NOTIFS = 'attendpulse_notifs_v6';
const STORAGE_KEY_STAFF_NOTIFS = 'attendpulse_staff_notifs_v6';
const STORAGE_KEY_ROLE = 'attendpulse_role_v6';
const STORAGE_KEY_AUTH = 'unitrack_auth_session';
const STORAGE_KEY_CURR_STUDENT = 'attendpulse_curr_stu_v6';
const STORAGE_KEY_CURR_TEACHER = 'attendpulse_curr_prof_v6';
const STORAGE_KEY_SEL_CLASS = 'attendpulse_sel_class_v6';

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
    const saved = localStorage.getItem(STORAGE_KEY_CLASSES);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [selectedClassId, setSelectedClassId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SEL_CLASS) || null;
  });

  const [studentsList, setStudentsList] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    return saved ? JSON.parse(saved) : STUDENTS;
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
          setClasses(
            clsRes.data.map((c) => ({
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
            }))
          );
        }

        if (stuRes.data && stuRes.data.length > 0) {
          setStudentsList(
            stuRes.data.map((s) => ({
              ...s,
              rollNo: s.roll_no ?? s.rollNo,
            }))
          );
        }

        if (recRes.data && recRes.data.length > 0) {
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

    return () => {
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
  const currentStudent = studentsList.find((s) => s.id === activeStudentId) || studentsList[0];
  const currentProfessor = TEACHERS.find((t) => t.id === activeTeacherId) || TEACHERS[0];

  // Distinct 3 subjects for student aggregate statistics
  const DISTINCT_SUBJECTS = [
    { code: 'APP101', name: 'Advanced Programming and Practice', professor: 'Dr. Robert Vance', color: '#4F46E5' },
    { code: 'DSA102', name: 'Data Structures and Algorithms', professor: 'Dr. Elena Rostova', color: '#0284c7' },
    { code: 'OS103', name: 'Operating Systems', professor: 'Dr. Marcus Chen', color: '#059669' },
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

  // Teacher portal data: all 4 classes for current teacher
  const teacherClasses = classes
    .filter((c) => c.professorId === currentProfessor.id || c.code === currentProfessor.subjectCode)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Student portal data: exactly 4 classes for student's daily schedule
  const studentDailyClasses = classes
    .filter((c) => c.isStudentDaily)
    .sort((a, b) => (a.studentPeriodOrder || 0) - (b.studentPeriodOrder || 0));

  // Determine current active/selected teacher class
  // 1. If selectedClassId matches an unlocked/completed class for this teacher, use it
  // 2. Otherwise default to currently live class, or first uncompleted (ready) class, or first class
  const currentTeacherClass =
    teacherClasses.find((c) => c.id === selectedClassId) ||
    teacherClasses.find((c) => c.status === 'live') ||
    teacherClasses.find((c) => c.status === 'ready') ||
    teacherClasses[0];

  // Students attendance list for current teacher's subject
  const teacherSubjectStudents = studentsList.map((stu) => {
    const att = stu.attendance?.[currentProfessor.subjectCode] || { attended: 0, total: 30 };
    const pct = att.total > 0 ? ((att.attended / att.total) * 100).toFixed(1) : '0.0';
    const isBelow75 = parseFloat(pct) < 75;
    return {
      ...stu,
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

    const isStudentMatch = (s) => {
      const idMatches =
        s.email?.toLowerCase() === cleanId ||
        s.rollNo?.toLowerCase() === cleanId ||
        s.name?.toLowerCase() === cleanId ||
        s.name?.toLowerCase().split(' ')[0] === cleanId ||
        s.id?.toLowerCase() === cleanId;

      if (!idMatches) return false;
      const firstName = s.name ? s.name.toLowerCase().split(' ')[0] : '';
      return (
        s.password === cleanPass ||
        cleanPass === 'student123' ||
        cleanPass === `${firstName}123` ||
        (cleanId === 'koshin' && cleanPass === 'koshin123')
      );
    };

    const isTeacherMatch = (t) => {
      const idMatches =
        t.email?.toLowerCase() === cleanId ||
        t.empId?.toLowerCase() === cleanId ||
        t.name?.toLowerCase().includes(cleanId) ||
        t.id?.toLowerCase() === cleanId;

      if (!idMatches) return false;
      return (
        t.password === cleanPass ||
        cleanPass === 'vance123' ||
        cleanPass === 'faculty123' ||
        cleanPass === 'staff123'
      );
    };

    if (chosenRole === 'student') {
      const matched = studentsList.find(isStudentMatch);
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
      const studentMatch = studentsList.find(isStudentMatch);
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
      colors: ['#4F46E5', '#10b981', '#818CF8'],
    });

    return {
      success: true,
      completedClass: currentClass,
      nextUnlockedClass: nextClass,
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

      // Check if class is LIVE
      if (cls.status !== 'live') {
        sounds.playError();
        const currentlyLive = classes.find((c) => c.status === 'live');
        const guidance = currentlyLive
          ? ` Only ${currentlyLive.code} (${currentlyLive.name}) is currently in session.`
          : ' No lecture is currently in session.';
        return {
          success: false,
          isInactiveClass: true,
          error: `Scanner Inactive for ${cls.code}: This lecture is not currently going on.${guidance}`,
          classInfo: cls,
        };
      }

      // Check if student already marked today for this session
      const alreadyMarked = attendanceRecords.some(
        (rec) => rec.classId === cls.id && rec.studentId === currentStudent.id
      );

      if (alreadyMarked) {
        sounds.playBeep();
        const existingRec = attendanceRecords.find(
          (rec) => rec.classId === cls.id && rec.studentId === currentStudent.id
        );
        return {
          success: false,
          alreadyMarked: true,
          error: `Attendance already recorded for ${cls.name} today at ${existingRec?.timestamp || 'earlier today'}.`,
          classInfo: cls,
        };
      }

      // Create new record
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newRecord = {
        id: `REC-${Date.now()}`,
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

      // Increment student attendance
      const updatedStudents = studentsList.map((stu) => {
        if (stu.id === currentStudent.id) {
          const currentAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
          return {
            ...stu,
            attendance: {
              ...stu.attendance,
              [cls.code]: {
                attended: currentAtt.attended + 1,
                total: currentAtt.total + 1,
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

        const targetStudent = updatedStudents.find((s) => s.id === currentStudent.id);
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
        colors: ['#4F46E5', '#10b981', '#818CF8', '#fbbf24'],
      });

      return {
        success: true,
        message: `Attendance marked successfully for ${cls.name}!`,
        record: newRecord,
        classInfo: cls,
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
  // (In student portal, notifications are strictly sended by staff)
  const sendStudentReminder = (studentId, customNote) => {
    const student = studentsList.find((s) => s.id === studentId);
    if (!student) return;

    const studentSubjectData = student.attendance?.[currentProfessor.subjectCode] || { attended: 0, total: 30 };
    const pct = studentSubjectData.total > 0
      ? ((studentSubjectData.attended / studentSubjectData.total) * 100).toFixed(1)
      : '0.0';

    const newNotification = {
      id: `NOTIF-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      teacherId: currentProfessor.id,
      teacherName: currentProfessor.name,
      subjectCode: currentProfessor.subjectCode,
      subjectName: currentProfessor.subjectName,
      percentage: pct,
      senderRole: 'staff',
      message:
        customNote ||
        `Official Faculty Attendance Notice from ${currentProfessor.name}: Your attendance in ${currentProfessor.subjectName} (${currentProfessor.subjectCode}) is currently ${pct}%, which is below the mandatory 75% examination threshold. Please meet during office hours.`,
      timestamp: 'Just now',
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

    sounds.playSuccess();
    return {
      success: true,
      message: `Low attendance warning notice sent directly to ${student.name} (${student.rollNo})!`,
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

  // Manual toggle student attendance by professor
  const toggleStudentAttendance = (classId, student) => {
    const cls = classes.find((c) => c.id === classId) || currentTeacherClass;
    if (!cls) return;

    const existingIndex = attendanceRecords.findIndex(
      (r) => r.classId === cls.id && r.studentId === student.id
    );

    let updatedRecords;
    let isNowPresent = false;

    if (existingIndex >= 0) {
      updatedRecords = attendanceRecords.filter((_, idx) => idx !== existingIndex);
      sounds.playBeep();
    } else {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newRec = {
        id: `REC-${Date.now()}`,
        classId: cls.id,
        classCode: cls.code,
        className: cls.name,
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        timestamp: timeStr,
        date: 'Today',
        status: 'present',
        method: 'MANUAL_OVERRIDE',
      };
      updatedRecords = [newRec, ...attendanceRecords];
      isNowPresent = true;
      sounds.playSuccess();
    }

    setAttendanceRecords(updatedRecords);

    const updatedStudents = studentsList.map((stu) => {
      if (stu.id === student.id) {
        const currentAtt = stu.attendance?.[cls.code] || { attended: 0, total: 30 };
        return {
          ...stu,
          attendance: {
            ...stu.attendance,
            [cls.code]: {
              ...currentAtt,
              attended: isNowPresent
                ? currentAtt.attended + 1
                : Math.max(0, currentAtt.attended - 1),
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

    // Sync manual toggle to Supabase
    if (isSupabaseConfigured() && supabase) {
      if (isNowPresent) {
        const targetRec = updatedRecords[0];
        supabase
          .from('attendance_records')
          .insert({
            id: targetRec.id,
            class_id: targetRec.classId,
            class_code: targetRec.classCode,
            class_name: targetRec.className,
            student_id: targetRec.studentId,
            student_name: targetRec.studentName,
            roll_no: targetRec.rollNo,
            timestamp: targetRec.timestamp,
            date: targetRec.date,
            status: targetRec.status,
            method: targetRec.method,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase toggle insert note:', error);
          });
      } else {
        supabase
          .from('attendance_records')
          .delete()
          .match({ class_id: cls.id, student_id: student.id })
          .then(({ error }) => {
            if (error) console.warn('Supabase toggle delete note:', error);
          });
      }

      const updatedStu = updatedStudents.find((s) => s.id === student.id);
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
        resetDemoData,
        studentDailyClasses,
        // Sequential Teacher Class Operations
        teacherClasses,
        currentTeacherClass,
        selectedClassId,
        selectTeacherClass,
        activateClassQr,
        completeClassSession,
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
