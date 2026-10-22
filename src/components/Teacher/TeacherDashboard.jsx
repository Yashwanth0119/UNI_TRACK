import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAttendance } from '../../context/AttendanceContext';
import { ClassQrPresentationModal } from './ClassQrPresentationModal';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Send,
  Check,
  Bell,
  Search,
  Maximize2,
  Power,
  Lock,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  X,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const TeacherDashboard = () => {
  const {
    currentProfessor,
    teacherClasses,
    currentTeacherClass,
    selectTeacherClass,
    activateClassQr,
    completeClassSession,
    restartTeacherClasses,
    teacherSubjectStudents,
    attendanceRecords,
    sendStudentReminder,
    getQrPayload,
    rotateQrToken,
    markStudentPresent,
    markStudentAbsent,
    markAllStudentsPresent,
    markAllStudentsAbsent,
    clearSessionAttendance,
    allStudents,
    subjects,
  } = useAttendance();

  const [activeModalClassId, setActiveModalClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelow75Only, setFilterBelow75Only] = useState(false);
  const [remindedStudents, setRemindedStudents] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [countdown, setCountdown] = useState(20);

  // Notification modal for low attendance warnings
  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    student: null,
    subjectCode: '',
    subjectName: '',
    percentage: '',
    message: '',
  });

  const activeClass = currentTeacherClass || teacherClasses[0];
  const isClassLive = activeClass?.status === 'live';
  const isClassCompleted = activeClass?.status === 'completed';
  const isClassReady = activeClass?.status === 'ready';

  // Dynamic QR token rotation countdown when class is live
  useEffect(() => {
    if (!isClassLive) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          rotateQrToken();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isClassLive, rotateQrToken]);

  // Open Fullscreen QR presentation modal
  const handleOpenClassQr = (classId) => {
    activateClassQr(classId);
    setActiveModalClassId(classId);
  };

  // Activate Class QR Code
  const handleActivateClass = () => {
    if (!activeClass) return;
    activateClassQr(activeClass.id);
    setToastMessage(`✓ QR Code Activated for ${activeClass.name}! Students can now scan.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Complete Class Session (ends this session & unlocks the next class)
  const handleCompleteClass = () => {
    if (!activeClass) return;
    const res = completeClassSession(activeClass.id);
    if (res?.nextUnlockedClass) {
      setToastMessage(
        `✓ ${activeClass.name} completed! ${res.nextUnlockedClass.name} is now UNLOCKED and can be viewed.`
      );
    } else {
      setToastMessage(`✓ All scheduled classes completed for today! Great job.`);
    }
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Restart Classes Schedule
  const handleRestartClasses = () => {
    const res = restartTeacherClasses();
    if (res?.message) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(''), 4500);
    }
  };

  // Present records strictly for active class session today, deduplicated per student
  const classRecordsToday = useMemo(() => {
    if (!activeClass?.id) return [];
    const seen = new Set();
    return attendanceRecords.filter((r) => {
      if (r.classId !== activeClass.id) return false;
      const key = (r.studentId || r.rollNo || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [attendanceRecords, activeClass?.id]);

  // Live Student Attendance Register calculation for activeClass
  const activeClassRecords = useMemo(() => {
    if (!activeClass?.id) return [];
    return attendanceRecords.filter((r) => r.classId === activeClass.id);
  }, [attendanceRecords, activeClass?.id]);

  const studentRegisterRows = useMemo(() => {
    const baseList = teacherSubjectStudents && teacherSubjectStudents.length > 0
      ? teacherSubjectStudents
      : (allStudents || []);

    return baseList.map((stu) => {
      const stuId = (stu.id || '').toLowerCase();
      const stuRoll = (stu.rollNo || stu.roll_no || '').toLowerCase();
      const rec = activeClassRecords.find((r) => {
        const rStuId = (r.studentId || '').toLowerCase();
        const rRoll = (r.rollNo || '').toLowerCase();
        return rStuId === stuId || rRoll === stuRoll || rStuId === stuRoll || rRoll === stuId;
      });
      const status = rec ? rec.status : 'pending'; // 'present' | 'absent' | 'pending'
      return {
        student: stu,
        record: rec,
        status,
      };
    });
  }, [teacherSubjectStudents, allStudents, activeClassRecords]);

  const presentCount = studentRegisterRows.filter((r) => r.status === 'present').length;
  const absentCount = studentRegisterRows.filter((r) => r.status === 'absent').length;
  const pendingCount = studentRegisterRows.filter((r) => r.status === 'pending').length;
  const isRegisterAllDone = (presentCount + absentCount === studentRegisterRows.length) && studentRegisterRows.length > 0;

  // Low Attendance Alerts across subjects assigned to this faculty (<75%)
  const assignedCodes = useMemo(() => {
    return Array.isArray(currentProfessor?.assignedSubjects) && currentProfessor.assignedSubjects.length > 0
      ? currentProfessor.assignedSubjects
      : [currentProfessor?.subjectCode || 'DSA101'];
  }, [currentProfessor]);

  const lowAttendanceAlerts = useMemo(() => {
    const list = [];
    const studentList = allStudents && allStudents.length > 0 ? allStudents : teacherSubjectStudents;
    (studentList || []).forEach((stu) => {
      assignedCodes.forEach((code) => {
        const subInfo = (subjects || []).find((s) => s.code === code) || {
          code,
          name: code === 'DSA101' ? 'Data Structures and Algorithms' : code === 'OS102' ? 'Operating Systems' : 'Database Management Systems',
        };
        const att = stu.attendance?.[code] || { attended: 0, total: 30 };
        const pct = att.total > 0 ? ((att.attended / att.total) * 100).toFixed(1) : '0.0';
        if (parseFloat(pct) < 75) {
          list.push({
            studentId: stu.id,
            studentName: stu.name,
            rollNo: stu.rollNo,
            email: stu.email,
            subjectCode: code,
            subjectName: subInfo.name,
            percentage: pct,
            attended: att.attended,
            total: att.total,
          });
        }
      });
    });
    return list;
  }, [allStudents, teacherSubjectStudents, assignedCodes, subjects]);

  // Open Notice Modal for student
  const handleOpenNoticeModal = (alert) => {
    const defaultMsg = `Your attendance in ${alert.subjectName} has fallen below 75%. Please attend upcoming classes regularly to improve your attendance.`;
    setNoticeModal({
      isOpen: true,
      student: { id: alert.studentId, name: alert.studentName, rollNo: alert.rollNo },
      subjectCode: alert.subjectCode,
      subjectName: alert.subjectName,
      percentage: alert.percentage,
      message: defaultMsg,
    });
  };

  // Send Custom / Predefined Notice
  const handleSendCustomNotice = () => {
    if (!noticeModal.student) return;
    const res = sendStudentReminder(noticeModal.student.id, noticeModal.message, noticeModal.subjectCode);
    if (res?.success) {
      setRemindedStudents((prev) => ({
        ...prev,
        [`${noticeModal.student.id}-${noticeModal.subjectCode}`]: true,
      }));
      setToastMessage(res.message);
      setNoticeModal({ isOpen: false, student: null, subjectCode: '', subjectName: '', percentage: '', message: '' });
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  // Bulk remind all flagged students
  const handleBulkRemindAll = () => {
    lowAttendanceAlerts.forEach((alert) => {
      const defaultMsg = `Your attendance in ${alert.subjectName} has fallen below 75%. Please attend upcoming classes regularly to improve your attendance.`;
      sendStudentReminder(alert.studentId, defaultMsg, alert.subjectCode);
    });
    const newReminded = {};
    lowAttendanceAlerts.forEach((a) => (newReminded[`${a.studentId}-${a.subjectCode}`] = true));
    setRemindedStudents((prev) => ({ ...prev, ...newReminded }));
    setToastMessage(`Official shortage notices sent to all ${lowAttendanceAlerts.length} flagged student cases!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter students for overall roster table
  const filteredStudents = teacherSubjectStudents.filter((stu) => {
    const matchesSearch =
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterBelow75Only) {
      return matchesSearch && stu.isBelow75;
    }
    return matchesSearch;
  });

  const below75Count = teacherSubjectStudents.filter((s) => s.isBelow75).length;
  const eligibleCount = teacherSubjectStudents.length - below75Count;
  const completedCount = teacherClasses.filter((c) => c.status === 'completed').length;
  const qrPayload = activeClass ? getQrPayload(activeClass.id) : currentProfessor.subjectCode;

  return (
    <div className="teacher-dashboard animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Toast Notice */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '5rem',
            right: '2rem',
            zIndex: 999,
            padding: '0.85rem 1.25rem',
            background: '#10b981',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <Bell size={18} />
          {toastMessage}
        </div>
      )}

      {/* 1. TODAY'S CLASSES OF CURRENT TEACHER */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className="section-title">
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              Today's Scheduled Classes ({teacherClasses.length} Assigned)
            </h2>
            <div className="section-subtitle">
              Manage class sessions, launch QR code generation, track attendance in real-time, and mark students manually.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: completedCount === teacherClasses.length ? '#ECFDF5' : 'var(--ice-glass)',
                color: completedCount === teacherClasses.length ? '#059669' : 'var(--quantum-blue)',
                border: completedCount === teacherClasses.length ? '1px solid #A7F3D0' : '1px solid rgba(36, 87, 255, 0.25)',
              }}
            >
              {completedCount} of {teacherClasses.length} Completed Today
            </span>

            {/* Reset / Restart Classes Button */}
            <button
              onClick={handleRestartClasses}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--quantum-blue)',
                background: 'var(--ice-glass)',
                borderColor: 'rgba(36, 87, 255, 0.25)',
                cursor: 'pointer',
              }}
              title="Reset and restart all class sessions for today"
            >
              <RotateCcw size={14} />
              Reset & Restart Classes
            </button>
          </div>
        </div>

        {/* Banner shown when all assigned classes are completed */}
        {completedCount === teacherClasses.length && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
              border: '2px solid #10B981',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
              animation: 'popIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#065F46' }}>
                  All Scheduled Classes Completed! 🎉
                </div>
                <div style={{ fontSize: '0.84rem', color: '#047857', marginTop: '0.15rem' }}>
                  You have successfully completed all scheduled sessions for today. You can restart the schedule to launch a new cycle.
                </div>
              </div>
            </div>
            <button
              onClick={handleRestartClasses}
              className="btn-primary"
              style={{
                background: '#059669',
                padding: '0.7rem 1.35rem',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <RotateCcw size={16} />
              Restart Classes for New Cycle
            </button>
          </div>
        )}

        {/* Classes Grid: Prompt 5.B (Cards with Required Controls) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {teacherClasses.map((cls, idx) => {
            const isSelected = activeClass?.id === cls.id;
            const isLive = cls.status === 'live';
            const isCompleted = cls.status === 'completed';
            const isLocked = cls.status === 'locked';
            const isReady = cls.status === 'ready';

            return (
              <div
                key={cls.id}
                className={`glass-panel ${!isLocked ? 'glow-hover' : ''}`}
                style={{
                  padding: '1.25rem',
                  opacity: isLocked ? 0.6 : 1,
                  border: isSelected
                    ? '2px solid var(--primary)'
                    : isLive
                    ? '2px solid #10b981'
                    : '1px solid var(--border-subtle)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), #FFFFFF)'
                    : '#FFFFFF',
                  boxShadow: isSelected ? '0 4px 18px rgba(79, 70, 229, 0.15)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  {/* Top Pill / Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--ice-glass)',
                        color: 'var(--quantum-blue)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Class {cls.order || idx + 1} of {teacherClasses.length} ({cls.periodName || `Period ${idx + 1}`})
                    </span>

                    {/* Status Badge */}
                    {isLive && (
                      <span className="status-pill live pulse-badge">
                        <Radio size={12} />
                        Live Now
                      </span>
                    )}
                    {isCompleted && (
                      <span className="status-pill present">
                        <Check size={12} />
                        Completed
                      </span>
                    )}
                    {isReady && !isLive && (
                      <span className="status-pill upcoming">
                        Ready to Start
                      </span>
                    )}
                    {isLocked && (
                      <span
                        className="status-pill not-marked"
                        style={{ background: '#F3F4F6', color: '#9CA3AF' }}
                      >
                        <Lock size={12} />
                        Locked
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {cls.name} ({cls.code})
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={13} style={{ color: 'var(--primary)' }} />
                      <span>{cls.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} style={{ color: 'var(--accent-amber)' }} />
                      <span>{cls.room}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={13} style={{ color: '#059669' }} />
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        {cls.totalEnrolled || 5} Students Enrolled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Prompt 5.B Required Controls) */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTeacherClass(cls.id);
                      handleOpenClassQr(cls.id);
                    }}
                    style={{
                      flex: 1,
                      minWidth: '95px',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: 'var(--quantum-blue)',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                    title="Generate and display QR code for this class session"
                  >
                    <QrCode size={13} />
                    Generate QR
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTeacherClass(cls.id);
                      setToastMessage(`Showing live attendance register for ${cls.name}`);
                      setTimeout(() => setToastMessage(''), 3000);
                    }}
                    style={{
                      flex: 1,
                      minWidth: '95px',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: isSelected ? 'var(--ice-glass)' : '#FFFFFF',
                      color: 'var(--quantum-blue)',
                      border: '1px solid rgba(36, 87, 255, 0.25)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                    title="View attendance register for this class session"
                  >
                    <Eye size={13} />
                    View Register
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTeacherClass(cls.id);
                      const el = document.getElementById('attendance-register-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      setToastMessage(`Manual attendance controls ready for ${cls.name}`);
                      setTimeout(() => setToastMessage(''), 3000);
                    }}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: '#F8FAFC',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                    title="Mark attendance manually for this class session"
                  >
                    <SlidersHorizontal size={13} />
                    Manual Marks
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SELECTED CLASS INTERACTIVE ATTENDANCE & QR CONTROLLER */}
      {activeClass && (
        <div
          id="attendance-register-section"
          className="glass-panel"
          style={{
            padding: '1.75rem',
            marginBottom: '2rem',
            border: isClassLive ? '2px solid #10b981' : '1px solid var(--border-subtle)',
            boxShadow: isClassLive ? '0 10px 30px rgba(16, 185, 129, 0.15)' : 'var(--shadow-md)',
          }}
        >
          {/* Header of Active Class Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--ice-glass)',
                    color: 'var(--quantum-blue)',
                  }}
                >
                  Active Session: Class {activeClass.order || 1} of {teacherClasses.length}
                </span>

                {isClassLive && (
                  <span className="status-pill live pulse-badge">
                    <Radio size={12} />
                    Attendance Open (Live)
                  </span>
                )}
                {isClassCompleted && (
                  <span className="status-pill present">
                    <Check size={12} />
                    Class Completed
                  </span>
                )}
                {isClassReady && !isClassLive && (
                  <span className="status-pill upcoming">
                    Ready to Activate
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {activeClass.name} ({activeClass.code})
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                <span>Scheduled: <strong>{activeClass.time}</strong></span>
                <span>•</span>
                <span>Room: <strong>{activeClass.room}</strong></span>
                <span>•</span>
                <span>Faculty: <strong>{activeClass.professorName}</strong></span>
              </div>
            </div>

            {/* Turnout Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.45rem 0.95rem',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Users size={16} style={{ color: '#059669' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {presentCount} of {studentRegisterRows.length} Present
              </span>
            </div>
          </div>

          {/* Interactive QR Generation & Action Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Instructions and Status */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Classroom Attendance Management
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {isClassLive
                  ? 'Students can now scan this QR code using their UniTrack mobile or laptop camera to mark attendance.'
                  : isClassCompleted
                  ? 'This class session has been completed and finalized. All student records are locked and saved.'
                  : 'Click "Activate Class QR Code" below to generate a live, rolling attendance token for students in the hall.'}
              </p>

              {/* Action Buttons */}
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* If Ready */}
                {isClassReady && !isClassLive && (
                  <button
                    onClick={handleActivateClass}
                    className="btn-primary"
                    style={{
                      padding: '0.75rem 1.4rem',
                      fontSize: '0.92rem',
                      background: '#10B981',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <QrCode size={18} />
                    Activate Class QR Code
                  </button>
                )}

                {/* If Live */}
                {isClassLive && (
                  <>
                    <button
                      onClick={handleCompleteClass}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.4rem',
                        fontSize: '0.92rem',
                        background: '#DC2626',
                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                      }}
                      title="End this session and close attendance"
                    >
                      <Power size={17} />
                      Complete & Close Attendance
                    </button>

                    <button
                      onClick={() => handleOpenClassQr(activeClass.id)}
                      className="btn-secondary"
                      style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem' }}
                    >
                      <Maximize2 size={16} />
                      Projector Mode
                    </button>
                  </>
                )}

                {/* If Completed */}
                {isClassCompleted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        padding: '0.65rem 1rem',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 'var(--radius-md)',
                        color: '#065F46',
                        fontSize: '0.86rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Session Closed & Finalized.</span>
                    </div>

                    <button
                      onClick={handleRestartClasses}
                      className="btn-secondary"
                      style={{
                        padding: '0.65rem 1.15rem',
                        fontSize: '0.86rem',
                        color: '#059669',
                        borderColor: '#A7F3D0',
                        background: '#ECFDF5',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={15} />
                      Restart Schedule
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Working Live QR Box */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: isClassLive ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                boxShadow: isClassLive ? '0 10px 25px rgba(16, 185, 129, 0.2)' : 'var(--shadow-sm)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  padding: '0.5rem',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: isClassLive ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                }}
              >
                <QRCodeSVG
                  value={qrPayload}
                  size={175}
                  level="M"
                  includeMargin={true}
                  fgColor={isClassLive ? '#0f172a' : '#94a3b8'}
                  bgColor="#ffffff"
                />
              </div>

              <div style={{ marginTop: '0.65rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeClass.code} Attendance QR
                </div>
                <div style={{ fontSize: '0.76rem', color: isClassLive ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>
                  {isClassLive
                    ? `🟢 ACTIVE • Rolling Token (${countdown}s)`
                    : isClassCompleted
                    ? '✓ Session Finalized'
                    : '⚪ Click Activate to Launch QR'}
                </div>
              </div>

              {/* Turnout Counter */}
              <div
                style={{
                  marginTop: '0.75rem',
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  background: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Session Turnout:</span>
                <strong style={{ color: '#059669', fontSize: '0.82rem' }}>
                  {presentCount} of {studentRegisterRows.length} Present
                </strong>
              </div>
            </div>
          </div>

          {/* Prompt 5.D & 5.E: LIVE STUDENT ATTENDANCE REGISTER */}
          <div
            style={{
              marginTop: '2rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                  }}
                >
                  <CheckCircle2 size={18} style={{ color: '#059669' }} />
                  Live Student Attendance Register
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Live student roster for <strong>{activeClass.name} ({activeClass.code})</strong>. Automatically updates when a student scans or when attendance is marked manually.
                </div>
              </div>

              {/* Live Count Summary (Prompt 5.D Requirement) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  Present: {presentCount}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                  }}
                >
                  Absent: {absentCount}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#FFFBEB',
                    color: '#D97706',
                    border: '1px solid #FDE68A',
                  }}
                >
                  Pending: {pendingCount}
                </span>

                {activeClassRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeClass) {
                        const res = clearSessionAttendance(activeClass.id);
                        if (res?.message) setToastMessage(res.message);
                        setTimeout(() => setToastMessage(''), 3500);
                      }
                    }}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    title="Clear attendee records for this class session"
                  >
                    <RotateCcw size={12} />
                    Reset Register
                  </button>
                )}
              </div>
            </div>

            {/* Prompt 5.E: All Students' Attendance Completed Banner */}
            {isRegisterAllDone && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.85rem 1.25rem',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 'var(--radius-md)',
                  color: '#065F46',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  animation: 'popIn 0.3s ease',
                }}
              >
                <CheckCircle2 size={18} style={{ color: '#059669' }} />
                <span>All Students' Attendance Completed (5 of 5 Accounted For) 🎉</span>
              </div>
            )}

            {/* Register Table (Prompt 5.D) */}
            <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student ID</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Attendance Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Marking Method</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Time Marked</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manual Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRegisterRows.map(({ student, record, status }) => {
                    const isPresent = status === 'present';
                    const isAbsent = status === 'absent';
                    const isPending = status === 'pending';

                    return (
                      <tr
                        key={student.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isPresent ? '#F0FDF4' : isAbsent ? '#FEF2F2' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                          {student.rollNo || student.id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: isPresent ? '#DCFCE7' : isAbsent ? '#FEE2E2' : 'var(--ice-glass)',
                                color: isPresent ? '#059669' : isAbsent ? '#DC2626' : 'var(--quantum-blue)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                              }}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {isPresent && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#DCFCE7',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                              }}
                            >
                              <CheckCircle2 size={12} /> Present
                            </span>
                          )}
                          {isAbsent && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                              }}
                            >
                              <AlertTriangle size={12} /> Absent
                            </span>
                          )}
                          {isPending && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                background: '#FEF3C7',
                                color: '#D97706',
                                border: '1px solid #FDE68A',
                              }}
                            >
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {record ? (record.method === 'QR_SCAN' ? 'QR Scan' : 'Manual') : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {record?.timestamp || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const res = markStudentPresent(activeClass.id, student);
                                if (res?.message) setToastMessage(res.message);
                                setTimeout(() => setToastMessage(''), 3000);
                              }}
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: isPresent ? '#059669' : '#ECFDF5',
                                color: isPresent ? '#FFFFFF' : '#059669',
                                border: '1px solid #A7F3D0',
                                cursor: 'pointer',
                              }}
                              title="Mark Present manually"
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const res = markStudentAbsent(activeClass.id, student);
                                if (res?.message) setToastMessage(res.message);
                                setTimeout(() => setToastMessage(''), 3000);
                              }}
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: isAbsent ? '#DC2626' : '#FEF2F2',
                                color: isAbsent ? '#FFFFFF' : '#DC2626',
                                border: '1px solid #FECACA',
                                cursor: 'pointer',
                              }}
                              title="Mark Absent manually"
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. METRICS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Enrolled Students</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--quantum-blue)', marginTop: '0.2rem' }}>
            {studentRegisterRows.length} Students
          </div>
          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
            {eligibleCount} eligible for exams (≥75%)
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            border: lowAttendanceAlerts.length > 0 ? '1px solid #FECACA' : 'var(--border-subtle)',
            background: lowAttendanceAlerts.length > 0 ? '#FEF2F2' : '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>Low Attendance Cases (&lt;75%)</div>
            <AlertTriangle size={16} style={{ color: '#DC2626' }} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>
            {lowAttendanceAlerts.length} Flagged
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B91C1C' }}>
            Calculated dynamically from live attendance records
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Today's Class Schedule Progress</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {completedCount} of {teacherClasses.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            Sequential session progression
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Session Turnout Rate</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
            {((presentCount / Math.max(1, studentRegisterRows.length)) * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            {presentCount} verified present in this session
          </div>
        </div>
      </div>

      {/* 4. PROMPT 7: DEDICATED LOW ATTENDANCE ALERTS SECTION (<75%) */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626' }}>
              <AlertTriangle size={20} style={{ color: '#DC2626' }} />
              Low Attendance Alerts (&lt; 75% Threshold)
            </h2>
            <div className="section-subtitle">
              Students whose attendance in any assigned subject is below 75%. Send official warnings directly to their dashboard.
            </div>
          </div>

          {lowAttendanceAlerts.length > 0 && (
            <button
              onClick={handleBulkRemindAll}
              className="btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                background: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              title="Send warning notices to all flagged students"
            >
              <Send size={14} />
              Notify All ({lowAttendanceAlerts.length}) Cases
            </button>
          )}
        </div>

        {lowAttendanceAlerts.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)',
              color: '#065F46',
            }}
          >
            <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>All Students Above 75% Threshold!</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
              No students are currently below the 75% mandatory examination attendance mark for your assigned subjects.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid #FECACA' }}>
            <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#991B1B' }}>Student Name & ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#991B1B' }}>Subject Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#991B1B' }}>Attendance Count</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#991B1B' }}>Percentage</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#991B1B' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowAttendanceAlerts.map((alert) => {
                  const wasSent = remindedStudents[`${alert.studentId}-${alert.subjectCode}`];

                  return (
                    <tr
                      key={`${alert.studentId}-${alert.subjectCode}`}
                      style={{ borderBottom: '1px solid #FEE2E2', background: '#FFF5F5' }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {alert.studentName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.86rem' }}>
                              {alert.studentName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#B91C1C' }}>
                              Roll: {alert.rollNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0F172A', fontSize: '0.84rem' }}>
                        {alert.subjectName} ({alert.subjectCode})
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: '#DC2626' }}>{alert.attended}</strong> / {alert.total} Classes
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#DC2626',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {alert.percentage}%
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenNoticeModal(alert)}
                          className={wasSent ? 'btn-secondary' : 'btn-primary'}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.76rem',
                            background: wasSent ? '#ECFDF5' : '#DC2626',
                            color: wasSent ? '#059669' : '#FFFFFF',
                            border: wasSent ? '1px solid #A7F3D0' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                          }}
                        >
                          {wasSent ? (
                            <>
                              <Check size={13} />
                              Notice Sent
                            </>
                          ) : (
                            <>
                              <MessageSquare size={13} />
                              Send Notification
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ENROLLED STUDENTS FULL ROSTER TABLE */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2 className="section-title">
              <Users size={20} style={{ color: 'var(--primary)' }} />
              Enrolled Students Attendance Roster ({activeClass.code})
            </h2>
            <div className="section-subtitle">
              Complete subject attendance records and threshold status.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter Toggle */}
            <button
              onClick={() => setFilterBelow75Only(!filterBelow75Only)}
              className={filterBelow75Only ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderColor: filterBelow75Only ? 'var(--primary)' : '#FECACA',
                background: filterBelow75Only ? 'var(--primary)' : '#FEF2F2',
                color: filterBelow75Only ? '#fff' : '#DC2626',
              }}
            >
              <AlertTriangle size={14} />
              {filterBelow75Only ? 'Show All Students' : `Show Below 75% Only (${below75Count})`}
            </button>

            {/* Quick Bulk Actions */}
            <button
              type="button"
              onClick={() => {
                const res = markAllStudentsPresent(activeClass.id);
                if (res?.message) setToastMessage(res.message);
                setTimeout(() => setToastMessage(''), 3500);
              }}
              style={{
                fontSize: '0.78rem',
                padding: '0.42rem 0.75rem',
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <CheckCircle2 size={13} />
              Mark All Present
            </button>

            <button
              type="button"
              onClick={() => {
                const res = markAllStudentsAbsent(activeClass.id);
                if (res?.message) setToastMessage(res.message);
                setTimeout(() => setToastMessage(''), 3500);
              }}
              style={{
                fontSize: '0.78rem',
                padding: '0.42rem 0.75rem',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AlertTriangle size={13} />
              Mark All Absent
            </button>

            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  width: '210px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="roster-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Session Attendance & Staff Action</th>
                <th>Subject Classes</th>
                <th>Attendance %</th>
                <th>Threshold Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stu) => {
                const isRed = stu.isBelow75;
                const stuId = (stu.id || '').toLowerCase();
                const stuRoll = (stu.rollNo || stu.roll_no || '').toLowerCase();
                const rec = activeClassRecords.find((r) => {
                  const rStuId = (r.studentId || '').toLowerCase();
                  const rRoll = (r.rollNo || '').toLowerCase();
                  return rStuId === stuId || rRoll === stuRoll || rStuId === stuRoll || rRoll === stuId;
                });
                const isPresent = !!rec;

                return (
                  <tr
                    key={stu.id}
                    style={{
                      background: isRed ? '#FEF2F2' : 'transparent',
                      borderLeft: isRed ? '4px solid #DC2626' : '4px solid transparent',
                    }}
                  >
                    <td style={{ fontWeight: 600, color: isRed ? '#DC2626' : 'var(--text-main)' }}>
                      {stu.rollNo}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: isRed ? '#FEE2E2' : 'var(--ice-glass)',
                            color: isRed ? '#DC2626' : 'var(--quantum-blue)',
                            border: isRed ? '1px solid #FECACA' : '1px solid rgba(36, 87, 255, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {stu.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: isRed ? '#991B1B' : 'var(--text-main)' }}>
                            {stu.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {stu.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isPresent ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            {rec.timestamp ? `Present (${rec.timestamp})` : 'Present ✓'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            ○ Pending / Not Scanned
                          </span>
                        )}

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {!isPresent ? (
                            <button
                              type="button"
                              onClick={() => {
                                const res = markStudentPresent(activeClass.id, stu);
                                if (res?.message) setToastMessage(res.message);
                                setTimeout(() => setToastMessage(''), 3000);
                              }}
                              style={{
                                padding: '0.22rem 0.55rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                cursor: 'pointer',
                              }}
                            >
                              Present
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const res = markStudentAbsent(activeClass.id, stu);
                                if (res?.message) setToastMessage(res.message);
                                setTimeout(() => setToastMessage(''), 3000);
                              }}
                              style={{
                                padding: '0.22rem 0.55rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                cursor: 'pointer',
                              }}
                            >
                              Absent
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{stu.subjectAttended}</strong> / {stu.subjectTotal} Classes
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading)',
                            color: isRed ? '#DC2626' : '#059669',
                          }}
                        >
                          {stu.percentage}%
                        </span>
                        <div
                          style={{
                            width: 60,
                            height: 6,
                            background: '#E5E7EB',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(5, stu.percentage))}%`,
                              height: '100%',
                              background: isRed ? '#DC2626' : '#059669',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      {isRed ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            color: '#DC2626',
                            textTransform: 'uppercase',
                          }}
                        >
                          <AlertTriangle size={13} />
                          Below 75% Shortage
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            background: '#D1FAE5',
                            border: '1px solid #6EE7B7',
                            color: '#059669',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Eligible (≥75%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fullscreen QR Presentation Modal */}
      {activeClass && (
        <ClassQrPresentationModal
          isOpen={!!activeModalClassId}
          onClose={() => setActiveModalClassId(null)}
          classId={activeClass.id}
        />
      )}

      {/* PROMPT 7: Notification Custom/Predefined Message Modal */}
      {noticeModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--quantum-blue)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Send Low Attendance Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoticeModal({ isOpen: false, student: null, subjectCode: '', subjectName: '', percentage: '', message: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipient Details */}
            <div
              style={{
                padding: '0.85rem 1rem',
                background: '#F8FAFC',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Recipient Student:</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {noticeModal.student?.name} ({noticeModal.student?.rollNo})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subject:</span>
                <strong>{noticeModal.subjectName} ({noticeModal.subjectCode})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Attendance:</span>
                <strong style={{ color: '#DC2626' }}>{noticeModal.percentage}% (&lt; 75% Shortage)</strong>
              </div>
            </div>

            {/* Predefined message templates quick selection */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Select Predefined Message Template:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  `Your attendance in ${noticeModal.subjectName} has fallen below 75%. Please attend upcoming classes regularly to improve your attendance.`,
                  `Attendance Warning: You have ${noticeModal.percentage}% in ${noticeModal.subjectName}. Meet faculty in room ${activeClass.room} to discuss shortage.`,
                  `Urgent: Your attendance in ${noticeModal.subjectName} (${noticeModal.subjectCode}) is currently ${noticeModal.percentage}%. Minimum 75% required for university examinations.`,
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNoticeModal((prev) => ({ ...prev, message: tmpl }))}
                    style={{
                      textAlign: 'left',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.76rem',
                      background: noticeModal.message === tmpl ? 'var(--ice-glass)' : '#FFFFFF',
                      border: noticeModal.message === tmpl ? '1px solid var(--quantum-blue)' : '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: noticeModal.message === tmpl ? 'var(--quantum-blue)' : 'var(--text-main)',
                      lineHeight: 1.3,
                    }}
                  >
                    Template {idx + 1}: "{tmpl.substring(0, 75)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Textarea */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Message to Student (Editable):
              </label>
              <textarea
                rows={3}
                value={noticeModal.message}
                onChange={(e) => setNoticeModal((prev) => ({ ...prev, message: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.84rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setNoticeModal({ isOpen: false, student: null, subjectCode: '', subjectName: '', percentage: '', message: '' })}
                className="btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCustomNotice}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem', background: '#DC2626' }}
              >
                <Send size={14} />
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
