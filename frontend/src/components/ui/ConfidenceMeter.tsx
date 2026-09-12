import React from 'react';

interface ConfidenceMeterProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence,
  showLabel = true,
  size = 'md',
}) => {
  const getBarColor = () => {
    if (confidence >= 85) return 'bg-semantic-success';
    if (confidence >= 65) return 'bg-peach-primary';
    if (confidence >= 45) return 'bg-semantic-warning';
    return 'bg-semantic-danger';
  };

  const getTextColor = () => {
    if (confidence >= 85) return 'text-semantic-success';
    if (confidence >= 65) return 'text-peach-hover';
    if (confidence >= 45) return 'text-semantic-warning';
    return 'text-semantic-danger';
  };

  const barHeight = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="w-full flex items-center gap-2">
      <div className={`flex-1 bg-plum-soft/60 rounded-full overflow-hidden ${barHeight}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
        />
      </div>
      {showLabel && (
        <span className={`font-mono font-semibold text-xs min-w-[34px] text-right ${getTextColor()}`}>
          {confidence}%
        </span>
      )}
    </div>
  );
};
