import React from 'react'

const ICON_LABELS = {
  white: '纯白圆片',
  yellowOval: '黄色椭圆片',
  redCapsule: '红白胶囊',
  blueCapsule: '蓝白胶囊',
  granules: '颗粒冲剂',
}

export default function PillIcon({ type = 'white', size = 56, title }) {
  const label = ICON_LABELS[type] || type

  const shapes = {
    white: (
      <>
        <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="3" />
        <line x1="32" y1="14" x2="32" y2="50" stroke="#D1D5DB" strokeWidth="3" />
      </>
    ),
    yellowOval: (
      <>
        <ellipse cx="32" cy="32" rx="27" ry="16" fill="#FCD34D" stroke="#D97706" strokeWidth="3" />
        <line x1="32" y1="16" x2="32" y2="48" stroke="#F59E0B" strokeWidth="3" />
      </>
    ),
    redCapsule: (
      <>
        <g transform="rotate(-30 32 32)">
          <rect x="8" y="22" width="48" height="20" rx="10" fill="#FFFFFF" stroke="#B91C1C" strokeWidth="3" />
          <path d="M 8 32 A 10 10 0 0 1 18 22 L 32 22 L 32 42 L 18 42 A 10 10 0 0 1 8 32 Z" fill="#DC2626" />
        </g>
      </>
    ),
    blueCapsule: (
      <>
        <g transform="rotate(-30 32 32)">
          <rect x="8" y="22" width="48" height="20" rx="10" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="3" />
          <path d="M 8 32 A 10 10 0 0 1 18 22 L 32 22 L 32 42 L 18 42 A 10 10 0 0 1 8 32 Z" fill="#2563EB" />
        </g>
      </>
    ),
    granules: (
      <>
        <rect x="12" y="10" width="40" height="44" rx="6" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="3" />
        <line x1="12" y1="24" x2="52" y2="24" stroke="#CA8A04" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="24" cy="34" r="2.5" fill="#A16207" />
        <circle cx="33" cy="38" r="2.5" fill="#A16207" />
        <circle cx="42" cy="33" r="2.5" fill="#A16207" />
        <circle cx="27" cy="43" r="2.5" fill="#A16207" />
        <circle cx="39" cy="44" r="2.5" fill="#A16207" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title || label}
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      {shapes[type]}
    </svg>
  )
}
