import React from 'react';

export const BrandLogo = ({ size = 38, showText = false, textSize = '1.35rem' }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          {/* Quantum Blue Gradient */}
          <linearGradient id="crest_shield_grad" x1="6" y1="4" x2="46" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5784FF" />
            <stop offset="45%" stopColor="#2457FF" />
            <stop offset="100%" stopColor="#0B2B99" />
          </linearGradient>

          {/* Academic Gold Gradient for Laurel & Tassels */}
          <linearGradient id="crest_gold_grad" x1="12" y1="8" x2="40" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Soft Crest Drop Shadow */}
          <filter id="crest_glow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#1E1B4B" floodOpacity="0.32" />
          </filter>
        </defs>

        {/* Outer Laurel Wreath of Academic Honor (Left & Right Branches) */}
        {/* Left Laurel Leaves */}
        <g stroke="url(#crest_gold_grad)" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <path d="M7 32C6.5 27 7.5 22 9.5 17.5" opacity="0.85" />
          <path d="M5.5 29C4 28 4.5 26 6.5 26.5" />
          <path d="M6.5 24C5 23 5.5 21 7.5 21.5" />
          <path d="M8 19C6.8 18 7.5 16 9.2 16.8" />
        </g>
        {/* Right Laurel Leaves */}
        <g stroke="url(#crest_gold_grad)" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <path d="M45 32C45.5 27 44.5 22 42.5 17.5" opacity="0.85" />
          <path d="M46.5 29C48 28 47.5 26 45.5 26.5" />
          <path d="M45.5 24C47 23 46.5 21 44.5 21.5" />
          <path d="M44 19C45.2 18 44.5 16 42.8 16.8" />
        </g>

        {/* Heraldic College Shield Body */}
        <path
          d="M26 4C34.5 6 42.5 5.5 42.5 5.5V23.5C42.5 34.5 34.5 43 26 47C17.5 43 9.5 34.5 9.5 23.5V5.5C9.5 5.5 17.5 6 26 4Z"
          fill="url(#crest_shield_grad)"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          filter="url(#crest_glow)"
        />

        {/* Inner Gold Inset Border */}
        <path
          d="M26 7.2C33 8.8 39.5 8.4 39.5 8.4V23C39.5 32 32.8 39.5 26 43.3C19.2 39.5 12.5 32 12.5 23V8.4C12.5 8.4 19 8.8 26 7.2Z"
          stroke="url(#crest_gold_grad)"
          strokeWidth="1"
          strokeOpacity="0.7"
          fill="none"
        />

        {/* Academic Mortarboard (Graduation Cap) */}
        <path
          d="M26 10L36.5 15L26 20L15.5 15L26 10Z"
          fill="#FFFFFF"
        />
        {/* Skull Cap Foundation */}
        <path
          d="M20 17.5V21C20 23 26 24.5 26 24.5C26 24.5 32 23 32 21V17.5"
          stroke="#FFFFFF"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Golden Tassel with Ribbon */}
        <path
          d="M34.5 15.6V21.2C34.5 21.9 35.3 22.2 35.8 21.6"
          stroke="url(#crest_gold_grad)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Academic Star of Excellence */}
        <path
          d="M26 22.8L26.6 24.4L28.2 24.5L26.9 25.5L27.4 27.1L26 26.1L24.6 27.1L25.1 25.5L23.8 24.5L25.4 24.4L26 22.8Z"
          fill="url(#crest_gold_grad)"
        />

        {/* Open Book of Knowledge */}
        {/* Left Page */}
        <path
          d="M25.3 28.5C21 27 16.8 27.5 15.2 28.6V37.2C16.8 36.1 21 35.6 25.3 37.1V28.5Z"
          fill="#FFFFFF"
          fillOpacity="0.96"
        />
        {/* Right Page */}
        <path
          d="M26.7 28.5C31 27 35.2 27.5 36.8 28.6V37.2C35.2 36.1 31 35.6 26.7 37.1V28.5Z"
          fill="#FFFFFF"
          fillOpacity="0.96"
        />
        {/* Book Spine Divider */}
        <line x1="26" y1="28" x2="26" y2="37.8" stroke="#312E81" strokeWidth="1.4" strokeLinecap="round" />

        {/* Text Lines on Left & Right Pages */}
        <line x1="17.8" y1="31.2" x2="22.8" y2="30.2" stroke="#6366F1" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="17.8" y1="33.8" x2="22.8" y2="32.8" stroke="#6366F1" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="29.2" y1="30.2" x2="34.2" y2="31.2" stroke="#6366F1" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="29.2" y1="32.8" x2="34.2" y2="33.8" stroke="#6366F1" strokeWidth="0.9" strokeLinecap="round" />
      </svg>

      {showText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--text-main)',
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1,
          }}
        >
          <span>Uni</span>
          <span style={{ color: 'var(--primary)' }}>Track</span>
        </span>
      )}
    </div>
  );
};
