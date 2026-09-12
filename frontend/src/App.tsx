import React, { useState, useEffect } from 'react';
import { Claim, ClaimStatus, AgentId } from './types';
import { claimsService, orchestratorService } from './services';
import { Sidebar, Topbar, NavigationTab } from './components/layout';
import { KpiCard, ToastContainer } from './components/ui';
import { PipelineFunnel, AgentMonitor, ClaimsTable, LiveActivityFeed } from './features/command-center';
import { LiveOrchestratorView } from './features/live-orchestrator';
import { NewClaimWizard } from './features/claim-intake';
import { ClaimDetailsView } from './features/claim-details';
import { HumanReviewView } from './features/human-review';
import { PaymentSettlementView } from './features/settlement';
import { CustomerPortalDashboard, CustomerTrackingView } from './features/customer-portal';
import { AnalyticsView, AiPerformanceView } from './features/analytics';
import { SplitLoginView } from './features/auth';
import {
  FileText,
  Cpu,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  RotateCcw,
  Sliders,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('command-center');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('CLM-2026-01842');
  const [viewingClaimDetails, setViewingClaimDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<'officer' | 'customer'>('officer');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [activeDemoScenario, setActiveDemoScenario] = useState<string | null>(null);

  // Settings state
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(100000);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [fraudEscalationThreshold, setFraudEscalationThreshold] = useState(40);

  useEffect(() => {
    return claimsService.subscribe((updatedClaims) => {
      setClaims(updatedClaims);
    });
  }, []);

  const activeClaim = claims.find((c) => c.claimId === selectedClaimId) || claims[0];
  const pendingReviewClaims = claims.filter((c) => c.status === 'HUMAN_REVIEW');

  // Navigation helpers
  const handleOpenClaimDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
    setViewingClaimDetails(true);
    setCurrentTab('claims');
  };

  const handleOpenLiveOrchestration = (claimId: string) => {
    setSelectedClaimId(claimId);
    setViewingClaimDetails(false);
    setCurrentTab('live-orchestration');
  };

  const handleOpenHumanReview = (claimId: string) => {
    setSelectedClaimId(claimId);
    setViewingClaimDetails(false);
    setCurrentTab('human-review');
  };

  const handleOpenPayment = (claimId: string) => {
    setSelectedClaimId(claimId);
    setViewingClaimDetails(false);
    setCurrentTab('payments');
  };

  // Demo Scenarios Execution
  const handleRunDemoSimple = async () => {
    setActiveDemoScenario('simple');
    setSelectedClaimId('CLM-2026-01842');
    setViewingClaimDetails(false);
    setCurrentTab('live-orchestration');
    await orchestratorService.runSimpleClaim('CLM-2026-01842');
  };

  const handleRunDemoUncertain = async () => {
    setActiveDemoScenario('uncertain');
    setSelectedClaimId('CLM-2026-01775');
    setViewingClaimDetails(false);
    setCurrentTab('live-orchestration');
    await orchestratorService.runUncertainClaim('CLM-2026-01775');
  };

  const handleRunDemoFraud = async () => {
    setActiveDemoScenario('fraud');
    setSelectedClaimId('CLM-2026-01903');
    setViewingClaimDetails(false);
    setCurrentTab('live-orchestration');
    await orchestratorService.runFraudClaim('CLM-2026-01903');
  };

  const handleRunDemoExpired = async () => {
    setActiveDemoScenario('expired');
    setSelectedClaimId('CLM-2026-01640');
    setViewingClaimDetails(false);
    setCurrentTab('live-orchestration');
    await orchestratorService.runExpiredPolicyWorkflow('CLM-2026-01640');
  };

  const handleResetDefaults = () => {
    claimsService.resetToDefaults();
    setActiveDemoScenario(null);
    setSelectedClaimId('CLM-2026-01842');
  };

  // If not logged in, render Split Screen Login
  if (!isLoggedIn) {
    return (
      <SplitLoginView
        onLoginSuccess={(role?: 'officer' | 'customer') => {
          setIsLoggedIn(true);
          if (role) setUserRole(role);
          if (role === 'customer') {
            setCurrentTab('customer-portal');
          } else {
            setCurrentTab('command-center');
          }
        }}
      />
    );
  }

  // All activities across claims for feed
  const allActivities = claims
    .flatMap((c) => c.activityFeed || [])
    .sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="flex h-screen w-full bg-ivory-warm text-ink-primary overflow-hidden font-sans">
      <ToastContainer />

      {/* Persistent Desktop / Tablet Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setViewingClaimDetails(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingReviewCount={pendingReviewClaims.length}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userRole={userRole}
          onOpenNewClaim={() => {
            setCurrentTab('new-claim');
            setViewingClaimDetails(false);
          }}
          onLogout={() => setIsLoggedIn(false)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* SCREEN 2: CLAIMS COMMAND CENTER */}
          {currentTab === 'command-center' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans">
                    Good morning, Claims Team
                  </h1>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Real-time overview of intelligent claims processing and adaptive AI coordination.
                  </p>
                </div>
              </div>

              {/* 5 KPI Cards with Animated Counters */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <KpiCard
                  title="Total Claims"
                  value={1284}
                  trend="+12.4%"
                  subtext="vs last month"
                  icon={FileText}
                  accent="plum"
                />
                <KpiCard
                  title="AI Processed"
                  value={1041}
                  badgeText="81.1%"
                  trend="+8.2%"
                  subtext="autonomous rate"
                  icon={Cpu}
                  accent="peach"
                />
                <KpiCard
                  title="Auto Approved"
                  value={742}
                  badgeText="71.3%"
                  trend="+15.0%"
                  subtext="instant settlements"
                  icon={CheckCircle2}
                  accent="success"
                />
                <KpiCard
                  title="Human Review"
                  value={119}
                  badgeText="11.4%"
                  trend="-4.1%"
                  subtext="escalated cases"
                  icon={UserCheck}
                  accent="warning"
                />
                <KpiCard
                  title="Potential Fraud"
                  value={43}
                  badgeText="4.1%"
                  trend="Screened"
                  subtext="anomalies blocked"
                  icon={ShieldAlert}
                  accent="danger"
                />
              </div>

              {/* Live Claim Pipeline */}
              <PipelineFunnel
                activeStageFilter={stageFilter}
                onSelectStage={setStageFilter}
              />

              {/* Specialized AI Agent Monitor */}
              <AgentMonitor
                activeAgentId={activeClaim?.currentAgent}
                onAgentClick={() => {
                  setCurrentTab('live-orchestration');
                }}
              />

              {/* Split row: Active Claims Table (8 cols) & Live Feed (4 cols) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <ClaimsTable
                    claims={claims}
                    stageFilter={stageFilter}
                    onViewClaim={handleOpenClaimDetails}
                    onLiveOrchestration={handleOpenLiveOrchestration}
                    onHumanReview={handleOpenHumanReview}
                  />
                </div>
                <div className="xl:col-span-4">
                  <LiveActivityFeed
                    events={allActivities}
                    onSelectClaim={(id: string) => handleOpenClaimDetails(id)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: LIVE AI ORCHESTRATION (THE WOW SCREEN) */}
          {currentTab === 'live-orchestration' && (
            <div className="max-w-7xl mx-auto">
              <LiveOrchestratorView
                claim={activeClaim}
                onNavigateToClaim={handleOpenClaimDetails}
                onNavigateToHumanReview={handleOpenHumanReview}
              />
            </div>
          )}

          {/* SCREEN 3: NEW CLAIM SUBMISSION */}
          {currentTab === 'new-claim' && (
            <NewClaimWizard
              onClaimSubmitted={(newClaimId: string) => {
                setSelectedClaimId(newClaimId);
                if (userRole === 'customer') {
                  setCurrentTab('customer-portal');
                } else {
                  setCurrentTab('live-orchestration');
                }
              }}
              onCancel={() => {
                if (userRole === 'customer') {
                  setCurrentTab('customer-portal');
                } else {
                  setCurrentTab('command-center');
                }
              }}
            />
          )}

          {/* SCREEN 5: CLAIM DETAILS WORKSPACE */}
          {currentTab === 'claims' && (
            <div className="max-w-7xl mx-auto">
              {viewingClaimDetails ? (
                <div>
                  <button
                    onClick={() => setViewingClaimDetails(false)}
                    className="mb-4 text-xs font-semibold text-plum-deep hover:text-peach-primary transition-colors flex items-center gap-1"
                  >
                    ← Back to Claims Registry
                  </button>
                  <ClaimDetailsView
                    claim={activeClaim}
                    onLiveOrchestration={handleOpenLiveOrchestration}
                    onHumanReview={handleOpenHumanReview}
                    onProcessPayment={handleOpenPayment}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-bold text-plum-deep">Claims Registry</h1>
                      <p className="text-xs text-ink-secondary">
                        Comprehensive ledger of all active, reviewed, and paid insurance claims
                      </p>
                    </div>
                  </div>
                  <ClaimsTable
                    claims={claims}
                    stageFilter={null}
                    onViewClaim={handleOpenClaimDetails}
                    onLiveOrchestration={handleOpenLiveOrchestration}
                    onHumanReview={handleOpenHumanReview}
                  />
                </div>
              )}
            </div>
          )}

          {/* SCREEN 6: HUMAN REVIEW WORKSPACE */}
          {currentTab === 'human-review' && (
            <div className="max-w-7xl mx-auto">
              {pendingReviewClaims.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-plum-soft shadow-soft">
                  <CheckCircle2 className="w-12 h-12 text-semantic-success mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-plum-deep">Assessor Queue Clear</h2>
                  <p className="text-xs text-ink-secondary mt-1">
                    No claims currently require human review. High-risk fraud claims will appear here.
                  </p>
                </div>
              ) : (
                <HumanReviewView
                  claim={
                    claims.find(
                      (c) => c.claimId === selectedClaimId && c.status === 'HUMAN_REVIEW'
                    ) || pendingReviewClaims[0]
                  }
                  onAdjudicated={() => {
                    setCurrentTab('command-center');
                  }}
                />
              )}
            </div>
          )}

          {/* SCREEN 7: PAYMENTS & SETTLEMENT */}
          {currentTab === 'payments' && (
            <PaymentSettlementView
              claim={
                claims.find(
                  (c) =>
                    c.claimId === selectedClaimId && ['APPROVED', 'PAID'].includes(c.status)
                ) ||
                claims.find((c) => c.status === 'APPROVED') ||
                activeClaim
              }
              onBackToClaims={() => setCurrentTab('claims')}
            />
          )}

          {/* SCREEN 8: CUSTOMER PORTAL */}
          {currentTab === 'customer-portal' && (
            <CustomerPortalDashboard
              claims={claims}
              onSelectClaimForTracking={(id: string) => {
                setSelectedClaimId(id);
              }}
              onClaimSubmitted={(newClaimId: string) => {
                setSelectedClaimId(newClaimId);
              }}
            />
          )}

          {/* SCREEN 9: ANALYTICS */}
          {currentTab === 'analytics' && <AnalyticsView />}

          {/* SCREEN 10: AI PERFORMANCE */}
          {currentTab === 'ai-performance' && <AiPerformanceView />}

          {/* FRAUD INTELLIGENCE VIEW */}
          {currentTab === 'fraud-intel' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
                <span className="text-[11px] font-bold uppercase tracking-wider text-semantic-danger">
                  Risk & Forensic Intelligence
                </span>
                <h1 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans mt-0.5">
                  Fraud Radar & Discrepancy Monitoring
                </h1>
                <p className="text-xs text-ink-secondary mt-1">
                  Active monitoring of vehicle VIN transpositions, quote inflation, and geo-temporal EXIF anomalies
                </p>
              </div>

              <ClaimsTable
                claims={claims.filter((c) => c.risk === 'High' || c.fraudRisk > 40)}
                stageFilter={null}
                onViewClaim={handleOpenClaimDetails}
                onLiveOrchestration={handleOpenLiveOrchestration}
                onHumanReview={handleOpenHumanReview}
              />
            </div>
          )}

          {/* SETTINGS VIEW */}
          {currentTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
                <h1 className="text-xl font-bold text-plum-deep">System Parameters & Guardrails</h1>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Configure autonomous decision boundaries and human escalation thresholds
                </p>
              </div>

              {/* Standard Enterprise Theme Display (Locked to Slate Emerald & Fresh Mint) */}
              <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-plum-light">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-peach-primary/20 text-peach-primary flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-plum-deep" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
                        Standard Enterprise Theme
                      </h2>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        Slate Emerald & Fresh Mint — Hardcoded Enterprise Security Palette
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-peach-light text-plum-deep font-bold text-xs border border-peach-primary/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-peach-primary animate-pulse" />
                    System Locked
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-ivory-warm border border-plum-soft/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-extrabold text-xs text-plum-deep">
                      Slate Emerald & Fresh Mint Design System
                    </span>
                    <p className="text-[11px] text-ink-secondary">
                      Optimized for insurance claims processing, financial trust signals, and high contrast data density.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-plum-soft">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-[#0A231C] border border-black/10 shadow-xs" title="Forest Slate Deep (#0A231C)" />
                      <span className="w-6 h-6 rounded-lg bg-[#143D32] border border-black/10 shadow-xs" title="Deep Evergreen (#143D32)" />
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] border border-black/10 shadow-xs" title="Fresh Mint AI Accent (#10B981)" />
                      <span className="w-6 h-6 rounded-lg bg-[#DCFCE7] border border-black/10 shadow-xs" title="Soft Mint Border (#DCFCE7)" />
                      <span className="w-6 h-6 rounded-lg bg-[#F6FAF8] border border-gray-300 shadow-xs" title="Pearl Mint Canvas (#F6FAF8)" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft space-y-6 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-plum-deep">
                      Maximum Auto-Approval Payout Limit
                    </label>
                    <span className="font-mono font-bold text-peach-primary text-sm">
                      ₹{autoApprovalLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25000"
                    max="250000"
                    step="5000"
                    value={autoApprovalLimit}
                    onChange={(e) => setAutoApprovalLimit(Number(e.target.value))}
                    className="w-full accent-peach-primary"
                  />
                  <span className="text-[11px] text-ink-secondary">
                    Claims exceeding this threshold automatically route to human review regardless of confidence.
                  </span>
                </div>

                <div className="pt-4 border-t border-plum-light">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-plum-deep">
                      Minimum AI Confidence Threshold for Auto-Approve
                    </label>
                    <span className="font-mono font-bold text-semantic-success text-sm">
                      {confidenceThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-semantic-success"
                  />
                  <span className="text-[11px] text-ink-secondary">
                    Any agent scoring below this threshold pauses for customer clarification or escalates.
                  </span>
                </div>

                <div className="pt-4 border-t border-plum-light">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-plum-deep">
                      Fraud Score Escalation Trigger
                    </label>
                    <span className="font-mono font-bold text-semantic-danger text-sm">
                      {fraudEscalationThreshold} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={fraudEscalationThreshold}
                    onChange={(e) => setFraudEscalationThreshold(Number(e.target.value))}
                    className="w-full accent-semantic-danger"
                  />
                  <span className="text-[11px] text-ink-secondary">
                    Claims with fraud score equal to or higher than this value trigger mandatory assessor review.
                  </span>
                </div>

                <div className="pt-4 border-t border-plum-light flex justify-between items-center">
                  <div>
                    <span className="font-bold text-plum-deep block">Reset All Demo Claims</span>
                    <span className="text-[11px] text-ink-secondary">
                      Restore default initial claims, states, and demonstration activity logs
                    </span>
                  </div>
                  <button
                    onClick={handleResetDefaults}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-plum-soft hover:bg-plum-soft/40 text-plum-deep font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
