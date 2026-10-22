import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle,
  Search,
  Shield,
  Radio,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';

export const ClassQrPresentationModal = ({ isOpen, onClose, classId }) => {
  const {
    classes,
    getQrPayload,
    rotateQrToken,
    attendanceRecords,
    allStudents,
    toggleStudentAttendance,
    markStudentPresent,
    markStudentAbsent,
    markAllStudentsPresent,
    markAllStudentsAbsent,
  } = useAttendance();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const dynamicRefresh = true;
  const [countdown, setCountdown] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const modalContainerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const selectedClass = classes.find((c) => c.id === classId) || classes[0];

  // Rotate QR code periodically if dynamic refresh is enabled
  useEffect(() => {
    if (!isOpen || !dynamicRefresh) return;

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
  }, [isOpen, dynamicRefresh, rotateQrToken]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;

    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen || !selectedClass) return null;

  const safeStudents = allStudents || [];
  const qrPayload = getQrPayload(selectedClass.id) || selectedClass.code;

  // Present records for this class
  const classRecords = attendanceRecords.filter(
    (r) =>
      r.classId === selectedClass.id ||
      (selectedClass && r.classCode === selectedClass.code)
  );
  const presentStudentIds = new Set(
    classRecords.flatMap((r) => [r.studentId, r.rollNo].filter(Boolean))
  );

  // Filter students
  const filteredStudents = safeStudents.filter(
    (stu) =>
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export CSV
  const exportCsv = () => {
    const header = ['Roll No', 'Student Name', 'Status', 'Timestamp', 'Verification Method'];
    const rows = safeStudents.map((stu) => {
      const rec = classRecords.find((r) => r.studentId === stu.id);
      return [
        stu.rollNo,
        `"${stu.name}"`,
        rec ? 'PRESENT' : 'ABSENT',
        rec ? rec.timestamp : '-',
        rec ? rec.method : '-',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_${selectedClass.code}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalContainerRef}
        className={`modal-content wide animate-pop-in ${
          isFullscreen ? 'fullscreen-mode' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: isFullscreen ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Radio size={20} className="pulse-badge" style={{ color: '#ef4444' }} />
            <span>
              Live Attendance Session •{' '}
              <strong style={{ color: 'var(--primary)' }}>{selectedClass.code}</strong> (
              {selectedClass.name})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              className="btn-secondary"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen Projector Mode"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isFullscreen ? 'Exit Fullscreen' : 'Projector Mode'}
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
          }}
        >
          <div className="qr-presentation-layout">
            {/* Left Column: Big Projected QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="qr-code-showcase">
                <div className="qr-code-wrapper">
                  <QRCodeSVG
                    value={qrPayload}
                    size={240}
                    level="M"
                    includeMargin={true}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="qr-subtext">
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedClass.code} • {selectedClass.room}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      marginTop: '0.4rem',
                      padding: '0.2rem 0.65rem',
                      background: '#EEF2FF',
                      border: '1px solid #C7D2FE',
                      borderRadius: 'var(--radius-full)',
                      color: '#4F46E5',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    <Clock size={13} />
                    <span>{selectedClass.periodName || 'Lecture'}: {selectedClass.time}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Scan with UniTrack student camera
                  </div>
                </div>
              </div>

              {/* Dynamic Refresh Bar */}
              <div className="token-refresh-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={14} style={{ color: '#818cf8' }} />
                  <span>Dynamic Anti-Proxy Token</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      rotateQrToken();
                      setCountdown(20);
                    }}
                    style={{
                      background: 'none',
                      color: '#a5b4fc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                    }}
                    title="Force refresh token"
                  >
                    <RefreshCw size={12} />
                    Regen
                  </button>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 700,
                      color: '#fff',
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                    }}
                  >
                    {countdown}s
                  </span>
                </div>
              </div>

              {/* Instructions Box */}
              <div
                style={{
                  padding: '0.85rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                Project this screen onto the classroom projector. Students scan from their desks to mark attendance in real time.
              </div>
            </div>

            {/* Right Column: Live Roster & Scan Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Roster Top Metrics */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Live Classroom Turnout
                  </div>
                  <div
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      color: '#10b981',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {classRecords.length}{' '}
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                      / {safeStudents.length} Students Present
                    </span>
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={exportCsv}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                  Export CSV
                </button>
              </div>

              {/* Toast Message */}
              {toastMessage && (
                <div
                  style={{
                    padding: '0.55rem 0.85rem',
                    background: '#10b981',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <CheckCircle size={15} />
                  {toastMessage}
                </div>
              )}

              {/* Student Search & Quick Stats & Bulk Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Search
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        color: 'var(--text-dim)',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search enrolled student by name or roll..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Staff Bulk Marking Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const res = markAllStudentsPresent(selectedClass.id);
                        if (res?.message) showToast(res.message);
                      }}
                      title="Mark all enrolled students Present for this session"
                      style={{
                        padding: '0.42rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <CheckCircle size={13} />
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = markAllStudentsAbsent(selectedClass.id);
                        if (res?.message) showToast(res.message);
                      }}
                      title="Mark all students Absent for this session"
                      style={{
                        padding: '0.42rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <X size={13} />
                      Mark All Absent
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Staff Quick Manual Attendance Override:</span>
                  <strong style={{ color: '#059669' }}>
                    {classRecords.length} of {safeStudents.length} Students Present
                  </strong>
                </div>
              </div>

              {/* Live Roster Table */}
              <div className="roster-table-container">
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Time / Status</th>
                      <th style={{ textAlign: 'center' }}>Staff Attendance Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((stu) => {
                      const stuId = (stu.id || '').toLowerCase();
                      const stuRoll = (stu.rollNo || stu.roll_no || '').toLowerCase();
                      const isPresent = presentStudentIds.has(stuId) || presentStudentIds.has(stuRoll);
                      const rec = classRecords.find(
                        (r) =>
                          (r.studentId && r.studentId.toLowerCase() === stuId) ||
                          (r.rollNo && (r.rollNo.toLowerCase() === stuRoll || r.rollNo.toLowerCase() === stuId))
                      );

                      return (
                        <tr
                          key={stu.id}
                          className={isPresent ? 'just-marked' : ''}
                        >
                          <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                            {stu.rollNo}
                          </td>
                          <td style={{ fontWeight: 600 }}>{stu.name}</td>
                          <td>
                            {isPresent ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  color: '#059669',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                <CheckCircle size={14} />
                                {rec?.timestamp || 'Present'}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                Absent
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                justifyContent: 'center',
                              }}
                            >
                              {/* Option 1: Mark Present Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const res = markStudentPresent(selectedClass.id, stu);
                                  if (res?.message) showToast(res.message);
                                }}
                                title="Click to mark student Present (increases subject attendance %)"
                                style={{
                                  padding: '0.32rem 0.65rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.28rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  background: isPresent ? '#059669' : '#ECFDF5',
                                  color: isPresent ? '#FFFFFF' : '#059669',
                                  border: isPresent ? '1px solid #047857' : '1px solid #A7F3D0',
                                  boxShadow: isPresent ? '0 1px 4px rgba(5, 150, 105, 0.3)' : 'none',
                                }}
                              >
                                <CheckCircle size={12} />
                                {isPresent ? 'Present ✓' : 'Mark Present'}
                              </button>

                              {/* Option 2: Mark Absent Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const res = markStudentAbsent(selectedClass.id, stu);
                                  if (res?.message) showToast(res.message);
                                }}
                                title="Click to mark student Absent"
                                style={{
                                  padding: '0.32rem 0.65rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.28rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  background: !isPresent ? '#DC2626' : '#FEF2F2',
                                  color: !isPresent ? '#FFFFFF' : '#DC2626',
                                  border: !isPresent ? '1px solid #B91C1C' : '1px solid #FECACA',
                                  boxShadow: !isPresent ? '0 1px 4px rgba(220, 38, 38, 0.3)' : 'none',
                                }}
                              >
                                <X size={12} />
                                {!isPresent ? 'Absent ✗' : 'Mark Absent'}
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
        </div>
      </div>
    </div>
  );
};
