import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceGauge } from './AttendanceGauge';
import { QrScannerModal } from './QrScannerModal';
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Radio,
  History,
  Lock,
  Bell,
  Check,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const StudentDashboard = () => {
  const {
    currentStudent,
    classes,
    studentDailyClasses,
    activeLiveClass,
    attendanceRecords,
    studentNotifications,
    markNotificationRead,
    overallPercentage,
    totalAttended,
    totalClassesCount,
  } = useAttendance();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedClassForScan, setSelectedClassForScan] = useState(null);
  const [scheduleFilter, setScheduleFilter] = useState('daily'); // 'daily' | 'APP101' | 'DSA102' | 'OS103'

  // 4 classes for the student for the day
  const displayedClasses = React.useMemo(() => {
    if (scheduleFilter === 'daily') {
      return studentDailyClasses && studentDailyClasses.length > 0
        ? studentDailyClasses
        : classes.filter((c) => c.isStudentDaily).slice(0, 4);
    }
    return classes.filter((c) => c.code === scheduleFilter).slice(0, 4);
  }, [scheduleFilter, studentDailyClasses, classes]);

  const [toastMessage, setToastMessage] = useState('');

  // Check attendance status of student for a class
  const getStudentClassStatus = (classId) => {
    if (!classId || !currentStudent) return null;
    const record = attendanceRecords.find(
      (r) =>
        r.classId === classId &&
        (r.studentId === currentStudent.id ||
          (currentStudent.rollNo && r.rollNo === currentStudent.rollNo) ||
          (currentStudent.roll_no && r.rollNo === currentStudent.roll_no))
    );
    return record || null;
  };

  const handleOpenScannerForClass = (classId) => {
    const alreadyMarked = getStudentClassStatus(classId);
    if (alreadyMarked) {
      setToastMessage(`✓ Attendance is already marked for this class session (${alreadyMarked.timestamp}). The scanner cannot be opened again.`);
      setTimeout(() => setToastMessage(''), 4500);
      return;
    }
    setSelectedClassForScan(classId);
    setScannerOpen(true);
  };

  // Student's records for today (deduplicated by classId)
  const studentTodayRecords = React.useMemo(() => {
    if (!currentStudent) return [];
    const seenClasses = new Set();
    return attendanceRecords.filter((r) => {
      const isStu =
        r.studentId === currentStudent.id ||
        (currentStudent.rollNo && r.rollNo === currentStudent.rollNo) ||
        (currentStudent.roll_no && r.rollNo === currentStudent.roll_no);
      if (!isStu) return false;
      if (seenClasses.has(r.classId)) return false;
      seenClasses.add(r.classId);
      return true;
    });
  }, [attendanceRecords, currentStudent]);

  return (
    <div className="student-dashboard animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '5rem',
            right: '2rem',
            zIndex: 999,
            padding: '0.85rem 1.25rem',
            background: '#059669',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* Staff Shortage Notifications Alert Banner (Strictly Sent by Staff) */}
      {studentNotifications.length > 0 && (
        <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {studentNotifications.map((notif) => (
            <div
              key={notif.id}
              className="glass-panel"
              style={{
                padding: '1.1rem 1.35rem',
                border: '1px solid #FECACA',
                background: notif.isRead ? '#FEF2F2' : '#FEE2E2',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: notif.isRead ? 'none' : '0 4px 14px rgba(220, 38, 38, 0.12)',
                animation: 'popIn 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    marginTop: '0.1rem',
                  }}
                >
                  <Bell size={20} className={!notif.isRead ? 'pulse-badge' : ''} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                      }}
                    >
                      Official Notice from Faculty
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {notif.teacherName} ({notif.subjectCode} - {notif.subjectName})
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      • {notif.timestamp}
                    </span>
                  </div>

                  <p style={{ color: '#991B1B', fontSize: '0.86rem', lineHeight: 1.45 }}>
                    {notif.message}
                  </p>
                </div>
              </div>

              {!notif.isRead ? (
                <button
                  onClick={() => markNotificationRead(notif.id)}
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.76rem',
                    color: '#DC2626',
                    borderColor: '#FECACA',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Check size={13} />
                  Acknowledge
                </button>
              ) : (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  Acknowledged ✓
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Top Banner */}
      <div className="dashboard-hero">
        <div className="hero-left">
          <h1>
            <span>Student Attendance Portal</span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              Academic Year 2026-27
            </span>
          </h1>
        </div>
      </div>

      {/* Attendance Overview Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '1.1rem 1.25rem',
            background: parseFloat(overallPercentage) >= 75 ? '#F0FDF4' : '#FEF2F2',
            border: parseFloat(overallPercentage) >= 75 ? '1px solid #BBF7D0' : '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Overall Attendance
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: parseFloat(overallPercentage) >= 75 ? '#059669' : '#DC2626',
                fontFamily: 'var(--font-heading)',
                marginTop: '0.15rem',
              }}
            >
              {overallPercentage}%
            </div>
            <div style={{ fontSize: '0.72rem', color: parseFloat(overallPercentage) >= 75 ? '#047857' : '#B91C1C', fontWeight: 600, marginTop: '0.15rem' }}>
              {parseFloat(overallPercentage) >= 75 ? '✓ Eligible for Exams (≥75%)' : '⚠ Attendance Shortage (<75%)'}
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: parseFloat(overallPercentage) >= 75 ? '#DCFCE7' : '#FEE2E2',
              color: parseFloat(overallPercentage) >= 75 ? '#059669' : '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Classes Attended
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--primary)',
              fontFamily: 'var(--font-heading)',
              marginTop: '0.15rem',
            }}
          >
            {totalAttended}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              / {totalClassesCount}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
            Increases with every verified QR scan
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Today's Attendance Status
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#059669',
              fontFamily: 'var(--font-heading)',
              marginTop: '0.15rem',
            }}
          >
            {studentTodayRecords.length}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              / {displayedClasses.length} Marked
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
            {studentTodayRecords.length === displayedClasses.length
              ? '✓ All daily classes attended'
              : 'Scan when lecture commences'}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Today's Classes & Log, Right = Percentage Gauge */}
      <div className="student-grid">
        {/* Left Column: Classes Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Quick Scanner Action Hero (Active when lecture is in session) */}
          {activeLiveClass && (() => {
            const liveMarkedRec = getStudentClassStatus(activeLiveClass.id);
            return (
              <div
                className="glass-panel scan-hero-card"
                style={
                  liveMarkedRec
                    ? {
                        border: '1px solid #A7F3D0',
                        background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.8), rgba(255, 255, 255, 0.9))',
                      }
                    : {}
                }
              >
                <div className="scan-hero-text">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: liveMarkedRec ? '#059669' : '#38bdf8',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {liveMarkedRec ? (
                      <>
                        <CheckCircle2 size={14} />
                        Attendance Marked for this Session
                      </>
                    ) : (
                      <>
                        <Radio size={14} className="pulse-badge" />
                        Lecture In Session: {activeLiveClass.code}
                      </>
                    )}
                  </div>
                  <h3>
                    Active: {activeLiveClass.code} ({activeLiveClass.name})
                  </h3>
                  <p>
                    {liveMarkedRec
                      ? `✓ Your attendance has been successfully recorded and verified at ${liveMarkedRec.timestamp}. The scanner is locked and cannot be reopened for this session.`
                      : `Attendance is open for ${activeLiveClass.code} in ${activeLiveClass.room}. Note: Scanners for other classes are locked while this lecture is ongoing.`}
                  </p>
                </div>

                {liveMarkedRec ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.3rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Attendance Marked ({liveMarkedRec.timestamp})
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handleOpenScannerForClass(activeLiveClass.id)}
                    style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}
                  >
                    <QrCode size={19} />
                    Scan for {activeLiveClass.code}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Today's Classes Section (4 Classes For Student) */}
          <div>
            <div className="section-header" style={{ marginBottom: '0.85rem' }}>
              <div>
                <h2 className="section-title">
                  <Calendar size={20} style={{ color: 'var(--primary)' }} />
                  Today's Classes Schedule
                </h2>
                <div className="section-subtitle">
                  Daily academic timetable (3 Subject Classes Scheduled Today)
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  padding: '0.25rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {displayedClasses.length} Classes for Today
              </span>
            </div>

            {/* Course / Timetable Filter Tabs (All Views Feature Exactly 4 Classes) */}
            <div
              style={{
                display: 'flex',
                gap: '0.45rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
              }}
            >
              {[
                { key: 'daily', label: "📅 All 3 Scheduled Classes Today" },
                { key: 'DSA101', label: '📊 DSA101 • Dr. Rajesh Sharma' },
                { key: 'OS102', label: '⚙️ OS102 • Prof. Meera Nair' },
                { key: 'DBMS103', label: '🗄️ DBMS103 • Prof. Meera Nair' },
              ].map((tab) => {
                const isActive = scheduleFilter === tab.key;
                const hasLiveClass = tab.key === 'daily'
                  ? displayedClasses.some((c) => c.status === 'live')
                  : activeLiveClass?.code === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setScheduleFilter(tab.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'var(--primary)' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : 'var(--text-main)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    {hasLiveClass && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 6px #10B981',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* If there's an active live class in another course tab, highlight it */}
            {activeLiveClass && !displayedClasses.some((c) => c.id === activeLiveClass.id) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#047857', fontWeight: 600 }}>
                  <Radio size={16} className="pulse-badge" />
                  <span>
                    Faculty has opened attendance for <strong>{activeLiveClass.code}</strong> ({activeLiveClass.name})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setScheduleFilter(activeLiveClass.code)}
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    Switch to {activeLiveClass.code}
                  </button>
                  {getStudentClassStatus(activeLiveClass.id) ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: '#FFFFFF',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      <CheckCircle2 size={13} /> Marked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenScannerForClass(activeLiveClass.id)}
                      className="btn-primary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <QrCode size={14} /> Scan Now
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Class Cards List (4 Classes) */}
            <div className="class-list">
              {displayedClasses.map((cls, idx) => {
                const attendedRecord = getStudentClassStatus(cls.id);
                const isLive = cls.status === 'live';

                return (
                  <div
                    key={cls.id}
                    className={`glass-panel class-card glow-hover ${
                      isLive ? 'is-live' : ''
                    }`}
                    style={{ '--class-color': cls.color }}
                  >
                    <div className="class-main-info">
                      <div className="class-meta-header">
                        <span className="class-code-badge">{cls.code}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {cls.periodName || `Class ${idx + 1}`}
                        </span>
                        {isLive && (
                          <span className="status-pill live pulse-badge">
                            <Radio size={12} />
                            Class In Session (Attendance Open)
                          </span>
                        )}
                        {cls.status === 'completed' && (
                          <span className="status-pill present">
                            <Check size={12} />
                            Session Completed
                          </span>
                        )}
                        {cls.status === 'locked' && (
                          <span
                            className="status-pill not-marked"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Lock size={11} />
                            Locked (Session {cls.order})
                          </span>
                        )}
                        {cls.status === 'ready' && !isLive && (
                          <span
                            className="status-pill upcoming"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Clock size={11} />
                            Scheduled
                          </span>
                        )}
                        {attendedRecord && (
                          <span className="status-pill present">
                            <CheckCircle2 size={12} />
                            Present ({attendedRecord.timestamp})
                          </span>
                        )}
                      </div>

                      <h3 className="class-title">{cls.name}</h3>

                      <div className="class-details-row">
                        <div
                          className="detail-item"
                          style={{
                            background: '#EEF2FF',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            border: '1px solid #C7D2FE',
                            color: '#4F46E5',
                            fontWeight: 700,
                          }}
                        >
                          <Clock size={13} style={{ color: '#4F46E5' }} />
                          <span>{cls.time}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin size={14} style={{ color: 'var(--accent-amber)' }} />
                          <span>{cls.room}</span>
                        </div>
                        <div className="detail-item">
                          <User size={14} style={{ color: 'var(--accent-violet)' }} />
                          <span>{cls.professorName}</span>
                        </div>
                      </div>

                      {/* Subject Attendance Percentage Badge */}
                      {(() => {
                        const stuAtt = currentStudent.attendance?.[cls.code] || { attended: 0, total: 30 };
                        const subPct = stuAtt.total > 0 ? ((stuAtt.attended / stuAtt.total) * 100).toFixed(1) : '0.0';
                        const isSubSafe = parseFloat(subPct) >= 75;

                        return (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.55rem 0.75rem',
                              background: isSubSafe ? '#F0FDF4' : '#FEF2F2',
                              border: isSubSafe ? '1px solid #BBF7D0' : '1px solid #FECACA',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.65rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                              <Percent size={13} style={{ color: isSubSafe ? '#059669' : '#DC2626' }} />
                              <span style={{ color: 'var(--text-muted)' }}>{cls.code} Attendance:</span>
                              <strong style={{ color: isSubSafe ? '#059669' : '#DC2626', fontSize: '0.84rem' }}>
                                {subPct}%
                              </strong>
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>
                                ({stuAtt.attended}/{stuAtt.total} classes attended)
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <div
                                style={{
                                  width: '55px',
                                  height: '5px',
                                  background: '#E5E7EB',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(100, Math.max(5, subPct))}%`,
                                    height: '100%',
                                    background: isSubSafe ? 'linear-gradient(90deg, #10B981, #059669)' : '#DC2626',
                                    borderRadius: '3px',
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: isSubSafe ? '#059669' : '#DC2626',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isSubSafe ? 'Eligible' : 'Shortage'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action button */}
                    <div>
                      {attendedRecord ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.25rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              color: '#059669',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              padding: '0.45rem 0.85rem',
                              background: '#ECFDF5',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #A7F3D0',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <CheckCircle2 size={15} />
                            Attendance Marked
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Verified at {attendedRecord.timestamp}
                          </span>
                        </div>
                      ) : isLive ? (
                        <button
                          className="btn-primary"
                          onClick={() => handleOpenScannerForClass(cls.id)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <QrCode size={16} />
                          Scan Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className="btn-secondary"
                          style={{
                            whiteSpace: 'nowrap',
                            opacity: 0.45,
                            cursor: 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                          title={`Scanner inactive for ${cls.code}. You can only scan when this class is in session.`}
                        >
                          <Lock size={14} />
                          Scanner Inactive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Activity Log */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.05rem' }}>
                <History size={18} style={{ color: 'var(--accent-cyan)' }} />
                Today's Attendance Activity Log
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Real-time records
              </span>
            </div>

            {studentTodayRecords.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.75rem 1rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.88rem',
                }}
              >
                No attendance recorded yet today. Scan a QR code when your class starts!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {studentTodayRecords.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#F9FAFB',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#ECFDF5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {rec.className} ({rec.classCode})
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Verified via {rec.method === 'QR_SCAN' ? 'Camera QR Scan' : 'Faculty Override'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#059669' }}>
                        {rec.timestamp}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Status: PRESENT
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Attendance Statistics & Percentage */}
        <div>
          <AttendanceGauge />
        </div>
      </div>

      {/* QR Code Camera Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        preselectedClassId={selectedClassForScan}
        onScanSuccess={(res) => {
          setToastMessage(`✓ Attendance marked successfully for ${res?.classInfo?.name || 'class'}! Status: PRESENT ✓`);
          setTimeout(() => setToastMessage(''), 5000);
        }}
      />
    </div>
  );
};
