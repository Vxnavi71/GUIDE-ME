import React, { useEffect, useId, useRef, useState } from 'react';

interface CircularProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  centerContent?: React.ReactNode;
  subtitle?: string;
  /** Optional second stop for a gradient sweep. Falls back to a solid stroke when omitted. */
  gradientTo?: string;
  /** Renders a soft glow behind the arc. Best reserved for a page's primary ring. */
  glow?: boolean;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 10,
  circleColor = 'text-earth-200 dark:text-forest-800',
  progressColor = 'text-sage-600 dark:text-sage-400',
  centerContent,
  subtitle,
  gradientTo,
  glow = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 100);
  const gradientId = useId();

  // Animate from empty on first paint so the value reads as a measurement being taken,
  // then track prop changes directly.
  const [displayed, setDisplayed] = useState(0);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      const frame = requestAnimationFrame(() => setDisplayed(clampedProgress));
      return () => cancelAnimationFrame(frame);
    }
    setDisplayed(clampedProgress);
  }, [clampedProgress]);

  const strokeDashoffset = circumference - (displayed / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clampedProgress)} percent`}
    >
      <svg className="-rotate-90 overflow-visible" width={size} height={size}>
        {gradientTo && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" className={progressColor} />
              <stop offset="100%" stopColor="currentColor" className={gradientTo} />
            </linearGradient>
          </defs>
        )}

        {/* Track */}
        <circle
          className={circleColor}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Soft glow beneath the arc, drawn before it so it never muddies the stroke. */}
        {glow && displayed > 0 && (
          <circle
            className={progressColor}
            strokeWidth={strokeWidth + 5}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            opacity={0.16}
            style={{
              filter: 'blur(6px)',
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        )}

        {/* Progress arc */}
        <circle
          className={gradientTo ? undefined : progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={gradientTo ? `url(#${gradientId})` : 'currentColor'}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {centerContent ? (
          centerContent
        ) : (
          <>
            <span className="text-xl font-bold tracking-tight text-forest-950 dark:text-sage-50 tabular-nums">
              {Math.round(clampedProgress)}%
            </span>
            {subtitle && (
              <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400 tracking-[0.1em]">
                {subtitle}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
