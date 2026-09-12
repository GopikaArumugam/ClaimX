import React from 'react';
import { Sparkles, HelpCircle, AlertTriangle, ShieldAlert, RotateCcw, Zap } from 'lucide-react';

interface DemoBarProps {
  onRunSimple: () => void;
  onRunUncertain: () => void;
  onRunFraud: () => void;
  onRunExpiredPolicy: () => void;
  onResetDefaults: () => void;
  activeScenario?: string | null;
}

export const DemoBar: React.FC<DemoBarProps> = ({
  onRunSimple,
  onRunUncertain,
  onRunFraud,
  onRunExpiredPolicy,
  onResetDefaults,
  activeScenario,
}) => {
  return (
    <div className="bg-plum-deep text-white px-4 py-2.5 border-b border-plum-secondary shadow-md flex items-center justify-between flex-wrap gap-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-peach-primary text-plum-deep font-extrabold text-[11px] uppercase tracking-wider shadow-glow-peach">
          <Zap className="w-3.5 h-3.5" />
          Demo Mode
        </span>
        <span className="hidden sm:inline text-plum-soft/80 font-medium text-xs">
          Select an interactive AI scenario to simulate live dynamic orchestration:
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Demo 1: Simple Claim */}
        <button
          onClick={onRunSimple}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
            activeScenario === 'simple'
              ? 'bg-semantic-success text-white shadow-soft'
              : 'bg-plum-secondary text-white hover:bg-plum-hover hover:border-peach-primary/40 border border-plum-soft/20'
          }`}
          title="Full Straightforward Auto-Approval"
        >
          <Sparkles className="w-3.5 h-3.5 text-peach-primary" />
          <span>1. Simple Claim</span>
          <span className="text-[10px] opacity-75 font-normal hidden lg:inline">(Auto-Approve)</span>
        </button>

        {/* Demo 2: Uncertain Claim */}
        <button
          onClick={onRunUncertain}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
            activeScenario === 'uncertain'
              ? 'bg-semantic-warning text-plum-deep shadow-soft'
              : 'bg-plum-secondary text-white hover:bg-plum-hover hover:border-peach-primary/40 border border-plum-soft/20'
          }`}
          title="Vision low confidence (31%) prompts customer for clearer photo, customer re-uploads, Vision 94%"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-semantic-warning" />
          <span>2. Uncertain Claim</span>
          <span className="text-[10px] opacity-75 font-normal hidden lg:inline">(Ask Customer Loop)</span>
        </button>

        {/* Demo 3: Fraud Case */}
        <button
          onClick={onRunFraud}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
            activeScenario === 'fraud'
              ? 'bg-semantic-danger text-white shadow-soft'
              : 'bg-plum-secondary text-white hover:bg-plum-hover hover:border-peach-primary/40 border border-plum-soft/20'
          }`}
          title="VIN Mismatch & 51% invoice inflation -> Fraud score 87/100 -> Escalates to Human Review"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-semantic-danger" />
          <span>3. Fraud Case</span>
          <span className="text-[10px] opacity-75 font-normal hidden lg:inline">(Human Review)</span>
        </button>

        {/* Demo 4: Expired Policy Dynamic Routing */}
        <button
          onClick={onRunExpiredPolicy}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
            activeScenario === 'expired'
              ? 'bg-plum-soft text-plum-deep shadow-soft'
              : 'bg-plum-secondary text-white hover:bg-plum-hover hover:border-peach-primary/40 border border-plum-soft/20'
          }`}
          title="Policy expired -> Skips Vision & Estimation -> Fast Reject (Workflow Optimized)"
        >
          <Zap className="w-3.5 h-3.5 text-peach-primary" />
          <span>4. Dynamic Routing</span>
          <span className="text-[10px] opacity-75 font-normal hidden lg:inline">(Pruned Pipeline)</span>
        </button>

        {/* Reset Defaults */}
        <button
          onClick={onResetDefaults}
          className="p-1.5 rounded-lg text-plum-soft/80 hover:text-white hover:bg-plum-secondary transition-colors"
          title="Reset Demo Claims to Initial State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
