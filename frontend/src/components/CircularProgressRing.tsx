import React from 'react';

interface CircularProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  centerContent?: React.ReactNode;
  subtitle?: string;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 10,
  circleColor = 'text-earth-200 dark:text-forest-800',
  progressColor = 'text-sage-600 dark:text-sage-400',
  centerContent,
  subtitle,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          className={circleColor}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress stroke */}
        <circle
          className={`${progressColor} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {centerContent ? (
          centerContent
        ) : (
          <>
            <span className="text-xl font-bold text-forest-950 dark:text-sage-100">
              {Math.round(clampedProgress)}%
            </span>
            {subtitle && (
              <span className="text-[10px] uppercase font-semibold text-earth-500 dark:text-sage-400 tracking-wider">
                {subtitle}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
