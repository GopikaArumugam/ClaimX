import React, { useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userRole: 'officer' | 'customer';
  onOpenNewClaim: () => void;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  searchQuery,
  onSearchChange,
  userRole,
  onOpenNewClaim,
  onLogout,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-plum-soft/80 px-4 md:px-6 flex items-center justify-between z-20 shadow-soft">
        {/* Search Bar */}
        <div className="relative w-64 lg:w-80 hidden sm:block">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search claims by ID, customer, or policy..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft/80 text-ink-primary placeholder-ink-muted focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary transition-all"
          />
        </div>

        {/* Center/Right Section: Active Role Badge & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 ml-auto sm:ml-0">
          {/* Active Session Role Indicator (Locked to Authenticated Session) */}
          <div className="flex items-center px-3 sm:px-3.5 py-1.5 rounded-xl bg-ivory-warm border border-plum-soft text-xs font-bold shadow-soft">
            {userRole === 'officer' ? (
              <div className="flex items-center gap-1.5 text-plum-deep">
                <span className="w-2 h-2 rounded-full bg-peach-primary animate-pulse" />
                <ShieldCheck className="w-3.5 h-3.5 text-peach-primary" />
                <span className="hidden sm:inline">Claims Officer Cockpit</span>
                <span className="sm:hidden">Officer</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-plum-deep text-white ml-1">L3</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-plum-deep">
                <span className="w-2 h-2 rounded-full bg-peach-primary animate-pulse" />
                <User className="w-3.5 h-3.5 text-peach-primary" />
                <span className="hidden sm:inline">Policyholder Portal</span>
                <span className="sm:hidden">Customer</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-peach-primary text-plum-deep font-extrabold ml-1">VERIFIED</span>
              </div>
            )}
          </div>

          {/* Quick Submit Claim CTA */}
          <button
            onClick={onOpenNewClaim}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-peach-primary text-plum-deep font-bold text-xs hover:bg-peach-hover shadow-glow-peach transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{userRole === 'customer' ? 'File Claim' : 'New Claim'}</span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm transition-colors"
            title="System Architecture Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-peach-primary animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-peach-primary" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-modal border border-plum-soft p-4 z-50 animate-slide-up">
                <div className="flex items-center justify-between pb-3 border-b border-plum-light">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                    Live System Feed
                  </h4>
                  <span className="text-[10px] text-semantic-success font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                    Streaming
                  </span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-ivory-warm border border-plum-soft/40">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-plum-deep">Decision Agent</span>
                      <span className="text-[10px] text-ink-muted">Just now</span>
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Auto-approved claim CLM-2026-01842 (₹43,000).
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-peach-light/40 border border-peach-primary/30">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-plum-deep">Vision Agent</span>
                      <span className="text-[10px] text-ink-muted">2m ago</span>
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Low confidence (31%) on CLM-01775. Customer prompt dispatched.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-semantic-dangerBg border border-semantic-danger/20">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-semantic-danger">Fraud Agent</span>
                      <span className="text-[10px] text-ink-muted">5m ago</span>
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Escalated CLM-01903 (Risk 87/100: VIN Mismatch) to Assessor Cockpit.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-plum-soft/80" />

          {/* User Profile - Dynamic to Role */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                userRole === 'officer'
                  ? 'bg-plum-secondary text-white border-plum-soft'
                  : 'bg-peach-primary text-plum-deep border-peach-hover shadow-glow-peach'
              }`}
            >
              {userRole === 'officer' ? 'AO' : 'AK'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-plum-deep leading-tight">
                {userRole === 'officer' ? 'Anand Officer' : 'Arun Kumar'}
              </p>
              <p className="text-[10px] text-ink-secondary">
                {userRole === 'officer' ? 'Sr. Claims Assessor' : 'Insured Policyholder'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-ink-muted hover:text-semantic-danger hover:bg-semantic-dangerBg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Help Modal explaining the 7 dynamic agents */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="AI Claims Orchestration Architecture"
        subtitle="AI that knows when to act, when to ask, and when to escalate."
        maxWidth="4xl"
      >
        <div className="space-y-6 text-sm text-ink-primary">
          <div className="p-4 rounded-xl bg-plum-deep text-white">
            <h4 className="font-bold text-peach-primary text-base mb-1">
              Dynamic Multi-Agent Coordination Engine
            </h4>
            <p className="text-xs text-plum-soft leading-relaxed">
              Unlike traditional rigid, hard-coded insurance workflows, this platform dynamically
              evaluates available evidence at every phase. The central Claim Orchestrator plans,
              schedules, retries, pauses for customer clarification, or prunes downstream agents
              to deliver instant and confidence-aware resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm">
              <span className="font-bold text-plum-deep block mb-1">1. Claim Orchestrator (Brain)</span>
              <p className="text-ink-secondary">
                Directs the workflow graph dynamically. Analyzes missing data, schedules specialized agents,
                prompts policyholders when uncertain, and fast-routes decisions.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm">
              <span className="font-bold text-plum-deep block mb-1">2. Document Agent</span>
              <p className="text-ink-secondary">
                Extracts and verifies entities from Policy Schedules, Driver Licenses, RC books, repair
                invoices, and police FIRs with OCR confidence scoring.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm">
              <span className="font-bold text-plum-deep block mb-1">3. Vision Agent</span>
              <p className="text-ink-secondary">
                Computer vision damage segmentation. Detects severity (Severe/Moderate/Minor) on bumpers,
                panels, headlamps. Halts with low confidence on blurred photos rather than hallucinating!
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm">
              <span className="font-bold text-plum-deep block mb-1">4. Policy Agent</span>
              <p className="text-ink-secondary">
                Verifies policy validity windows, IDV coverage limits, and deductible clauses. Triggers
                instant branch optimization if coverage is expired.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm">
              <span className="font-bold text-plum-deep block mb-1">5. Fraud Agent</span>
              <p className="text-ink-secondary">
                Evaluates duplicate claims, VIN integrity, EXIF timestamps, GPS coordinates, and cost inflation.
                Escalates to human assessor when risk exceeds threshold.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm">
              <span className="font-bold text-plum-deep block mb-1">6. Estimation Agent</span>
              <p className="text-ink-secondary">
                Calculates OEM parts and labor costs against regional baselines, checking workshop variance
                against actual physical damage severity.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm md:col-span-2">
              <span className="font-bold text-plum-deep block mb-1">7. Decision Agent</span>
              <p className="text-ink-secondary">
                Applies strict safety guardrails. Issues instant Auto-Approval for high-confidence claims
                or escalates suspicious/uncertain claims to the Claims Assessor cockpit.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-peach-light/50 border border-peach-primary/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-plum-deep flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-plum-deep block">Try Demo Scenarios</span>
              <p className="text-ink-secondary mt-0.5">
                Use the top Demo Controller to experience all 4 scenarios in real-time, including the
                uncertain photo loop and the dynamic pruning of expired policies.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
