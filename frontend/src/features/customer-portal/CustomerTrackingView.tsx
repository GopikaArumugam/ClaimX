import React, { useState } from 'react';
import { Claim } from '../../types/claims';
import { orchestratorService } from '@/services';
import { Modal } from '@/components/ui';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  CreditCard,
  FileCheck,
  Eye,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CustomerTrackingViewProps {
  claim: Claim;
  onViewOrchestrator?: (claimId: string) => void;
}

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  claim,
  onViewOrchestrator,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const steps = [
    { id: 'submitted', title: 'Claim Submitted', desc: 'Received & cataloged', done: true, icon: FileCheck },
    {
      id: 'docs',
      title: 'Documents Verified',
      desc: 'Policy & RC OCR parsed',
      done: ['PROCESSING', 'ASSESSING', 'HUMAN_REVIEW', 'APPROVED', 'PAID'].includes(claim.status) || claim.agentResults.document?.status === 'COMPLETED',
      icon: FileCheck,
    },
    {
      id: 'damage',
      title: 'Damage Assessed',
      desc: 'Vision computer scan',
      done: ['APPROVED', 'PAID'].includes(claim.status) || claim.agentResults.vision?.status === 'COMPLETED',
      current: claim.status === 'AWAITING_CUSTOMER',
      icon: Eye,
    },
    {
      id: 'fraud',
      title: 'Fraud & Rules Screened',
      desc: 'Regulatory checks',
      done: ['APPROVED', 'PAID'].includes(claim.status) || claim.agentResults.fraud?.status === 'COMPLETED',
      icon: ShieldCheck,
    },
    {
      id: 'decision',
      title: 'Claim Adjudicated',
      desc: claim.status === 'REJECTED' ? 'Claim Rejected' : 'Approved for payout',
      done: ['APPROVED', 'PAID'].includes(claim.status),
      failed: claim.status === 'REJECTED',
      icon: CheckCircle2,
    },
    {
      id: 'payment',
      title: 'Payment Disbursed',
      desc: claim.status === 'PAID' ? 'Transferred to bank' : 'Pending final release',
      done: claim.status === 'PAID',
      icon: CreditCard,
    },
  ];

  const handleUploadClarification = async () => {
    setIsUploading(true);
    await orchestratorService.resumeUncertainClaimWithNewImage(claim.claimId);
    setIsUploading(false);
    setShowUploadModal(false);
  };

  const payoutAmount = claim.approvedAmount || (claim.estimatedAmount - claim.deductible);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Customer Header */}
      <div className="bg-plum-deep text-white rounded-2xl p-6 border border-plum-secondary shadow-modal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-peach-primary">
            Customer Self-Service Portal
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans mt-0.5">
            My Claim Status: {claim.claimId}
          </h1>
          <p className="text-xs text-plum-soft/80 mt-1">
            {claim.claimType} • Vehicle: {claim.vehicleModel} ({claim.vehicleNumber})
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold uppercase text-plum-soft block">
            Approved Settlement
          </span>
          <span className="text-2xl font-extrabold font-mono text-white">
            ₹{payoutAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Action Required Banner if Awaiting Customer */}
      {claim.status === 'AWAITING_CUSTOMER' && (
        <div className="p-5 rounded-2xl bg-semantic-warningBg border-2 border-semantic-warning text-plum-deep shadow-card animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-semantic-warning text-plum-deep flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-plum-deep uppercase tracking-wider">
                Action Required: Please Provide Clearer Damage Photograph
              </h3>
              <p className="text-xs text-ink-primary mt-1 max-w-xl leading-relaxed">
                Our AI Vision Agent noticed that the uploaded photograph was taken in low light and
                was blurry. To guarantee an accurate repair estimate without delay, please upload a clear
                daylight photo.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-plum-deep hover:bg-plum-secondary text-white font-bold text-xs shadow-soft transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-peach-primary" />
            <span>Upload Photo Now</span>
          </button>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-6 pb-2 border-b border-plum-light">
          Real-Time Claim Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  s.done
                    ? 'bg-semantic-successBg/40 border-semantic-success/30 text-plum-deep'
                    : s.current
                    ? 'bg-semantic-warningBg border-semantic-warning/50 text-plum-deep ring-2 ring-semantic-warning/40'
                    : s.failed
                    ? 'bg-semantic-dangerBg border-semantic-danger/40 text-semantic-danger'
                    : 'bg-ivory-warm/60 border-plum-soft text-ink-muted'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        s.done
                          ? 'bg-semantic-success text-white'
                          : s.current
                          ? 'bg-semantic-warning text-plum-deep'
                          : s.failed
                          ? 'bg-semantic-danger text-white'
                          : 'bg-plum-soft text-ink-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold">
                      {s.done ? '✓ Done' : s.current ? 'Action Req' : s.failed ? 'Declined' : `0${idx + 1}`}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs leading-tight mb-1">{s.title}</h4>
                  <p className="text-[11px] text-ink-secondary leading-snug">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement & Banking Information Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft text-xs space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-plum-deep text-[11px]">
            Financial Settlement Breakdown
          </h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-ink-secondary">
              <span>Claimed by You:</span>
              <span className="font-mono font-bold text-plum-deep">
                ₹{claim.claimedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span>Verified Repair Value:</span>
              <span className="font-mono font-bold text-plum-deep">
                ₹{claim.estimatedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-semantic-danger">
              <span>Standard Policy Deductible:</span>
              <span className="font-mono font-bold">- ₹{claim.deductible.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-plum-light flex justify-between font-extrabold text-sm text-semantic-success">
              <span>Final Settlement Payout:</span>
              <span className="font-mono">₹{payoutAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft text-xs space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-plum-deep text-[11px]">
            Designated Bank Account
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-peach-primary" />
              <span className="font-bold text-plum-deep">HDFC Bank Ltd</span>
            </div>
            <p className="text-ink-secondary font-mono">Account: •••• 4832</p>
            <div className="p-2 rounded-lg bg-ivory-warm border border-plum-soft text-[11px] flex items-center justify-between">
              <span className="text-ink-secondary">Payment Method:</span>
              <span className="font-semibold text-plum-deep">Instant NEFT / RTGS</span>
            </div>
            {claim.status === 'PAID' && (
              <span className="inline-block px-2.5 py-1 rounded-md bg-semantic-successBg text-semantic-success font-bold font-mono text-[11px]">
                Paid: TXN-827364
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Customer Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Clear Daylight Photograph"
        subtitle="Policyholder response for Claim CLM-2026-01775"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-ink-primary">
          <p className="text-ink-secondary leading-relaxed">
            Please select a clear, well-lit photograph of the damaged front bumper. Our Vision Agent
            will inspect the clarity score and resume your claim automatically.
          </p>

          <div className="border-2 border-dashed border-peach-primary rounded-xl p-6 text-center bg-peach-light/20 flex flex-col items-center justify-center">
            <Upload className="w-8 h-8 text-peach-primary mb-2 animate-bounce-subtle" />
            <span className="font-bold text-plum-deep text-sm">
              Clear_Daylight_Bumper.jpg
            </span>
            <span className="text-ink-secondary text-[11px] mt-0.5">
              Ready to transmit • 3840x2160 • High dynamic range
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 rounded-xl border border-plum-soft text-ink-secondary hover:text-plum-deep font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadClarification}
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-peach-primary text-plum-deep font-bold hover:bg-peach-hover shadow-glow-peach transition-all"
            >
              {isUploading ? 'Verifying & Re-analyzing...' : 'Submit Photo & Continue Claim'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
