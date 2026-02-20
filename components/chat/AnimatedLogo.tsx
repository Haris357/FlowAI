'use client';

import { Box } from '@mui/joy';
import { BRAND_COLORS } from '@/styles/colors';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  isResponding?: boolean;
}

export default function AnimatedLogo({ size = 'md', isResponding = false }: AnimatedLogoProps) {
  const sizes = {
    sm: 28,
    md: 48,
    lg: 80,
  };

  const s = sizes[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s,
        height: s,
        position: 'relative',
      }}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`flowGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={BRAND_COLORS.primary} />
            <stop offset="100%" stopColor={BRAND_COLORS.secondary} />
          </linearGradient>
        </defs>

        {/* Outer glow ring — breathes continuously */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={BRAND_COLORS.primary}
          strokeWidth="1.5"
          opacity="0.15"
        >
          <animate
            attributeName="r"
            values="44;48;44"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.15;0.3;0.15"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill={`url(#flowGrad-${size})`}
        >
          {isResponding && (
            <animate
              attributeName="r"
              values="42;40;42"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* === Sparkle / Star burst — 8 rays from center === */}
        <g transform="translate(50, 50)">
          {/* Cardinal rays (N, S, E, W) — longer */}
          {[0, 90, 180, 270].map((angle, i) => (
            <line
              key={`c-${i}`}
              x1="0"
              y1="-10"
              x2="0"
              y2="-22"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              transform={`rotate(${angle})`}
              opacity="0.95"
            >
              <animate
                attributeName="y1"
                values="-10;-8;-10"
                dur={isResponding ? '0.8s' : '2.5s'}
                repeatCount="indefinite"
                begin={`${i * 0.15}s`}
              />
              <animate
                attributeName="y2"
                values="-22;-24;-22"
                dur={isResponding ? '0.8s' : '2.5s'}
                repeatCount="indefinite"
                begin={`${i * 0.15}s`}
              />
              <animate
                attributeName="opacity"
                values="0.95;0.7;0.95"
                dur={isResponding ? '0.8s' : '2.5s'}
                repeatCount="indefinite"
                begin={`${i * 0.15}s`}
              />
            </line>
          ))}

          {/* Diagonal rays (NE, SE, SW, NW) — shorter */}
          {[45, 135, 225, 315].map((angle, i) => (
            <line
              key={`d-${i}`}
              x1="0"
              y1="-8"
              x2="0"
              y2="-16"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              transform={`rotate(${angle})`}
              opacity="0.7"
            >
              <animate
                attributeName="y1"
                values="-8;-6;-8"
                dur={isResponding ? '0.8s' : '2.5s'}
                repeatCount="indefinite"
                begin={`${(i * 0.15) + 0.3}s`}
              />
              <animate
                attributeName="y2"
                values="-16;-18;-16"
                dur={isResponding ? '0.8s' : '2.5s'}
                repeatCount="indefinite"
                begin={`${(i * 0.15) + 0.3}s`}
              />
              <animate
                attributeName="opacity"
                values="0.7;0.45;0.7"
                dur={isResponding ? '0.8s' : '2.5s'}
                repeatCount="indefinite"
                begin={`${(i * 0.15) + 0.3}s`}
              />
            </line>
          ))}

          {/* Center dot — pulses */}
          <circle cx="0" cy="0" r="4" fill="white" opacity="0.95">
            <animate
              attributeName="r"
              values="4;5;4"
              dur={isResponding ? '0.6s' : '2s'}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.95;1;0.95"
              dur={isResponding ? '0.6s' : '2s'}
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Orbiting particle — small dot that circles the icon */}
        {isResponding && (
          <circle cx="50" cy="8" r="2.5" fill="white" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.9;0.6"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>
    </Box>
  );
}
