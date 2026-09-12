import React, { useState, useEffect } from 'react';
import { Claim, AgentId, AgentStatus } from '../../types/claims';
import { orchestratorService, WorkflowStepState } from '../../services/orchestratorService';
import { claimsService } from '../../services/claimsService';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceMeter } from '../common/ConfidenceMeter';
import { Modal } from '../common/Modal';
import {
  Brain,
  FileCheck,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Calculator,
  CheckCircle,
  Play,
  RotateCcw,
  Upload,
  AlertTriangle,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

interface LiveOrchestratorViewProps {
  claim: Claim;
  onNavigateToClaim: (claimId: string) => void;
  onNavigateToHumanReview?: (claimId: string) => void;
}

export const LiveOrchestratorView: React.FC<LiveOrchestratorViewProps> = ({
  claim,
  onNavigateToClaim,
  onNavigateToHumanReview,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepState, setCurrentStepState] = useState<WorkflowStepState | null>(null);
  const [showCustomerUploadModal, setShowCustomerUploadModal] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentId | null>('orchestrator');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1400);

  // Agent Node definitions for the canvas
  const agentNodes: {
    id: AgentId;
    name: string;
    icon: any;
    x: number; // percentage in SVG/canvas
    y: number;
    description: string;
  }[] = [
    { id: 'document', name: 'Document Agent', icon: FileCheck, x: 18, y: 22, description: 'OCR & entity parsing' },
    { id: 'vision', name: 'Vision Agent', icon: Eye, x: 50, y: 12, description: 'Damage segmentation' },
    { id: 'policy', name: 'Policy Agent', icon: ShieldCheck, x: 82, y: 22, description: 'Coverage limits & rules' },
    { id: 'fraud', name: 'Fraud Agent', icon: ShieldAlert, x: 85, y: 72, description: 'Anomaly & metadata checks' },
    { id: 'estimation', name: 'Estimation Agent', icon: Calculator, x: 50, y: 88, description: 'Parts & labor pricing' },
    { id: 'decision', name: 'Decision Agent', icon: CheckCircle, x: 15, y: 72, description: 'Auto-settle or escalate' },
  ];

  const handleRunSimple = async () => {
    setIsRunning(true);
    await orchestratorService.runSimpleClaim(claim.claimId, (state) => {
      setCurrentStepState(state);
    }, simulationSpeed);
    setIsRunning(false);
  };

  const handleRunUncertain = async () => {
    setIsRunning(true);
    await orchestratorService.runUncertainClaim(claim.claimId, (state) => {
      setCurrentStepState(state);
    }, simulationSpeed);
    setIsRunning(false);
  };

  const handleCustomerUploadClarification = async () => {
    setShowCustomerUploadModal(false);
    setIsRunning(true);
    await orchestratorService.resumeUncertainClaimWithNewImage(claim.claimId, (state) => {
      setCurrentStepState(state);
    }, simulationSpeed);
    setIsRunning(false);
  };

  const handleRunFraud = async () => {
    setIsRunning(true);
    await orchestratorService.runFraudClaim(claim.claimId, (state) => {
      setCurrentStepState(state);
    }, simulationSpeed);
    setIsRunning(false);
  };

  const handleRunExpired = async () => {
    setIsRunning(true);
    await orchestratorService.runExpiredPolicyWorkflow(claim.claimId, (state) => {
      setCurrentStepState(state);
    }, simulationSpeed);
    setIsRunning(false);
  };

  const getAgentStatus = (id: AgentId): AgentStatus => {
    if (currentStepState?.activeAgents.includes(id)) return 'PROCESSING';
    return claim.agentResults[id]?.status || 'IDLE';
  };

  const activeAgentResult = selectedAgentDetail ? claim.agentResults[selectedAgentDetail] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-plum-deep text-white rounded-2xl p-6 shadow-modal border border-plum-secondary relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-peach-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-peach-primary/20 text-peach-primary border border-peach-primary/30 text-[11px] font-extrabold uppercase tracking-wider">
                Claim {claim.claimId}
              </span>
              <span className="text-plum-soft/60 text-xs">•</span>
              <span className="text-xs text-plum-soft font-semibold">{claim.claimType}</span>
              <span className="text-plum-soft/60 text-xs">•</span>
              <span className="text-xs text-plum-soft font-mono font-bold">
                ₹{claim.claimedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-3">
              <span>Live AI Orchestration Engine</span>
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-peach-primary text-plum-deep shadow-glow-peach">
                <span className="w-2 h-2 rounded-full bg-plum-deep animate-ping" />
                Adaptive Workflow
              </span>
            </h1>
            <p className="text-xs text-plum-soft/80 mt-1 max-w-2xl">
              Dynamically reasoning over evidence, selecting specialized agents, managing confidence,
              and asking or escalating when appropriate.
            </p>
          </div>

          {/* Workflow Simulation Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-plum-secondary/80 p-1 rounded-xl border border-plum-soft/20 flex items-center gap-1 text-xs">
              <span className="text-[11px] text-plum-soft px-2 font-medium">Speed:</span>
              <button
                onClick={() => setSimulationSpeed(1800)}
                className={`px-2 py-1 rounded-lg ${
                  simulationSpeed === 1800 ? 'bg-peach-primary text-plum-deep font-bold' : 'text-plum-soft hover:text-white'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setSimulationSpeed(1000)}
                className={`px-2 py-1 rounded-lg ${
                  simulationSpeed === 1000 ? 'bg-peach-primary text-plum-deep font-bold' : 'text-plum-soft hover:text-white'
                }`}
              >
                2x
              </button>
            </div>

            <button
              onClick={handleRunSimple}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-peach-primary text-plum-deep font-bold text-xs hover:bg-peach-hover shadow-glow-peach transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Simple</span>
            </button>

            <button
              onClick={handleRunUncertain}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-plum-secondary hover:bg-plum-hover text-white border border-plum-soft/30 text-xs font-semibold transition-all disabled:opacity-50"
              title="Triggers Vision 31% Low-Confidence loop"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-semantic-warning" />
              <span>Uncertain Loop</span>
            </button>

            <button
              onClick={handleRunFraud}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-plum-secondary hover:bg-plum-hover text-white border border-plum-soft/30 text-xs font-semibold transition-all disabled:opacity-50"
              title="Triggers Fraud 87/100 escalation"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-semantic-danger" />
              <span>Fraud Case</span>
            </button>

            <button
              onClick={handleRunExpired}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-plum-secondary hover:bg-plum-hover text-white border border-plum-soft/30 text-xs font-semibold transition-all disabled:opacity-50"
              title="Prunes Vision & Estimation"
            >
              <Zap className="w-3.5 h-3.5 text-peach-primary" />
              <span>Dynamic Routing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Routing Notification if Optimized */}
      {claim.orchestratorNotes?.isOptimized && (
        <div className="p-4 rounded-2xl bg-plum-deep text-white border-2 border-peach-primary shadow-glow-peach flex items-start gap-3.5 animate-slide-up">
          <div className="p-2 rounded-xl bg-peach-primary text-plum-deep font-bold flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-peach-primary">
                Workflow Optimized by Claim Orchestrator
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-peach-primary/20 text-peach-primary">
                Pruned Downstream Compute
              </span>
            </div>
            <p className="text-xs text-plum-soft mt-1 leading-relaxed">
              {claim.orchestratorNotes.optimizationReason ||
                'Vision, Fraud, and Estimation stages skipped because policy eligibility failed at baseline. Instant evidence-backed adjudication delivered.'}
            </p>
          </div>
        </div>
      )}

      {/* Low-Confidence Customer Upload Banner if in Awaiting Customer State */}
      {claim.status === 'AWAITING_CUSTOMER' && (
        <div className="p-4 rounded-2xl bg-semantic-warningBg border-2 border-semantic-warning text-plum-deep shadow-soft flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-semantic-warning text-plum-deep flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-plum-deep flex items-center gap-2">
                <span>AI Confidence Too Low (31%) — Action Required</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-semantic-warning/40">
                  Refusing to Hallucinate
                </span>
              </h4>
              <p className="text-xs text-ink-secondary mt-0.5">
                The Vision Agent cannot confidently segment damaged components due to dark underexposure.
                The Orchestrator requested a clear daylight photo from customer {claim.customer.name}.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCustomerUploadModal(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-plum-deep hover:bg-plum-secondary text-white font-bold text-xs shadow-soft transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4 text-peach-primary" />
            <span>Upload Clearer Photo (Simulate Customer)</span>
          </button>
        </div>
      )}

      {/* Escalated to Human Review Banner */}
      {claim.status === 'HUMAN_REVIEW' && (
        <div className="p-4 rounded-2xl bg-semantic-dangerBg border-2 border-semantic-danger text-plum-deep shadow-soft flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-semantic-danger text-white flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-semantic-danger flex items-center gap-2">
                <span>Escalated to Human Assessor Review</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-semantic-danger/40">
                  Fraud Score: {claim.fraudRisk}/100
                </span>
              </h4>
              <p className="text-xs text-ink-secondary mt-0.5">
                Chassis VIN mismatch and 51.4% repair estimate inflation exceeded automated safety guardrails.
              </p>
            </div>
          </div>

          {onNavigateToHumanReview && (
            <button
              onClick={() => onNavigateToHumanReview(claim.claimId)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-semantic-danger hover:bg-red-700 text-white font-bold text-xs shadow-soft transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Open Assessor Cockpit</span>
            </button>
          )}
        </div>
      )}

      {/* Main Orchestration Canvas and Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Central Orchestration Network Canvas (7 cols on XL) */}
        <div className="xl:col-span-7 bg-plum-deep rounded-2xl p-6 border border-plum-secondary shadow-modal relative min-h-[520px] flex flex-col justify-between overflow-hidden">
          {/* Subtle background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#542653_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Canvas Title */}
          <div className="flex items-center justify-between relative z-10 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-peach-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-plum-soft">
                Dynamic Coordination Graph
              </span>
            </div>
            <span className="text-[11px] text-peach-primary/80 font-mono">
              Status: {currentStepState?.statusText || 'Idle / Ready'}
            </span>
          </div>

          {/* Visual SVG Connecting lines between Orchestrator and Agents */}
          <div className="relative w-full h-[400px] flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {agentNodes.map((agent) => {
                const isActive =
                  currentStepState?.activeAgents.includes(agent.id) ||
                  claim.currentAgent === agent.id;
                const isCompleted =
                  claim.agentResults[agent.id]?.status === 'COMPLETED' ||
                  currentStepState?.completedAgents.includes(agent.id);
                const isSkipped = claim.agentResults[agent.id]?.status === 'SKIPPED';
                const isLowConf = claim.agentResults[agent.id]?.status === 'LOW_CONFIDENCE';
                const isEscalated = claim.agentResults[agent.id]?.status === 'ESCALATED';

                let strokeColor = '#542653';
                let strokeWidth = 1.5;
                let strokeDash = 'none';

                if (isActive) {
                  strokeColor = '#F08A7E';
                  strokeWidth = 3;
                } else if (isEscalated) {
                  strokeColor = '#C94B58';
                  strokeWidth = 2.5;
                } else if (isLowConf) {
                  strokeColor = '#D99A3D';
                  strokeWidth = 2.5;
                } else if (isCompleted) {
                  strokeColor = '#26966F';
                  strokeWidth = 2;
                } else if (isSkipped) {
                  strokeColor = '#542653';
                  strokeDash = '4 4';
                }

                return (
                  <g key={`line-${agent.id}`}>
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${agent.x}%`}
                      y2={`${agent.y}%`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      className={isActive ? 'animate-pulse' : ''}
                    />
                    {isActive && (
                      <circle r="4" fill="#F08A7E" className="animate-ping">
                        <animateMotion
                          path={`M 500,250 L ${agent.x * 10},${agent.y * 5}`}
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Central Claim Orchestrator Hub */}
            <div
              onClick={() => setSelectedAgentDetail('orchestrator')}
              className={`absolute z-20 w-36 h-36 rounded-full flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-300 shadow-modal ${
                selectedAgentDetail === 'orchestrator'
                  ? 'ring-4 ring-peach-primary bg-plum-secondary scale-105'
                  : 'bg-plum-secondary/90 hover:bg-plum-secondary border-2 border-plum-soft/40'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-peach-primary text-plum-deep flex items-center justify-center shadow-glow-peach mb-1">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-tight text-white leading-tight">
                Claim Orchestrator
              </span>
              <span className="text-[9px] text-peach-primary font-semibold mt-0.5">
                Central Brain
              </span>
            </div>

            {/* Orbiting Specialized Agents */}
            {agentNodes.map((agent) => {
              const Icon = agent.icon;
              const result = claim.agentResults[agent.id];
              const status = getAgentStatus(agent.id);
              const isSelected = selectedAgentDetail === agent.id;
              const isActive = status === 'PROCESSING';
              const isCompleted = status === 'COMPLETED';
              const isLowConf = status === 'LOW_CONFIDENCE';
              const isEscalated = status === 'ESCALATED';
              const isSkipped = status === 'SKIPPED';

              let nodeBg = 'bg-plum-secondary/90 border-plum-soft/40 text-white';
              let badgeColor = 'bg-plum-soft/20 text-plum-soft';

              if (isActive) {
                nodeBg = 'bg-peach-primary text-plum-deep border-peach-primary shadow-glow-peach scale-110 ring-4 ring-peach-primary/30';
                badgeColor = 'bg-plum-deep text-peach-primary';
              } else if (isEscalated) {
                nodeBg = 'bg-semantic-danger text-white border-red-400 shadow-modal';
                badgeColor = 'bg-white text-semantic-danger';
              } else if (isLowConf) {
                nodeBg = 'bg-semantic-warning text-plum-deep border-amber-400 shadow-soft';
                badgeColor = 'bg-plum-deep text-semantic-warning';
              } else if (isCompleted) {
                nodeBg = 'bg-semantic-success text-white border-green-400 shadow-soft';
                badgeColor = 'bg-plum-deep text-semantic-success';
              } else if (isSkipped) {
                nodeBg = 'bg-plum-secondary/40 border-dashed border-plum-soft/30 text-plum-soft/60';
                badgeColor = 'bg-plum-deep/40 text-plum-soft/60';
              }

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentDetail(agent.id)}
                  style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-white scale-105' : ''
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${nodeBg}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold truncate max-w-[90px] md:max-w-[120px]">
                          {agent.name}
                        </span>
                        {result && result.confidence > 0 && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1 rounded ${badgeColor}`}
                          >
                            {result.confidence}%
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] block opacity-80 truncate max-w-[100px]">
                        {isSkipped ? 'Skipped' : status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Live Status Ticker */}
          <div className="relative z-10 p-3 rounded-xl bg-plum-secondary/60 border border-plum-soft/20 flex items-center justify-between text-xs text-plum-soft">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-peach-primary" />
              <span>
                {currentStepState?.reasoning ||
                  claim.orchestratorNotes?.highLevelReasoning ||
                  'Orchestrator standing by. Choose a scenario above to test adaptive intelligence.'}
              </span>
            </div>
            <button
              onClick={() => onNavigateToClaim(claim.claimId)}
              className="text-[11px] font-bold text-peach-primary hover:underline flex items-center gap-1 flex-shrink-0"
            >
              Full Workspace <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Orchestrator Reasoning & Agent Telemetry Panel (5 cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Orchestrator High-Level Decision Card */}
          <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-plum-light mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-plum-soft text-plum-deep">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                    Claim Orchestrator Telemetry
                  </h3>
                  <span className="text-[10px] text-ink-muted">Transparent Agent Reasoning</span>
                </div>
              </div>
              <StatusBadge status={claim.status} size="sm" />
            </div>

            {/* High Level Reasoning */}
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                Reasoning Summary
              </span>
              <div className="p-3 rounded-xl bg-ivory-warm border border-plum-soft/80 text-xs text-ink-primary leading-relaxed">
                {claim.orchestratorNotes?.highLevelReasoning ||
                  'Claim submitted. Evaluating required agent dispatch sequence.'}
              </div>
            </div>

            {/* Available Evidence */}
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block mb-1.5">
                Ingested Evidence
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {(
                  claim.orchestratorNotes?.availableEvidence || [
                    'Policy Document',
                    'Driver License',
                    'Accident Photos',
                  ]
                ).map((ev, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-semantic-successBg/60 border border-semantic-success/30 text-[11px] font-medium text-plum-deep flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success flex-shrink-0" />
                    <span className="truncate">{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Action & Next Action */}
            <div className="p-3 rounded-xl bg-peach-light/40 border border-peach-primary/30">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-plum-deep block mb-0.5">
                Current Operational Action
              </span>
              <p className="text-xs font-bold text-plum-deep">
                {claim.orchestratorNotes?.currentAction || 'Awaiting Orchestration Trigger'}
              </p>
              <p className="text-[11px] text-ink-secondary mt-1">
                <span className="font-semibold text-plum-deep">Reason: </span>
                {claim.orchestratorNotes?.reasonForAction ||
                  'System dynamic scheduler evaluates rules and certainty.'}
              </p>
            </div>
          </div>

          {/* Selected Agent Inspector Card */}
          {activeAgentResult && (
            <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-plum-light mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                    Agent Inspector: {activeAgentResult.name}
                  </h4>
                  <span className="text-[10px] text-ink-muted">Specialized Agent Findings</span>
                </div>
                <StatusBadge status={activeAgentResult.status} size="sm" />
              </div>

              {/* Confidence Meter */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-ink-secondary">Agent Confidence</span>
                  <span className="font-mono font-bold text-plum-deep">
                    {activeAgentResult.confidence}%
                  </span>
                </div>
                <ConfidenceMeter confidence={activeAgentResult.confidence} showLabel={false} />
              </div>

              {/* Agent Finding Text */}
              <p className="text-xs text-ink-primary bg-ivory-warm p-3 rounded-xl border border-plum-soft/80 mb-3 leading-relaxed">
                {activeAgentResult.summary}
              </p>

              {/* Evidence list */}
              {activeAgentResult.evidence && activeAgentResult.evidence.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Agent Evidence Points
                  </span>
                  <ul className="space-y-1 text-xs">
                    {activeAgentResult.evidence.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-ink-primary">
                        <span className="text-peach-primary font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Action if low confidence or escalated */}
              {activeAgentResult.requiredAction && (
                <div className="mt-3 p-2.5 rounded-xl bg-semantic-warningBg border border-semantic-warning/40 text-xs">
                  <span className="font-bold text-semantic-warning block mb-0.5">
                    Required Action:
                  </span>
                  <p className="text-plum-deep">{activeAgentResult.requiredAction}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customer Upload Modal for the Low-Confidence Scenario */}
      <Modal
        isOpen={showCustomerUploadModal}
        onClose={() => setShowCustomerUploadModal(false)}
        title="Simulate Policyholder Evidence Upload"
        subtitle="Policyholder Vikramaditya Rao responds to Vision Agent request"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-ink-primary">
          <div className="p-3 rounded-xl bg-peach-light/40 border border-peach-primary/30">
            <span className="font-bold text-plum-deep block mb-1">
              Vision Agent Request:
            </span>
            <p className="text-ink-secondary">
              "Original image was underexposed and motion blurred in the basement. Please upload a clear
              daylight photo of the front bumper."
            </p>
          </div>

          <div className="border-2 border-dashed border-peach-primary rounded-xl p-6 text-center bg-ivory-warm flex flex-col items-center justify-center">
            <Upload className="w-8 h-8 text-peach-primary mb-2 animate-bounce-subtle" />
            <span className="font-bold text-plum-deep text-sm">
              Clear_Daylight_Front_Bumper.jpg
            </span>
            <span className="text-ink-secondary text-xs mt-0.5">
              High resolution (3840x2160) • 4.2 MB • Excellent lighting
            </span>
            <div className="mt-3 px-3 py-1 rounded-md bg-semantic-successBg text-semantic-success font-semibold text-[11px] border border-semantic-success/30">
              ✓ Pre-flight Quality Verified: 94% clarity score
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCustomerUploadModal(false)}
              className="px-4 py-2 rounded-xl border border-plum-soft text-ink-secondary hover:text-plum-deep font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomerUploadClarification}
              className="px-5 py-2 rounded-xl bg-peach-primary text-plum-deep font-bold hover:bg-peach-hover shadow-glow-peach transition-all"
            >
              Submit Clear Image & Resume AI Assessment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
