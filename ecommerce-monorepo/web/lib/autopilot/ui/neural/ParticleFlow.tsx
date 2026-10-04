'use client';

import React from 'react';

interface ParticleFlowProps {
  pathString: string;
  color: string;
  count?: number;
  duration?: number;
}

export const ParticleFlow: React.FC<ParticleFlowProps> = React.memo(({
  pathString,
  color,
  count = 2,
  duration = 2.4,
}) => {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <g className="pointer-events-none">
      {particles.map((idx) => {
        const beginTime = `${(idx * duration) / count}s`;

        return (
          <circle
            key={idx}
            r={3}
            fill={color}
            opacity={0.9}
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.8))"
          >
            {/* Native SVG Motion along path */}
            <animateMotion
              path={pathString}
              dur={`${duration}s`}
              begin={beginTime}
              repeatCount="indefinite"
              rotate="auto"
            />
            {/* Opacity pulse */}
            <animate
              attributeName="opacity"
              values="0; 1; 1; 0.2; 0"
              keyTimes="0; 0.2; 0.7; 0.9; 1"
              dur={`${duration}s`}
              begin={beginTime}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </g>
  );
});

ParticleFlow.displayName = 'ParticleFlow';
