import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BrandLogo } from '../Common/BrandLogo';

export const Login = () => {
  const { login } = useAttendance();

  // Unified single login state
  const [identifier, setIdentifier] = useState('koshin@university.edu');
  const [password, setPassword] = useState('koshin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Auto-detect role: single login handler checks both student and faculty
    const res = login(identifier, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.25rem',
        color: 'var(--text-main)',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BrandLogo size={60} />
        <h1
          style={{
            fontSize: '2.15rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginTop: '0.85rem',
            marginBottom: '0',
            lineHeight: 1,
          }}
        >
          <span style={{ color: 'var(--text-main)' }}>Uni</span>
          <span style={{ color: 'var(--primary)' }}>Track</span>
        </h1>
      </div>

      {/* Main Single Card Layout */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
        }}
      >
        {/* Single Unified Login Form Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.25rem 2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
            marginBottom: '0',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0' }}>
              Portal Sign In
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '0.84rem',
                fontWeight: 500,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  marginBottom: '0.45rem',
                  fontWeight: 600,
                }}
              >
                Institutional Email / Roll No / Staff ID
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  size={17}
                  style={{ position: 'absolute', left: '0.9rem', color: 'var(--text-dim)' }}
                />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. koshin@university.edu or 21BCSE001 or robert.vance@university.edu"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem 0.75rem 2.45rem',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4F46E5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                  }}
                >
                  Password
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={17}
                  style={{ position: 'absolute', left: '0.9rem', color: 'var(--text-dim)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.6rem 0.75rem 2.45rem',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4F46E5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#4F46E5' }}
                />
                Remember this device
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={14} style={{ color: '#059669' }} />
                <span>Encrypted Session</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginTop: '0.5rem',
              }}
            >
              Sign In to Portal
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
