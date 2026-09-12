import React, { useState } from 'react';
import { Claim, ClaimDocument, AccidentPhoto } from '../../types/claims';
import { StatusBadge } from '../common/StatusBadge';
import { CustomerTrackingView } from './CustomerTrackingView';
import { NewClaimWizard } from '../new-claim/NewClaimWizard';
import { PaymentSettlementView } from '../settlement/PaymentSettlementView';
import { Modal } from '../common/Modal';
import {
  FileText,
  PlusCircle,
  Clock,
  CreditCard,
  ShieldCheck,
  Building,
  AlertTriangle,
  CheckCircle2,
  Car,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Download,
  User,
  Sparkles,
  Zap,
} from 'lucide-react';

interface CustomerPortalDashboardProps {
  claims: Claim[];
  onSelectClaimForTracking: (claimId: string) => void;
  onClaimSubmitted: (claimId: string) => void;
}

export const CustomerPortalDashboard: React.FC<CustomerPortalDashboardProps> = ({
  claims,
  onSelectClaimForTracking,
  onClaimSubmitted,
}) => {
  const [customerTab, setCustomerTab] = useState<'my-claims' | 'track' | 'new-claim' | 'settlements' | 'policy'>('my-claims');
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.claimId || 'CLM-2026-01842');

  // Customer claims (e.g. Arun Kumar or general customer view)
  const activeClaim = claims.find((c) => c.claimId === selectedClaimId) || claims[0];
  const pendingActionClaims = claims.filter((c) => c.status === 'AWAITING_CUSTOMER');
  const settledClaims = claims.filter((c) => c.status === 'PAID');
  const inProgressClaims = claims.filter((c) => !['PAID', 'REJECTED'].includes(c.status));

  const totalDisbursed = settledClaims.reduce((acc, c) => acc + (c.settlement?.payoutAmount || c.approvedAmount || 0), 0);

  const handleTrackClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    setCustomerTab('track');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Top Banner indicating Policyholder Portal mode */}
      <div className="bg-plum-deep text-white px-5 py-3.5 rounded-2xl border border-plum-secondary shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-peach-primary text-plum-deep flex items-center justify-center font-bold text-xs shadow-glow-peach">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5 font-sans">
              POLICYHOLDER SELF-SERVICE PORTAL
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-peach-primary/20 text-peach-primary border border-peach-primary/30">
                Verified
              </span>
            </span>
            <p className="text-[11px] text-plum-soft/70">
              Personal insurance workspace for filing claims, uploading evidence, and receiving settlements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-plum-secondary border border-plum-soft/20 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-peach-primary" />
          <span className="text-[11px] text-plum-soft font-medium">Policy #POL-882910 Active</span>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-plum-soft/80 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-plum-soft text-plum-deep flex items-center justify-center font-extrabold text-lg border border-plum-secondary/20 shadow-soft flex-shrink-0">
              AK
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success border border-semantic-success/20">
                  ✓ Verified Policyholder
                </span>
                <span className="text-ink-muted text-xs">•</span>
                <span className="text-xs text-ink-secondary font-mono">ID: CUST-89104</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-plum-deep tracking-tight font-sans">
                Hello, Arun Kumar
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Active Policy: <span className="font-semibold text-plum-deep">POL-983742</span> (Comprehensive Gold) • Vehicle: <span className="font-semibold text-plum-deep">Hyundai Creta (TN 45 AB 1234)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCustomerTab('new-claim')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-peach-primary hover:bg-peach-hover text-plum-deep font-extrabold text-xs shadow-glow-peach transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>File a New Claim</span>
            </button>
          </div>
        </div>

        {/* Customer Navigation Pills */}
        <div className="mt-8 border-t border-plum-light pt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setCustomerTab('my-claims')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              customerTab === 'my-claims'
                ? 'bg-plum-deep text-white shadow-soft'
                : 'text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Claims ({claims.length})</span>
          </button>

          <button
            onClick={() => setCustomerTab('track')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              customerTab === 'track'
                ? 'bg-plum-deep text-white shadow-soft'
                : 'text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Track Claim Status</span>
            {pendingActionClaims.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-peach-primary animate-ping" />
            )}
          </button>

          <button
            onClick={() => setCustomerTab('new-claim')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              customerTab === 'new-claim'
                ? 'bg-plum-deep text-white shadow-soft'
                : 'text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>File New Claim</span>
          </button>

          <button
            onClick={() => setCustomerTab('settlements')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              customerTab === 'settlements'
                ? 'bg-plum-deep text-white shadow-soft'
                : 'text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payouts & Bank Transfers</span>
          </button>

          <button
            onClick={() => setCustomerTab('policy')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              customerTab === 'policy'
                ? 'bg-plum-deep text-white shadow-soft'
                : 'text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Policy & Coverage</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: MY CLAIMS */}
      {customerTab === 'my-claims' && (
        <div className="space-y-6">
          {/* Action Required Banner if Any Claim Needs Customer Evidence */}
          {pendingActionClaims.length > 0 && (
            <div className="p-5 rounded-2xl bg-semantic-warningBg border-2 border-semantic-warning text-plum-deep shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-semantic-warning text-plum-deep flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-plum-deep uppercase tracking-wider">
                    Action Required on Claim {pendingActionClaims[0].claimId}
                  </h3>
                  <p className="text-xs text-ink-primary mt-1">
                    The AI Vision Agent could not classify damage due to dark lighting. Please upload a clear daylight photo to resume automated processing without delay.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTrackClaim(pendingActionClaims[0].claimId)}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-plum-deep hover:bg-plum-secondary text-white font-bold text-xs shadow-soft transition-all"
              >
                Upload Photo & Respond
              </button>
            </div>
          )}

          {/* Customer Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-plum-soft/80 shadow-soft">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                Active Claims in Progress
              </span>
              <span className="text-2xl font-black text-plum-deep mt-1 block font-sans">
                {inProgressClaims.length}
              </span>
              <span className="text-[11px] text-ink-muted">Processed with adaptive AI</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-plum-soft/80 shadow-soft">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                Total Settlements Received
              </span>
              <span className="text-2xl font-black text-semantic-success mt-1 block font-mono">
                ₹{totalDisbursed.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-ink-muted">Direct NEFT to HDFC Bank</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-plum-soft/80 shadow-soft">
              <span className="text-[11px] font-bold uppercase tracking-wider text-peach-primary block">
                Average Resolution Time
              </span>
              <span className="text-2xl font-black text-plum-deep mt-1 block font-sans">
                4.2 Minutes
              </span>
              <span className="text-[11px] text-semantic-success font-semibold">
                ⚡ 5 days faster than traditional forms
              </span>
            </div>
          </div>

          {/* Claims List */}
          <div className="bg-white rounded-3xl p-6 border border-plum-soft/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-plum-light">
              <h2 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
                Your Claims History
              </h2>
              <span className="text-xs text-ink-secondary">
                Showing {claims.length} registered claims
              </span>
            </div>

            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.claimId}
                  className="p-5 rounded-2xl border border-plum-soft hover:border-peach-primary/60 hover:shadow-card bg-ivory-warm/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-plum-deep px-2.5 py-0.5 rounded-lg bg-white border border-plum-soft">
                        {claim.claimId}
                      </span>
                      <StatusBadge status={claim.status} size="sm" />
                      <span className="text-[11px] text-ink-secondary font-medium">
                        Incident Date: {claim.accidentDate}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-plum-deep">{claim.claimType}</h3>
                    <p className="text-xs text-ink-secondary line-clamp-1 max-w-xl">
                      {claim.incidentDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-plum-light">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-ink-muted block">
                        Estimated / Settlement
                      </span>
                      <span className="text-base font-extrabold font-mono text-plum-deep">
                        ₹{(claim.approvedAmount || claim.claimedAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleTrackClaim(claim.claimId)}
                      className="px-4 py-2 rounded-xl bg-plum-deep hover:bg-plum-secondary text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
                    >
                      <span>Track Status</span>
                      <ChevronRight className="w-4 h-4 text-peach-primary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: TRACK STATUS */}
      {customerTab === 'track' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCustomerTab('my-claims')}
              className="text-xs font-semibold text-plum-deep hover:text-peach-primary transition-colors flex items-center gap-1"
            >
              ← Back to My Claims
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-secondary">Select Claim:</span>
              <select
                value={selectedClaimId}
                onChange={(e) => setSelectedClaimId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-plum-soft text-plum-deep font-bold font-mono focus:outline-none focus:border-peach-primary"
              >
                {claims.map((c) => (
                  <option key={c.claimId} value={c.claimId}>
                    {c.claimId} — {c.claimType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CustomerTrackingView
            claim={activeClaim}
          />
        </div>
      )}

      {/* SUB-VIEW 3: FILE NEW CLAIM */}
      {customerTab === 'new-claim' && (
        <div className="space-y-4">
          <button
            onClick={() => setCustomerTab('my-claims')}
            className="text-xs font-semibold text-plum-deep hover:text-peach-primary transition-colors flex items-center gap-1"
          >
            ← Back to My Claims
          </button>
          <NewClaimWizard
            onClaimSubmitted={(newClaimId) => {
              setSelectedClaimId(newClaimId);
              setCustomerTab('track');
              onClaimSubmitted(newClaimId);
            }}
            onCancel={() => setCustomerTab('my-claims')}
          />
        </div>
      )}

      {/* SUB-VIEW 4: PAYMENTS & SETTLEMENTS */}
      {customerTab === 'settlements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-plum-soft/80 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-plum-deep mb-1">
              Direct Settlement History
            </h2>
            <p className="text-xs text-ink-secondary mb-4">
              All electronic funds transfers disbursed directly to your designated bank account
            </p>

            <div className="p-4 rounded-2xl bg-ivory-warm border border-plum-soft mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-peach-light text-plum-deep flex items-center justify-center font-bold">
                  <Building className="w-5 h-5 text-peach-primary" />
                </div>
                <div>
                  <span className="font-bold text-plum-deep text-sm block">
                    Designated Disbursement Account
                  </span>
                  <p className="text-ink-secondary">
                    HDFC Bank • Account ending in •••• 4832 • IFSC: HDFC0001042
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-semantic-successBg text-semantic-success font-bold text-[11px] border border-semantic-success/20">
                ✓ Active for Instant NEFT
              </span>
            </div>

            <div className="space-y-3">
              {settledClaims.length === 0 ? (
                <p className="text-xs text-ink-muted text-center py-6">
                  No claims settled yet. Once your claim is approved, payment will appear here.
                </p>
              ) : (
                settledClaims.map((c) => (
                  <div
                    key={c.claimId}
                    className="p-4 rounded-xl border border-plum-soft bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-plum-deep">{c.claimId}</span>
                        <span className="px-2 py-0.5 rounded bg-semantic-successBg text-semantic-success font-bold text-[10px]">
                          PAID & SETTLED
                        </span>
                      </div>
                      <p className="text-ink-secondary">{c.claimType} • Vehicle {c.vehicleNumber}</p>
                      <span className="text-[10px] text-ink-muted font-mono">
                        Transaction ID: {c.settlement?.transactionId || 'TXN-827364'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold font-mono text-semantic-success block">
                        ₹{(c.settlement?.payoutAmount || c.approvedAmount).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => alert(`Downloaded Official Payout Receipt for ${c.claimId}`)}
                        className="mt-1 text-[11px] font-bold text-peach-primary hover:underline flex items-center gap-1 ml-auto"
                      >
                        <Download className="w-3 h-3" />
                        <span>Receipt PDF</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: POLICY & VEHICLE */}
      {customerTab === 'policy' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-plum-soft/80 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-plum-deep mb-1">
              Active Insurance Policy Certificate
            </h2>
            <p className="text-xs text-ink-secondary mb-6">
              National Assurance Comprehensive Private Car Policy
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-5 rounded-2xl bg-ivory-warm border border-plum-soft space-y-3">
                <span className="text-[11px] font-bold uppercase text-ink-secondary block">
                  Policy Summary
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Policy Number:</span>
                    <span className="font-mono font-bold text-plum-deep">POL-983742</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Insured Declared Value (IDV):</span>
                    <span className="font-mono font-bold text-plum-deep">₹14,50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Policy Validity:</span>
                    <span className="font-bold text-plum-deep">16-Mar-2025 to 15-Mar-2027</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Compulsory Deductible:</span>
                    <span className="font-mono font-bold text-plum-deep">₹5,000</span>
                  </div>
                  <div className="flex justify-between text-semantic-success font-bold">
                    <span>Status:</span>
                    <span>ACTIVE & IN FORCE</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-ivory-warm border border-plum-soft space-y-3">
                <span className="text-[11px] font-bold uppercase text-ink-secondary block">
                  Insured Vehicle
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Vehicle Make & Model:</span>
                    <span className="font-bold text-plum-deep">Hyundai Creta SX (O) 1.5 Petrol</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Registration Number:</span>
                    <span className="font-mono font-bold text-plum-deep">TN 45 AB 1234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Chassis Number:</span>
                    <span className="font-mono text-plum-deep">MALC381CLPM19842</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Engine Number:</span>
                    <span className="font-mono text-plum-deep">G4FJPM00912</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
