import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAttendance } from '../../context/AttendanceContext';
import {
  X,
  Camera,
  Upload,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info,
  Lock,
  Clock,
} from 'lucide-react';

export const QrScannerModal = ({ isOpen, onClose, preselectedClassId }) => {
  const {
    markAttendanceFromScan,
    classes,
    getQrPayload,
    activeLiveClass,
  } = useAttendance();

  const [scanStatus, setScanStatus] = useState({ type: null, message: '', classInfo: null });
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [simulatedClassId, setSimulatedClassId] = useState(
    activeLiveClass?.id || preselectedClassId || classes[0]?.id
  );

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
        setCameraActive(false);
      }
    }
  }, []);

  const handleScanSuccess = useCallback((text) => {
    const result = markAttendanceFromScan(text);
    if (result.success) {
      setScanStatus({
        type: 'success',
        message: result.message,
        classInfo: result.classInfo,
      });
      // Automatically close modal after 2.4 seconds on success
      setTimeout(() => {
        onClose();
      }, 2400);
    } else {
      setScanStatus({
        type: 'error',
        message: result.error,
        classInfo: result.classInfo,
      });
    }
  }, [markAttendanceFromScan, onClose]);

  // Update simulated class selection whenever active class changes
  useEffect(() => {
    if (activeLiveClass) {
      setSimulatedClassId(activeLiveClass.id);
    } else if (preselectedClassId) {
      setSimulatedClassId(preselectedClassId);
    }
  }, [activeLiveClass, preselectedClassId]);

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

        setCameraActive(true);
      } catch (err) {
        console.warn('Camera start error:', err);
        setCameraActive(false);
        setCameraError(
          err.message || 'Camera access not available or permission denied. You can still use the Quick Test Simulator or Upload an image!'
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

  // Quick 1-Click Simulation Scan
  const handleSimulateScan = () => {
    const payload = getQrPayload(simulatedClassId);
    handleScanSuccess(payload);
  };

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
            <Camera size={22} style={{ color: 'var(--primary)' }} />
            Scan Classroom Attendance QR
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Status Alert Banner */}
          {scanStatus.type && (
            <div
              className={`eligibility-box ${
                scanStatus.type === 'success' ? 'safe' : 'warning'
              }`}
              style={{ marginBottom: '1.25rem' }}
            >
              {scanStatus.type === 'success' ? (
                <CheckCircle size={22} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={22} style={{ color: '#f43f5e', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, fontSize: '0.85rem' }}>
                <strong>
                  {scanStatus.type === 'success' ? 'Success!' : 'Notice:'}
                </strong>{' '}
                {scanStatus.message}
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
                <strong>Active Class:</strong> Scanner is enabled for <strong>{activeLiveClass.code}</strong> ({activeLiveClass.name}) • <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}><Clock size={12} /> {activeLiveClass.time} ({activeLiveClass.periodName || 'Lecture'})</span>. All other class scanners are inactive.
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
                Webcam inactive. Use the <strong>Instant Test Scan</strong> below to test effortlessly!
              </span>
            </div>
          )}

          {/* Quick Simulation Bar */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: '#F9FAFB',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Zap size={15} style={{ color: '#D97706' }} />
                Instant Test Scanner (1-Click)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeLiveClass ? `Active: ${activeLiveClass.code}` : 'No Class In Session'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={simulatedClassId}
                onChange={(e) => setSimulatedClassId(e.target.value)}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              >
                {classes.map((cls) => {
                  const isLive = cls.status === 'live';
                  return (
                    <option
                      key={cls.id}
                      value={cls.id}
                      disabled={!isLive}
                      style={{ color: isLive ? '#059669' : '#9CA3AF' }}
                    >
                      {isLive ? `🟢 ACTIVE (IN SESSION): ${cls.code} - ${cls.name}` : `🔒 INACTIVE: ${cls.code} - ${cls.name} (Locked)`}
                    </option>
                  );
                })}
              </select>

              <button
                className="btn-primary"
                onClick={handleSimulateScan}
                disabled={!activeLiveClass}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  opacity: !activeLiveClass ? 0.5 : 1,
                  cursor: !activeLiveClass ? 'not-allowed' : 'pointer',
                }}
              >
                <Zap size={14} />
                Scan Now
              </button>
            </div>
          </div>

          {/* Bottom Upload QR Option */}
          <div className="scanner-controls">
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
        </div>
      </div>
    </div>
  );
};
