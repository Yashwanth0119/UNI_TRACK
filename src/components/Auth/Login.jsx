import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '../Common/BrandLogo';

export const Login = () => {
  const { login, isSupabaseConfigured } = useAttendance();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your User ID or Username.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    const res = login(identifier, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials. Please check your User ID and password.');
    }
  };

  const handleFillDemo = (id, pass) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.25rem',
        color: '#0F172A',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BrandLogo size={58} />
        <h1
          style={{
            fontSize: '1.95rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginTop: '0.85rem',
            marginBottom: '0.25rem',
            lineHeight: 1.15,
          }}
        >
          <span style={{ color: '#0F172A' }}>Uni</span>
          <span style={{ color: '#2457FF' }}>Track</span>
        </h1>
        <div style={{ fontSize: '0.92rem', color: '#64748B', fontWeight: 500 }}>
          Smart Attendance System
        </div>
        {isSupabaseConfigured && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
              fontSize: '0.74rem',
              fontWeight: 700,
              marginTop: '0.65rem',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            <span>Supabase Cloud Synced</span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Single Unified Login Form Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '2.25rem 2rem',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Portal Sign In
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
              Common authentication portal for Students and Faculty members.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
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
                  color: '#0F172A',
                  marginBottom: '0.45rem',
                  fontWeight: 600,
                }}
              >
                User ID / Username / Roll No
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User
                  size={17}
                  style={{ position: 'absolute', left: '0.9rem', color: '#94A3B8' }}
                />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. arun, 21CS001, rajesh, FAC-001"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem 0.75rem 2.45rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2457FF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(36, 87, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
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
                    color: '#0F172A',
                    fontWeight: 600,
                  }}
                >
                  Password
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={17}
                  style={{ position: 'absolute', left: '0.9rem', color: '#94A3B8' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.6rem 0.75rem 2.45rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2457FF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(36, 87, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
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
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem',
                    cursor: 'pointer',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2457FF' }}
                />
                Remember this device
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B' }}>
                <ShieldCheck size={14} style={{ color: '#059669' }} />
                <span>Secure Role Detection</span>
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
                background: '#2457FF',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(36, 87, 255, 0.3)',
              }}
            >
              Sign In to Portal
              <ArrowRight size={17} />
            </button>
          </form>
        </div>

        {/* Demo Credentials Documentation Panel */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(36, 87, 255, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(36, 87, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Sparkles size={16} style={{ color: '#2457FF' }} />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo Accounts & Quick Auto-Fill
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
            Click any account below to instantly auto-fill credentials for testing:
          </p>

          {/* Students Demo */}
          <div style={{ marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
              <GraduationCap size={15} style={{ color: '#2457FF' }} />
              <span>5 Student Accounts (Password: [name]123 or student123)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
              {[
                { name: 'Koshin', id: '21CS001', user: 'koshin', pass: 'koshin123', tag: 'DSA <75%' },
                { name: 'Abijith', id: '21CS002', user: 'abijith', pass: 'abijith123', tag: 'Good' },
                { name: 'Enoch John', id: '21CS003', user: 'enoch', pass: 'enoch123', tag: 'DSA/OS <75%' },
                { name: 'Naresh', id: '21CS004', user: 'naresh', pass: 'naresh123', tag: 'DBMS <75%' },
                { name: 'Thirush', id: '21CS005', user: 'thirush', pass: 'thirush123', tag: 'Good' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleFillDemo(s.user, s.pass)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    background: '#F8FAFC',
                    border: '1px solid rgba(36, 87, 255, 0.15)',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2457FF';
                    e.currentTarget.style.background = '#DFF7FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(36, 87, 255, 0.15)';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.id}</div>
                  <div style={{ fontSize: '0.65rem', color: s.tag.includes('<75%') ? '#DC2626' : '#059669', fontWeight: 600, marginTop: '0.15rem' }}>
                    {s.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Teachers Demo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
              <Briefcase size={15} style={{ color: '#059669' }} />
              <span>2 Faculty Accounts (Password: [name]123 or teacher123)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
              {[
                { name: 'Dr. Rajesh Sharma', role: 'Teacher 1 – DSA Faculty', id: 'FAC-001', user: 'rajesh', pass: 'rajesh123', subjects: 'DSA101' },
                { name: 'Prof. Meera Nair', role: 'Teacher 2 – OS & Elective Faculty', id: 'FAC-002', user: 'meera', pass: 'meera123', subjects: 'OS102, DBMS103' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleFillDemo(t.user, t.pass)}
                  style={{
                    padding: '0.5rem 0.65rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#059669';
                    e.currentTarget.style.background = '#ECFDF5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>{t.role}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.15rem' }}>
                    ID: {t.id} • Subjects: {t.subjects}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
