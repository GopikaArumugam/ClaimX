import React, { useState } from 'react';
import { Claim } from '../../types/claims';
import { claimsService } from '../../services/claimsService';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { Modal } from '../common/Modal';
import {
  ShieldAlert,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Eye,
  Send,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface HumanReviewViewProps {
  claim: Claim;
  onAdjudicated: (claimId: string) => void;
}

export const HumanReviewView: React.FC<HumanReviewViewProps> = ({ claim, onAdjudicated }) => {
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestedItems, setRequestedItems] = useState<string[]>([
    'Original repair invoice with workshop tax seal',
    'Clear daylight photograph of front bumper & subframe',
  ]);
  const [requestMessage, setRequestMessage] = useState(
    'Please upload an original garage repair invoice showing complete part chassis match and clear daylight images of the subframe.'
  );

  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState<number>(claim.estimatedAmount || 142000);
  const [decisionNotes, setDecisionNotes] = useState(
    'Claims Assessor reviewed chassis discrepancy. Verified authorized garage estimate adjustment.'
  );

  const handleApprove = () => {
    claimsService.adjudicateClaim(
      claim.claimId,
      'Approve',
      decisionNotes,
      overrideActive ? overrideAmount : undefined
    );
    onAdjudicated(claim.claimId);
  };

  const handleReject = () => {
    claimsService.adjudicateClaim(
      claim.claimId,
      'Reject',
      decisionNotes || 'Rejected due to critical fraud anomaly and chassis mismatch.'
    );
    onAdjudicated(claim.claimId);
  };

  const handleSendInfoRequest = () => {
    claimsService.requestCustomerInfo(claim.claimId, requestedItems, requestMessage);
    setShowRequestInfoModal(false);
    onAdjudicated(claim.claimId);
  };

  const availableRequestItems = [
    'Additional accident photographs (Clear daylight)',
    'Original repair invoice with workshop tax seal',
    'Police FIR / Incident GD Entry',
    'Vehicle Registration Certificate original scan',
    'Forensic garage mechanic statement',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-plum-deep text-white rounded-2xl p-6 border border-plum-secondary shadow-modal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-semantic-danger text-white text-[10px] font-extrabold uppercase tracking-wider">
              Assessor Adjudication Cockpit
            </span>
            <span className="text-plum-soft text-xs font-mono">{claim.claimId}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">
            Senior Claims Assessor Review Workspace
          </h1>
          <p className="text-xs text-plum-soft/80 mt-1">
            High-risk anomalies flagged by AI Fraud & Vision Agents. Review evidence and adjudicate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge risk="High" score={claim.fraudRisk} />
          <StatusBadge status={claim.status} />
        </div>
      </div>

      {/* 3-Column Assessor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: LEFT — Claim & Customer Snapshot (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-3 pb-2 border-b border-plum-light">
              Claim & Insured Snapshot
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Policyholder</span>
                <span className="font-bold text-plum-deep text-sm">{claim.customer.name}</span>
                <p className="text-ink-secondary text-[11px]">{claim.customer.phone}</p>
                <p className="text-ink-secondary text-[11px]">{claim.customer.email}</p>
              </div>

              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Policy Details</span>
                <span className="font-bold font-mono text-plum-deep">{claim.policyNumber}</span>
                <p className="text-ink-secondary text-[11px]">{claim.policyCoverage}</p>
                <p className="text-ink-secondary text-[11px]">Limit: ₹{claim.policyLimit.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Vehicle Details</span>
                <span className="font-bold text-plum-deep">{claim.vehicleModel}</span>
                <p className="font-mono text-ink-secondary text-[11px]">{claim.vehicleNumber}</p>
              </div>

              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Financial Breakdown</span>
                <div className="mt-1 space-y-1 bg-ivory-warm p-2.5 rounded-xl border border-plum-soft">
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Claimed:</span>
                    <span className="font-mono font-bold text-plum-deep">
                      ₹{claim.claimedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">AI Baseline:</span>
                    <span className="font-mono font-bold text-peach-primary">
                      ₹{claim.estimatedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-semantic-danger font-semibold">
                    <span>Variance:</span>
                    <span className="font-mono">+₹{(claim.claimedAmount - claim.estimatedAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block mb-1">
                  Incident Stated
                </span>
                <p className="text-[11px] text-ink-primary bg-ivory-warm p-2.5 rounded-xl border border-plum-soft leading-relaxed">
                  {claim.incidentDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: CENTER — Evidence & Damage Inspection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-3 pb-2 border-b border-plum-light">
              Forensic Evidence & Photos
            </h3>

            {/* Photo damage inspection */}
            <div className="space-y-3">
              {claim.accidentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-xl border border-plum-soft overflow-hidden bg-plum-deep"
                >
                  <div className="p-2.5 bg-plum-deep border-b border-plum-secondary flex items-center justify-between text-xs text-white">
                    <span className="font-bold">{photo.angle}</span>
                    <span className="text-[11px] text-semantic-danger font-mono font-bold">
                      ⚠ Aged Rust Detected ({photo.visionConfidence}% conf)
                    </span>
                  </div>
                  <div className="aspect-video bg-black/50 flex items-center justify-center p-2">
                    {photo.url && (
                      <img
                        src={photo.url}
                        alt={photo.angle}
                        className="max-h-full rounded object-contain"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mismatch Anomaly Card */}
            <div className="mt-4 p-3.5 rounded-xl bg-semantic-dangerBg border border-semantic-danger/40 text-xs">
              <h4 className="font-bold text-semantic-danger flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Forensic Anomaly: Chassis VIN Mismatch</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                <div className="bg-white p-2 rounded border border-semantic-danger/20">
                  <span className="text-[10px] text-ink-muted block">Official RC:</span>
                  <span className="font-bold text-plum-deep">WBA5R1C55PFP12948</span>
                </div>
                <div className="bg-white p-2 rounded border border-semantic-danger/20">
                  <span className="text-[10px] text-ink-muted block">Garage Quote:</span>
                  <span className="font-bold text-semantic-danger">WBA5R1C55PFP12984</span>
                </div>
              </div>
              <p className="text-[11px] text-ink-secondary mt-2">
                Digits 48 vs 84 transposed. Garage may be billing repairs against a different donor chassis.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT — AI Findings & Assessor Adjudication Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Findings Summary */}
          <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-3 pb-2 border-b border-plum-light">
              AI Risk Findings & Evidence
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-semantic-successBg/60 border border-semantic-success/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-semantic-success flex-shrink-0" />
                <span className="text-plum-deep font-semibold">Policy valid & active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-semantic-dangerBg border border-semantic-danger/40 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" />
                <span className="text-semantic-danger font-semibold">
                  Damage/Invoice mismatch (+51.4% cost inflation)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-semantic-dangerBg border border-semantic-danger/40 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" />
                <span className="text-semantic-danger font-semibold">
                  Unusual claim frequency (3rd claim in 11 months)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-semantic-warningBg border border-semantic-warning/40 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-semantic-warning flex-shrink-0 mt-0.5" />
                <span className="text-plum-deep font-semibold">
                  EXIF photo timestamp predates reported collision by 4 days
                </span>
              </div>
            </div>
          </div>

          {/* Assessor Decision Actions */}
          <div className="bg-plum-deep text-white rounded-2xl p-5 border border-plum-secondary shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-plum-secondary">
              <h3 className="text-xs font-bold uppercase tracking-wider text-peach-primary flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Assessor Adjudication</span>
              </h3>
              <span className="text-[10px] text-plum-soft">OFC-481</span>
            </div>

            {/* Override AI toggle */}
            <div className="p-3 rounded-xl bg-plum-secondary/70 border border-plum-soft/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Override AI Recommendation</span>
                <input
                  type="checkbox"
                  checked={overrideActive}
                  onChange={(e) => setOverrideActive(e.target.checked)}
                  className="w-4 h-4 accent-peach-primary cursor-pointer"
                />
              </div>

              {overrideActive && (
                <div className="pt-2 border-t border-plum-soft/20">
                  <label className="text-[11px] text-plum-soft block mb-1">
                    Adjusted Settlement Amount (₹):
                  </label>
                  <input
                    type="number"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs rounded bg-plum-deep border border-plum-soft text-white font-mono font-bold"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] text-plum-soft uppercase font-bold block mb-1">
                Adjudication Justification Note
              </label>
              <textarea
                rows={2}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-plum-secondary/90 border border-plum-soft/30 text-white placeholder-plum-soft/50 focus:outline-none focus:border-peach-primary leading-relaxed"
                placeholder="Enter mandatory audit rationale..."
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleApprove}
                className="w-full py-2.5 rounded-xl bg-semantic-success hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-soft flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Claim {overrideActive ? `(Adjusted ₹${overrideAmount.toLocaleString('en-IN')})` : ''}</span>
              </button>

              <button
                onClick={() => setShowRequestInfoModal(true)}
                className="w-full py-2.5 rounded-xl bg-plum-secondary hover:bg-plum-hover text-white border border-plum-soft/40 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-peach-primary" />
                <span>Request Additional Information</span>
              </button>

              <button
                onClick={handleReject}
                className="w-full py-2.5 rounded-xl bg-semantic-danger hover:bg-red-700 text-white font-bold text-xs transition-all shadow-soft flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Claim (Fraud / Discrepancy)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request More Information Modal */}
      <Modal
        isOpen={showRequestInfoModal}
        onClose={() => setShowRequestInfoModal(false)}
        title="Request Additional Evidence from Policyholder"
        subtitle={`Claim ${claim.claimId} • ${claim.customer.name}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-ink-primary">
          <div>
            <label className="font-bold text-plum-deep block mb-2">
              Select Required Evidentiary Items:
            </label>
            <div className="space-y-2">
              {availableRequestItems.map((item) => {
                const isChecked = requestedItems.includes(item);
                return (
                  <label
                    key={item}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-ivory-warm border border-plum-soft hover:bg-plum-soft/20 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setRequestedItems(requestedItems.filter((i) => i !== item));
                        } else {
                          setRequestedItems([...requestedItems, item]);
                        }
                      }}
                      className="w-4 h-4 accent-peach-primary"
                    />
                    <span className="text-plum-deep font-medium">{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-plum-deep block mb-1">
              Instructions to Customer:
            </label>
            <textarea
              rows={3}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary focus:outline-none focus:border-peach-primary leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-peach-light/40 border border-peach-primary/30 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-plum-deep flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-ink-secondary">
              Sending this request will transition the claim status to{' '}
              <strong className="text-plum-deep font-semibold">Awaiting Customer</strong> and
              notify policyholder {claim.customer.name} via SMS and mobile portal.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRequestInfoModal(false)}
              className="px-4 py-2 rounded-xl border border-plum-soft text-ink-secondary hover:text-plum-deep font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInfoRequest}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-plum-deep text-white font-bold hover:bg-plum-secondary transition-all"
            >
              <Send className="w-3.5 h-3.5 text-peach-primary" />
              <span>Send Request to Customer</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
