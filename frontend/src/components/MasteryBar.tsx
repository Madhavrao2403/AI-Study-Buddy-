import React from 'react';
import { getMasteryBarClass, getMasteryBadgeClass, getMasteryLevelLabel } from '../utils/helpers';

interface MasteryBarProps {
  score: number;
  level?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const MasteryBar: React.FC<MasteryBarProps> = ({ score, level, showLabel = true, size = 'sm' }) => {
  const lvl = level || (score >= 86 ? 'mastered' : score >= 71 ? 'good' : score >= 51 ? 'developing' : score >= 31 ? 'needs_attention' : 'critical');
  const barClass = getMasteryBarClass(lvl);
  const height = size === 'md' ? '8px' : '5px';

  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className={getMasteryBadgeClass(lvl)}>{getMasteryLevelLabel(lvl)}</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(score)}%</span>
        </div>
      )}
      <div className="mastery-bar-track" style={{ height }}>
        <div className={`mastery-bar-fill ${barClass}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  );
};

export default MasteryBar;
