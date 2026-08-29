import React from 'react';
import { getMasteryBadgeClass, getMasteryLevelLabel } from '../utils/helpers';

interface MasteryBadgeProps {
  level: string;
  score?: number;
}

const MasteryBadge: React.FC<MasteryBadgeProps> = ({ level, score }) => (
  <span className={getMasteryBadgeClass(level)}>
    {getMasteryLevelLabel(level)}
    {score !== undefined && ` · ${Math.round(score)}%`}
  </span>
);

export default MasteryBadge;
