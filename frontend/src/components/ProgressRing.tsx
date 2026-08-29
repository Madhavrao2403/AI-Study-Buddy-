import React from 'react';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  value: number; // 0–100
  color?: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 80, strokeWidth = 6, value, color = 'var(--accent-blue)', children
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} className="progress-ring">
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth} />
        <circle
          className="progress-ring-fill"
          cx={size / 2} cy={size / 2} r={r}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      {children && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
