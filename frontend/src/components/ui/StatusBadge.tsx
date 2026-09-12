import React from 'react';
import { ClaimStatus, AgentStatus } from '../../types/claims';

interface StatusBadgeProps {
  status: ClaimStatus | AgentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = () => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'PAID':
        return 'bg-semantic-successBg text-semantic-success border-semantic-success/20';
      case 'PROCESSING':
      case 'ORCHESTRATING':
      case 'ASSESSING':
        return 'bg-peach-light text-plum-deep border-peach-primary/30 animate-pulse';
      case 'AWAITING_CUSTOMER':
      case 'NEEDS_INFORMATION':
      case 'LOW_CONFIDENCE':
        return 'bg-semantic-warningBg text-semantic-warning border-semantic-warning/30';
      case 'HUMAN_REVIEW':
      case 'ESCALATED':
        return 'bg-semantic-dangerBg text-semantic-danger border-semantic-danger/30';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-semantic-dangerBg text-semantic-danger border-semantic-danger/30';
      case 'SKIPPED':
        return 'bg-plum-soft text-ink-secondary border-plum-soft/50';
      default:
        return 'bg-ivory-muted text-ink-secondary border-gray-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'AWAITING_CUSTOMER':
        return 'Awaiting Customer';
      case 'HUMAN_REVIEW':
        return 'Human Review';
      case 'PAYMENT_PROCESSING':
        return 'Processing Payment';
      case 'LOW_CONFIDENCE':
        return 'Low Confidence';
      case 'NEEDS_INFORMATION':
        return 'Needs Info';
      case 'SKIPPED':
        return 'Skipped (Optimized)';
      default:
        return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
    }
  };

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide font-medium ${sizeClass} ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {getLabel()}
    </span>
  );
};
