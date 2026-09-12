import React from 'react';
import { ChevronRight, FileCheck, RefreshCw, AlertCircle, UserCheck, CheckCircle2, CreditCard } from 'lucide-react';
import { ClaimStatus } from '../../types/claims';

interface PipelineFunnelProps {
  activeStageFilter: string | null;
  onSelectStage: (stage: string | null) => void;
  counts?: {
    submitted: number;
    processing: number;
    awaitingInfo: number;
    humanReview: number;
    approved: number;
    settled: number;
  };
}

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({
  activeStageFilter,
  onSelectStage,
  counts = {
    submitted: 128,
    processing: 47,
    awaitingInfo: 13,
    humanReview: 21,
    approved: 742,
    settled: 711,
  },
}) => {
  const stages = [
    {
      id: 'SUBMITTED',
      label: 'Submitted',
      count: counts.submitted,
      icon: FileCheck,
      color: 'border-plum-soft text-ink-primary hover:border-plum-secondary',
      activeColor: 'bg-plum-deep text-white border-plum-deep shadow-soft',
      iconColor: 'text-plum-secondary',
    },
    {
      id: 'PROCESSING',
      label: 'Processing',
      count: counts.processing,
      icon: RefreshCw,
      color: 'border-peach-primary/40 text-plum-deep hover:border-peach-primary',
      activeColor: 'bg-peach-primary text-plum-deep border-peach-primary shadow-glow-peach',
      iconColor: 'text-peach-primary animate-spin',
    },
    {
      id: 'AWAITING_CUSTOMER',
      label: 'Awaiting Info',
      count: counts.awaitingInfo,
      icon: AlertCircle,
      color: 'border-semantic-warning/40 text-semantic-warning hover:border-semantic-warning',
      activeColor: 'bg-semantic-warning text-plum-deep border-semantic-warning shadow-soft',
      iconColor: 'text-semantic-warning',
    },
    {
      id: 'HUMAN_REVIEW',
      label: 'Human Review',
      count: counts.humanReview,
      icon: UserCheck,
      color: 'border-semantic-danger/40 text-semantic-danger hover:border-semantic-danger',
      activeColor: 'bg-semantic-danger text-white border-semantic-danger shadow-soft',
      iconColor: 'text-semantic-danger',
    },
    {
      id: 'APPROVED',
      label: 'Approved',
      count: counts.approved,
      icon: CheckCircle2,
      color: 'border-semantic-success/40 text-semantic-success hover:border-semantic-success',
      activeColor: 'bg-semantic-success text-white border-semantic-success shadow-soft',
      iconColor: 'text-semantic-success',
    },
    {
      id: 'PAID',
      label: 'Settled',
      count: counts.settled,
      icon: CreditCard,
      color: 'border-plum-soft text-plum-deep hover:border-plum-deep',
      activeColor: 'bg-plum-secondary text-white border-plum-secondary shadow-soft',
      iconColor: 'text-plum-soft',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep flex items-center gap-2">
            <span>Live Claim Pipeline</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-peach-light text-plum-deep border border-peach-primary/30">
              Interactive Filter
            </span>
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Click any operational pipeline stage to filter live records below
          </p>
        </div>
        {activeStageFilter && (
          <button
            onClick={() => onSelectStage(null)}
            className="text-xs font-semibold text-peach-primary hover:text-peach-hover hover:underline transition-colors"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = activeStageFilter === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(isSelected ? null : stage.id)}
              className={`flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected ? stage.activeColor : `bg-ivory-warm/60 ${stage.color}`
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                  {stage.label}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                    isSelected ? 'text-current' : stage.iconColor
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold tracking-tight font-sans">
                  {stage.count}
                </span>
                {idx < stages.length - 1 && (
                  <ChevronRight
                    className={`w-3 h-3 opacity-30 hidden lg:block ${
                      isSelected ? 'text-white' : 'text-ink-secondary'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
