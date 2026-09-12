import React from 'react';
import { ClaimRisk } from '../../types/claims';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  risk: ClaimRisk;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, score }) => {
  const getBadgeConfig = () => {
    switch (risk) {
      case 'High':
        return {
          bg: 'bg-semantic-dangerBg text-semantic-danger border-semantic-danger/30',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          label: 'High Risk',
        };
      case 'Medium':
        return {
          bg: 'bg-semantic-warningBg text-semantic-warning border-semantic-warning/30',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'Medium Risk',
        };
      case 'Low':
      default:
        return {
          bg: 'bg-semantic-successBg text-semantic-success border-semantic-success/30',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'Low Risk',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      {config.icon}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="ml-0.5 opacity-85 font-mono text-[11px]">({score}/100)</span>
      )}
    </span>
  );
};
