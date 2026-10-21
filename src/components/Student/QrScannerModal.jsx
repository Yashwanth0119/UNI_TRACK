import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAttendance } from '../../context/AttendanceContext';
import {
  X,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Clock,
  TrendingUp,
  Check,
} from 'lucide-react';

export const QrScannerModal = ({ isOpen, onClose }) => {
  const {
    markAttendanceFromScan,
    activeLiveClass,
  } = useAttendance();

  const [scanStatus, setScanStatus] = useState({ type: null, message: '', classInfo: null });
  const [cameraError, setCameraError] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isStoppingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        isStoppingRef.current = false;
        html5QrCodeRef.current = null;
      }
    }
  }, []);

  const handleScanSuccess = useCallback((text) => {
    const result = markAttendanceFromScan(text);
    if (result.success) {
      stopScanner();
      setScanStatus({
        type: 'success',
        message: result.message,
        classInfo: result.classInfo,
        record: result.record,
        prevSubPct: result.prevSubPct,
        newSubPct: result.newSubPct,
        prevOverallPct: result.prevOverallPct,
        newOverallPct: result.newOverallPct,
        studentName: result.studentName,
        rollNo: result.rollNo,
      });
      // Automatically close modal after 4.5 seconds on success (or user can click Done immediately)
      setTimeout(() => {
        onClose();
      }, 4500);
    } else {
      setScanStatus({
        type: 'error',
        message: result.error,
        classInfo: result.classInfo,
      });
    }
  }, [markAttendanceFromScan, onClose, stopScanner]);

  // Initialize camera scanner when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setScanStatus({ type: null, message: '', classInfo: null });
    setCameraError(null);

    const startScanner = async () => {
      try {
        const qrCodeScanner = new Html5Qrcode('qr-reader-region');
        html5QrCodeRef.current = qrCodeScanner;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        await qrCodeScanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // normal per-frame scanning progress, ignore
          }
        );
      } catch (err) {
        console.warn('Camera start error:', err);
        setCameraError(
          err.message || 'Camera access not available or permission denied. You can scan by uploading a QR image below!'
        );
      }
    };

    // Small delay to ensure DOM container is rendered
    const timeout = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen, handleScanSuccess, stopScanner]);

  // File upload fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-region');
      }
      const imageResult = await html5QrCodeRef.current.scanFile(file, true);
      handleScanSuccess(imageResult);
    } catch (err) {
      setScanStatus({
        type: 'error',
        message: 'Could not detect a valid QR code in the uploaded image.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-pop-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            {scanStatus.type === 'success' ? (
              <>
                <CheckCircle size={22} style={{ color: '#059669' }} />
                <span>Attendance Verified</span>
              </>
            ) : (
              <>
                <Camera size={22} style={{ color: 'var(--primary)' }} />
                <span>Scan Classroom Attendance QR</span>
              </>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* SUCCESS VIEW AFTER SCANNING */}
          {scanStatus.type === 'success' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0.25rem' }}>
              {/* Animated Green Badge Icon */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  border: '2px solid #10B981',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)',
                  animation: 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              >
                <Check size={38} strokeWidth={3} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.5rem',
                }}
              >
                <CheckCircle size={13} />
                Attendance Verified & Marked
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Attendance Marked Successfully!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                {scanStatus.message}
              </p>

              {/* Student & Session Info Card */}
              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.1rem',
                  textAlign: 'left',
                  marginBottom: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Student</span>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    {scanStatus.studentName} ({scanStatus.rollNo})
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Lecture / Class</span>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--primary)' }}>
                    {scanStatus.classInfo?.code} - {scanStatus.classInfo?.name}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Time Verified</span>
                  <strong style={{ fontSize: '0.84rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} />
                    {scanStatus.record?.timestamp || 'Just now'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status</span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#059669',
                      background: '#ECFDF5',
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    PRESENT ✓
                  </span>
                </div>
              </div>

              {/* Attendance Percentage Increase Breakdown */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
                  border: '1px solid #A7F3D0',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.15rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#065F46',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <TrendingUp size={15} style={{ color: '#059669' }} />
                  Attendance Percentage Increased
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #D1FAE5' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      {scanStatus.classInfo?.code} Attendance
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.86rem', textDecoration: 'line-through' }}>
                        {scanStatus.prevSubPct}%
                      </span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                        ➔ {scanStatus.newSubPct}%
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: '0.2rem' }}>
                      +{(parseFloat(scanStatus.newSubPct || 0) - parseFloat(scanStatus.prevSubPct || 0)).toFixed(1)}% Increase
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #D1FAE5' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Overall Attendance
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.86rem', textDecoration: 'line-through' }}>
                        {scanStatus.prevOverallPct}%
                      </span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                        ➔ {scanStatus.newOverallPct}%
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: '0.2rem' }}>
                      +{(parseFloat(scanStatus.newOverallPct || 0) - parseFloat(scanStatus.prevOverallPct || 0)).toFixed(1)}% Increase
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.92rem' }}
              >
                Done (Back to Dashboard)
              </button>
            </div>
          ) : (
            /* SCANNER ACTIVE VIEW */
            <>
              {/* Error Status Alert Banner */}
              {scanStatus.type === 'error' && (
                <div
                  className="eligibility-box warning"
                  style={{ marginBottom: '1.25rem' }}
                >
                  <AlertCircle size={22} style={{ color: '#f43f5e', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>
                    <strong>Notice:</strong> {scanStatus.message}
                  </div>
                </div>
              )}

              {/* Active Class Status Notice */}
              {activeLiveClass ? (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.65rem 0.85rem',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#065F46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <div>
                    <strong>Active Class:</strong> Scanner is enabled for <strong>{activeLiveClass.code}</strong> ({activeLiveClass.name}) • <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}><Clock size={12} /> {activeLiveClass.time} ({activeLiveClass.periodName || 'Lecture'})</span>.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.65rem 0.85rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Lock size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div>
                    <strong>No Active Lecture:</strong> All classroom scanners are inactive right now. A professor must start a lecture before attendance can be marked.
                  </div>
                </div>
              )}

              {/* Scanner Viewport */}
              <div className="scanner-viewport-wrapper">
                <div id="qr-reader-region" style={{ width: '100%', height: '100%' }}></div>

                {/* Futuristic HUD overlay */}
                <div className="scanner-reticle-overlay">
                  <div className="scanner-box-hud">
                    <span className="hud-corner hud-tl" />
                    <span className="hud-corner hud-tr" />
                    <span className="hud-corner hud-bl" />
                    <span className="hud-corner hud-br" />
                    <div className="laser-beam" />
                  </div>
                </div>
              </div>

              {/* Camera Permission / Fallback Info */}
              {cameraError && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: '#B45309',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>
                    Camera inactive or permission required. You can scan by uploading a QR image below or pointing your device camera.
                  </span>
                </div>
              )}

              {/* Bottom Upload QR Option */}
              <div className="scanner-controls" style={{ marginTop: '1.25rem' }}>
                <label
                  className="btn-secondary"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.78rem',
                    padding: '0.45rem 0.85rem',
                  }}
                >
                  <Upload size={14} />
                  Upload QR Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Align the professor's projected QR inside the reticle
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
