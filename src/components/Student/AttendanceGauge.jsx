import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';

export const AttendanceGauge = () => {
  const {
    overallPercentage,
    totalAttended,
    totalClassesCount,
    subjectStats,
  } = useAttendance();

  const pct = parseFloat(overallPercentage);
  const isSafe = pct >= 75;

  // Gauge SVG math
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let gaugeColor = '#059669'; // Green
  if (pct < 70) {
    gaugeColor = '#DC2626'; // Red
  } else if (pct < 75) {
    gaugeColor = '#D97706'; // Amber
  }



  return (
    <div className="glass-panel attendance-overview-card glow-hover">
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="section-title">Attendance Status</h2>
          <div className="section-subtitle">Semester aggregate tracking</div>
        </div>
        <span
          className={`status-pill ${isSafe ? 'present' : 'live'}`}
          style={{ fontSize: '0.72rem' }}
        >
          {isSafe ? 'Eligible for Exams' : 'Attendance Shortage'}
        </span>
      </div>

      {/* Circular Progress Gauge */}
      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 190 190">
          <circle
            className="gauge-bg-circle"
            cx="95"
            cy="95"
            r={radius}
          />
          <circle
            className="gauge-progress-circle"
            cx="95"
            cy="95"
            r={radius}
            stroke={gaugeColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="gauge-center-text">
          <span className="gauge-percentage-number" style={{ color: gaugeColor }}>
            {overallPercentage}%
          </span>
          <span className="gauge-percentage-sub">Overall Attendance</span>
        </div>
      </div>

      {/* Mini Stats Numbers Row */}
      <div className="stats-numbers-row">
        <div className="mini-stat-card">
          <div className="mini-stat-val" style={{ color: '#059669' }}>
            {totalAttended}
          </div>
          <div className="mini-stat-label">Classes Attended</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-val">
            {totalClassesCount}
          </div>
          <div className="mini-stat-label">Total Conducted</div>
        </div>
      </div>



      {/* Subject Breakdown Bars */}
      <div>
        <h4 style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.85rem' }}>
          Course-wise Breakdown
        </h4>
        <div className="subject-stats-list">
          {subjectStats.map((sub) => {
            const subjectPct = ((sub.attended / sub.total) * 100).toFixed(1);
            const subIsSafe = parseFloat(subjectPct) >= 75;

            return (
              <div
                key={sub.code}
                className="subject-item"
                style={{
                  padding: !subIsSafe ? '0.65rem 0.75rem' : '0.35rem 0',
                  borderRadius: 'var(--radius-sm)',
                  background: !subIsSafe ? '#FEF2F2' : 'transparent',
                  border: !subIsSafe ? '1px solid #FECACA' : '1px solid transparent',
                }}
              >
                <div className="subject-item-top">
                  <div>
                    <span className="subject-name" style={{ color: !subIsSafe ? '#DC2626' : 'var(--text-main)' }}>
                      {sub.name}
                    </span>{' '}
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      ({sub.code})
                    </span>
                    {!subIsSafe && (
                      <span
                        style={{
                          marginLeft: '0.45rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#DC2626',
                          background: '#FEE2E2',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        Shortage
                      </span>
                    )}
                  </div>
                  <div className="subject-counts">
                    <span>
                      {sub.attended}/{sub.total}
                    </span>
                    <span
                      className="subject-pct"
                      style={{ color: subIsSafe ? '#059669' : '#DC2626', fontWeight: 800 }}
                    >
                      {subjectPct}%
                    </span>
                  </div>
                </div>

                <div className="progress-track" style={{ height: '8px', margin: '0.35rem 0' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.max(5, subjectPct))}%`,
                      background: subIsSafe
                        ? 'linear-gradient(90deg, #4F46E5, #10b981)'
                        : '#DC2626',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
