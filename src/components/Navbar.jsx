import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Sparkles,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from './Common/BrandLogo';

export const Navbar = () => {
  const {
    role,
    currentStudent,
    currentProfessor,
    logout,
    isSupabaseConfigured,
  } = useAttendance();

  const currentUser = role === 'student' ? currentStudent : currentProfessor;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand & Cloud Status */}
        <div className="brand-section" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BrandLogo size={36} showText={true} textSize="1.3rem" />
          {isSupabaseConfigured && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
              title="Connected to Supabase PostgreSQL Cloud Database"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                }}
              />
              <span>Supabase Live</span>
            </div>
          )}
        </div>



        {/* Right Controls */}
        <div className="nav-controls">


          {/* User Persona Profile */}
          <div className="user-profile-badge">
            <div
              className="user-avatar-initials"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: role === 'professor' ? 'linear-gradient(135deg, #2457FF 0%, #688eff 100%)' : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.88rem',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="user-meta-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{currentUser.name}</span>
                {role === 'professor' && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: 'var(--ice-glass)',
                      color: 'var(--quantum-blue)',
                      border: '1px solid rgba(36, 87, 255, 0.25)',
                    }}
                  >
                    {currentProfessor.subjectCode}
                  </span>
                )}
              </div>
              <div className="user-meta-sub">
                {role === 'student'
                  ? `${currentStudent.rollNo} • CS Yr 3`
                  : currentProfessor.subjectName}
              </div>
            </div>
          </div>



          {/* Log Out Button */}
          <button
            className="btn-secondary"
            onClick={logout}
            title="Log out and return to credentials login screen"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
};
