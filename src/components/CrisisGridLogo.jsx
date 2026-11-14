import React, { useId } from 'react';

export default function CrisisGridLogo({
  size = 'md',
  showWordmark = false,
  subtitle = '',
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const dimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  const iconSizeClass = dimensions[size] || dimensions.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Emblem */}
      <div
        className={`relative ${iconSizeClass} shrink-0 rounded-xl bg-neutral-950/90 border border-cyan-400/35 shadow-[0_0_20px_rgba(34,211,238,0.28)] flex items-center justify-center p-0.5`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`cg-bg-${uid}`}
              x1="6"
              y1="6"
              x2="58"
              y2="58"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="55%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
            <linearGradient
              id={`cg-rim-${uid}`}
              x1="8"
              y1="4"
              x2="56"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient
              id={`cg-bolt-${uid}`}
              x1="24"
              y1="14"
              x2="40"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Outer Hexagonal Substation Shield */}
          <polygon
            points="32,4 56,17 56,47 32,60 8,47 8,17"
            fill={`url(#cg-bg-${uid})`}
            stroke={`url(#cg-rim-${uid})`}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* Inner Telemetry Mesh Ring */}
          <polygon
            points="32,11 49,20.5 49,43.5 32,53 15,43.5 15,20.5"
            fill="none"
            stroke="#22d3ee"
            strokeOpacity="0.3"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />

          {/* 4 Critical Infrastructure Feeder Traces */}
          <g
            stroke="#22d3ee"
            strokeOpacity="0.6"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <line x1="16" y1="21" x2="26" y2="27" />
            <line x1="48" y1="21" x2="38" y2="27" />
            <line x1="16" y1="43" x2="26" y2="37" />
            <line x1="48" y1="43" x2="38" y2="37" />
          </g>

          {/* 4 Critical Sector Nodes (Hospital, Water, Emergency, Telecom) */}
          <circle
            cx="16"
            cy="21"
            r="2.8"
            fill="#38bdf8"
            stroke="#090d16"
            strokeWidth="1"
          />
          <circle
            cx="48"
            cy="21"
            r="2.8"
            fill="#10b981"
            stroke="#090d16"
            strokeWidth="1"
          />
          <circle
            cx="16"
            cy="43"
            r="2.8"
            fill="#22d3ee"
            stroke="#090d16"
            strokeWidth="1"
          />
          <circle
            cx="48"
            cy="43"
            r="2.8"
            fill="#34d399"
            stroke="#090d16"
            strokeWidth="1"
          />

          {/* Central High-Voltage Autonomous Dispatch Core */}
          <path
            d="M35.5 15L21.5 34H31.5L28.5 49L42.5 30H32.5L35.5 15Z"
            fill={`url(#cg-bolt-${uid})`}
            stroke="#083344"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Optional Wordmark & Subtitle Lockup */}
      {showWordmark && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
              CrisisGrid
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400">
              AI
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-neutral-400 truncate">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
