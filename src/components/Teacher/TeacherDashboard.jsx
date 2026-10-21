import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const TeacherDashboard = () => {
  const {
    currentProfessor,
    teacherClasses,
    currentTeacherClass,
    selectTeacherClass,
    activateClassQr,
    completeClassSession,
    teacherSubjectStudents,
    attendanceRecords,
    sendStudentReminder,
    getQrPayload,
    rotateQrToken,
  } = useAttendance();

  const [activeModalClassId, setActiveModalClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelow75Only, setFilterBelow75Only] = useState(false);
  const [remindedStudents, setRemindedStudents] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [countdown, setCountdown] = useState(20);

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

  // Complete Class Session (ends this session & unlocks the next class!)
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



  // Send single student reminder
  const handleSendReminder = (student) => {
    const res = sendStudentReminder(student.id);
    if (res?.success) {
      setRemindedStudents((prev) => ({ ...prev, [student.id]: true }));
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  // Bulk remind all students below 75%
  const handleBulkRemindAll = () => {
    const below75List = teacherSubjectStudents.filter((s) => s.isBelow75);
    below75List.forEach((stu) => {
      sendStudentReminder(stu.id);
    });
    const newReminded = {};
    below75List.forEach((s) => (newReminded[s.id] = true));
    setRemindedStudents((prev) => ({ ...prev, ...newReminded }));
    setToastMessage(`Official shortage notices sent to all ${below75List.length} students below 75%!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Present records for active class today
  const classRecordsToday = attendanceRecords.filter(
    (r) =>
      r.classId === activeClass?.id ||
      (activeClass && r.classCode === activeClass.code) ||
      (activeClass && r.classCode === currentProfessor.subjectCode)
  );

  // Filter students
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
    <div className="teacher-dashboard animate-fade-in">
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
            boxShadow: 'var(--shadow-lg)',
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

      {/* 1. TODAY'S CLASSES OF CURRENT TEACHER (Sequential Unlock & Selection) */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className="section-title">
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              Today's Classes Schedule (4 Classes for Staff)
            </h2>
            <div className="section-subtitle">
              Daily schedule of 4 sequential class sessions today. Activate a class to show its QR code; completing a class unlocks the next session.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: completedCount === teacherClasses.length ? '#ECFDF5' : '#EEF2FF',
                color: completedCount === teacherClasses.length ? '#059669' : '#4F46E5',
                border: completedCount === teacherClasses.length ? '1px solid #A7F3D0' : '1px solid #C7D2FE',
              }}
            >
              {completedCount} of {teacherClasses.length} Completed Today
            </span>
          </div>
        </div>

        {/* Classes Grid */}
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
                onClick={() => {
                  if (!isLocked) {
                    selectTeacherClass(cls.id);
                  } else {
                    setToastMessage(`🔒 Session ${cls.order} is locked. Complete the previous class session first.`);
                    setTimeout(() => setToastMessage(''), 3500);
                  }
                }}
                className={`glass-panel ${!isLocked ? 'glow-hover' : ''}`}
                style={{
                  padding: '1.25rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
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
                  position: 'relative',
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
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Session {cls.order || idx + 1} of 4 ({cls.periodName || `Period ${idx + 1}`})
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
                    {cls.name}
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
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ color: 'var(--text-dim)' }}>
                    {isLocked
                      ? `Locked (Unlock after Session ${(cls.order || 2) - 1})`
                      : isSelected
                      ? '● Selected Class'
                      : 'Click to View / Conduct'}
                  </span>
                  {!isLocked && (
                    <ChevronRight size={16} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-dim)' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SELECTED CLASS INTERACTIVE ATTENDANCE & QR CONTROLLER */}
      {activeClass && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            border: isClassLive
              ? '2px solid #10b981'
              : isClassCompleted
              ? '1px solid #10b981'
              : '1px solid var(--border-subtle)',
            background: isClassLive
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), #FFFFFF)'
              : '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="teacher-active-session-grid">
            {/* Left Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                    textTransform: 'uppercase',
                  }}
                >
                  Selected Class • Session {activeClass.order || 1}
                </span>

                {isClassLive && (
                  <span className="status-pill live pulse-badge">
                    <Radio size={13} />
                    Class Active (Attendance QR Live)
                  </span>
                )}
                {isClassCompleted && (
                  <span className="status-pill present">
                    <CheckCircle2 size={13} />
                    Class Session Completed
                  </span>
                )}
                {isClassReady && !isClassLive && (
                  <span className="status-pill upcoming">
                    Ready to Activate QR
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                {activeClass.name}
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '580px', marginBottom: '1.25rem' }}>
                {activeClass.description}
              </p>

              {/* Lecture Specs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
                <div className="detail-item">
                  <Clock size={16} style={{ color: 'var(--primary)' }} />
                  <span>Time: <strong style={{ color: 'var(--text-main)' }}>{activeClass.time}</strong></span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} style={{ color: 'var(--accent-amber)' }} />
                  <span>Room: <strong style={{ color: 'var(--text-main)' }}>{activeClass.room}</strong></span>
                </div>
                <div className="detail-item">
                  <Users size={16} style={{ color: '#059669' }} />
                  <span>Roster: <strong style={{ color: 'var(--text-main)' }}>{teacherSubjectStudents.length} Students</strong></span>
                </div>
              </div>

              {/* Class Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                {/* Activate QR Button (if not yet live) */}
                {!isClassLive && !isClassCompleted && (
                  <button
                    onClick={handleActivateClass}
                    className="btn-primary"
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}
                  >
                    <QrCode size={18} />
                    Activate Class QR Code
                  </button>
                )}

                {/* If Live: Complete Class Button (Ends session & unlocks next class) */}
                {isClassLive && (
                  <>
                    <button
                      onClick={handleCompleteClass}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.92rem',
                        background: '#DC2626',
                      }}
                      title="End this session and unlock the next scheduled class"
                    >
                      <Power size={17} />
                      Complete & End Class Session
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
                    <span>Session Completed. Attendance has been logged. Next class is unlocked!</span>
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
                    ? `🟢 ACTIVE • Rotating Token (${countdown}s)`
                    : isClassCompleted
                    ? '✓ Session Completed'
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
                  {classRecordsToday.length} of {teacherSubjectStudents.length} Present
                </strong>
              </div>
            </div>
          </div>

          {/* Live Scanned Students Section (Who Scanned & Marked Attendance) */}
          <div
            style={{
              marginTop: '1.75rem',
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
                  }}
                >
                  <CheckCircle2 size={18} style={{ color: '#059669' }} />
                  Live Attendees Who Scanned & Marked Attendance
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Real-time verification feed of students who scanned the QR code for <strong>{activeClass.name} ({activeClass.code})</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: classRecordsToday.length > 0 ? '#ECFDF5' : '#F3F4F6',
                    color: classRecordsToday.length > 0 ? '#059669' : '#6B7280',
                    border: classRecordsToday.length > 0 ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Radio size={12} className={isClassLive ? 'pulse-badge' : ''} />
                  {classRecordsToday.length} of {teacherSubjectStudents.length} Students Scanned
                </span>
              </div>
            </div>

            {classRecordsToday.length === 0 ? (
              <div
                style={{
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: '#F9FAFB',
                  border: '1px dashed var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-muted)',
                }}
              >
                <Users size={32} style={{ color: '#9CA3AF', margin: '0 auto 0.5rem', opacity: 0.7 }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Awaiting Student Scans...
                </div>
                <div style={{ fontSize: '0.8rem', maxWidth: '440px', margin: '0 auto' }}>
                  {isClassLive
                    ? 'The QR code is active! When students in the classroom scan the QR code with their camera, their names, roll numbers, and scan timestamps will appear here immediately.'
                    : 'Click "Activate Class QR Code" above to project the QR code and begin taking attendance.'}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {classRecordsToday.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '0.85rem 1rem',
                      background: '#FFFFFF',
                      border: '1px solid #A7F3D0',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      animation: 'popIn 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          flexShrink: 0,
                        }}
                      >
                        {rec.studentName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {rec.studentName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Roll: <strong style={{ color: 'var(--text-main)' }}>{rec.rollNo}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          background: '#ECFDF5',
                          color: '#059669',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <CheckCircle2 size={11} />
                        Scanned
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} />
                        {rec.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. METRICS CARDS (Assigned Subject Card removed as requested) */}
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
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#4F46E5', marginTop: '0.2rem' }}>
            {teacherSubjectStudents.length} Students
          </div>
          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
            {eligibleCount} eligible for exams (≥75%)
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            border: below75Count > 0 ? '1px solid #FECACA' : 'var(--border-subtle)',
            background: below75Count > 0 ? '#FEF2F2' : '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>Students Below 75% Threshold</div>
            <AlertTriangle size={16} style={{ color: '#DC2626' }} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>
            {below75Count} Students
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B91C1C' }}>
            Marked in RED • Send shortage notifications below
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
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Session Attendance Rate</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
            {((classRecordsToday.length / Math.max(1, teacherSubjectStudents.length)) * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            {classRecordsToday.length} verified attendees in session
          </div>
        </div>
      </div>

      {/* 4. STUDENTS ATTENDANCE ROSTER TABLE WITH LOW ATTENDANCE NOTIFICATION BUTTON */}
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
              Enrolled Students Attendance Roster ({currentProfessor.subjectCode})
            </h2>
            <div className="section-subtitle">
              Students below 75% are highlighted in red. Use the action button to send them low attendance warning notifications.
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

            {/* Bulk Remind Button */}
            {below75Count > 0 && (
              <button
                onClick={handleBulkRemindAll}
                className="btn-primary"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  background: '#DC2626',
                }}
                title="Send warning notifications to all students below 75%"
              >
                <Send size={14} />
                Notify All ({below75Count}) Below 75%
              </button>
            )}

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
                <th>Active Session Scan Status</th>
                <th>Subject Classes</th>
                <th>Attendance %</th>
                <th>Threshold Status</th>
                <th style={{ textAlign: 'center' }}>Staff Action (Send Notification)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stu) => {
                const isRed = stu.isBelow75;
                const wasReminded = remindedStudents[stu.id];

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
                            background: isRed ? '#FEE2E2' : '#EEF2FF',
                            color: isRed ? '#DC2626' : '#4F46E5',
                            border: isRed ? '1px solid #FECACA' : '1px solid #C7D2FE',
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

                    {/* Active Session Scan Status */}
                    <td>
                      {(() => {
                        const rec = classRecordsToday.find((r) => r.studentId === stu.id || r.rollNo === stu.rollNo);
                        if (rec) {
                          return (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Scanned ({rec.timestamp})
                            </span>
                          );
                        }
                        return (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            ○ Not Scanned Yet
                          </span>
                        );
                      })()}
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
                              width: `${Math.min(100, stu.percentage)}%`,
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

                    <td style={{ textAlign: 'center' }}>
                      {isRed ? (
                        <button
                          onClick={() => handleSendReminder(stu)}
                          className={wasReminded ? 'btn-secondary' : 'btn-primary'}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.76rem',
                            background: wasReminded ? '#ECFDF5' : '#DC2626',
                            color: wasReminded ? '#059669' : '#FFFFFF',
                            border: wasReminded ? '1px solid #A7F3D0' : 'none',
                          }}
                        >
                          {wasReminded ? (
                            <>
                              <Check size={13} />
                              Notice Sent
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              Send Low Attendance Notice
                            </>
                          )}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Eligible (No Action Needed)
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

      {/* QR Presentation Modal */}
      {activeClass && (
        <ClassQrPresentationModal
          isOpen={!!activeModalClassId}
          onClose={() => setActiveModalClassId(null)}
          classId={activeClass.id}
        />
      )}
    </div>
  );
};
