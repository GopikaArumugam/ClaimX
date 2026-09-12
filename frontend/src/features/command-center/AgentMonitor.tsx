import React from 'react';
import { AgentId } from '../../types/claims';
import {
  Brain,
  FileCheck,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Calculator,
  CheckCircle,
  Activity,
} from 'lucide-react';

interface AgentInfo {
  id: AgentId;
  name: string;
  status: 'Active' | 'Idle' | 'Analyzing';
  currentTask: string;
  activeClaimId?: string;
  confidence: number;
  claimsProcessed: number;
  icon: any;
}

interface AgentMonitorProps {
  onAgentClick?: (agentId: AgentId) => void;
  activeAgentId?: AgentId;
}

export const AgentMonitor: React.FC<AgentMonitorProps> = ({ onAgentClick, activeAgentId }) => {
  const agents: AgentInfo[] = [
    {
      id: 'orchestrator',
      name: 'Claim Orchestrator',
      status: activeAgentId === 'orchestrator' ? 'Analyzing' : 'Active',
      currentTask: 'Dynamic coordination & uncertainty routing',
      activeClaimId: 'CLM-2026-01842',
      confidence: 96,
      claimsProcessed: 1284,
      icon: Brain,
    },
    {
      id: 'document',
      name: 'Document Agent',
      status: activeAgentId === 'document' ? 'Analyzing' : 'Active',
      currentTask: 'Extracting OCR entities from Policy & RC',
      activeClaimId: 'CLM-2026-01842',
      confidence: 97,
      claimsProcessed: 1284,
      icon: FileCheck,
    },
    {
      id: 'vision',
      name: 'Vision Agent',
      status: activeAgentId === 'vision' ? 'Analyzing' : 'Active',
      currentTask: 'Assess front bumper & headlamp damage',
      activeClaimId: 'CLM-2026-01842',
      confidence: 94,
      claimsProcessed: 1102,
      icon: Eye,
    },
    {
      id: 'policy',
      name: 'Policy Agent',
      status: activeAgentId === 'policy' ? 'Analyzing' : 'Active',
      currentTask: 'Verifying coverage limit & active window',
      activeClaimId: 'CLM-2026-01842',
      confidence: 99,
      claimsProcessed: 1284,
      icon: ShieldCheck,
    },
    {
      id: 'fraud',
      name: 'Fraud Agent',
      status: activeAgentId === 'fraud' ? 'Analyzing' : 'Active',
      currentTask: 'Running VIN check & photo EXIF validation',
      activeClaimId: 'CLM-2026-01903',
      confidence: 92,
      claimsProcessed: 1102,
      icon: ShieldAlert,
    },
    {
      id: 'estimation',
      name: 'Estimation Agent',
      status: activeAgentId === 'estimation' ? 'Analyzing' : 'Active',
      currentTask: 'OEM parts catalog benchmarking',
      activeClaimId: 'CLM-2026-01842',
      confidence: 93,
      claimsProcessed: 980,
      icon: Calculator,
    },
    {
      id: 'decision',
      name: 'Decision Agent',
      status: activeAgentId === 'decision' ? 'Analyzing' : 'Active',
      currentTask: 'Auto-settlement threshold validation',
      activeClaimId: 'CLM-2026-01842',
      confidence: 94,
      claimsProcessed: 1284,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep flex items-center gap-2">
            <span>Specialized AI Agent Monitor</span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success border border-semantic-success/30">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
              7 Active
            </span>
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time agent telemetry, active workloads, and composite accuracy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActivelyWorking = activeAgentId === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => onAgentClick?.(agent.id)}
              className={`rounded-xl p-3.5 border transition-all duration-300 relative cursor-pointer group flex flex-col justify-between ${
                isActivelyWorking
                  ? 'bg-peach-light/40 border-peach-primary shadow-glow-peach ring-2 ring-peach-primary/30'
                  : 'bg-ivory-warm/70 border-plum-soft/80 hover:border-plum-secondary/50 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActivelyWorking
                        ? 'bg-peach-primary text-plum-deep'
                        : 'bg-plum-soft text-plum-deep'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isActivelyWorking
                        ? 'bg-peach-primary text-plum-deep animate-pulse'
                        : 'bg-semantic-successBg text-semantic-success'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {isActivelyWorking ? 'ANALYZING' : 'Active'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-plum-deep truncate">{agent.name}</h4>
                <p className="text-[11px] text-ink-secondary mt-1 line-clamp-2 leading-relaxed h-8">
                  {agent.currentTask}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-plum-light flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-ink-muted text-[10px] block">Confidence</span>
                  <span className="font-bold text-plum-deep font-mono">{agent.confidence}%</span>
                </div>
                <div className="text-right">
                  <span className="text-ink-muted text-[10px] block">Processed</span>
                  <span className="font-semibold text-ink-secondary font-mono">
                    {agent.claimsProcessed}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
