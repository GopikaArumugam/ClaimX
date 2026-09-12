import React, { useState } from 'react';
import { Claim } from '../../types/claims';
import { claimsService } from '../../services/claimsService';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  CheckCircle2,
  Building,
  ShieldCheck,
  Download,
  ArrowRight,
  Sparkles,
  Receipt,
  FileCheck,
} from 'lucide-react';

interface PaymentSettlementViewProps {
  claim: Claim;
  onPaymentCompleted?: (claimId: string) => void;
  onBackToClaims?: () => void;
}

export const PaymentSettlementView: React.FC<PaymentSettlementViewProps> = ({
  claim,
  onPaymentCompleted,
  onBackToClaims,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(claim.status === 'PAID');
  const [settlementInfo, setSettlementInfo] = useState(claim.settlement);

  const approvedAmount = claim.approvedAmount || (claim.estimatedAmount - claim.deductible);

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Realistic API network simulation
    setTimeout(() => {
      const updated = claimsService.processPayment(claim.claimId);
      setIsProcessing(false);
      setIsSuccess(true);
      setSettlementInfo(updated?.settlement);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#0A231C', '#143D32', '#DCFCE7', '#34D399'],
      });

      onPaymentCompleted?.(claim.claimId);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-plum-deep text-white rounded-2xl p-6 border border-plum-secondary shadow-modal flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-peach-primary text-plum-deep text-[11px] font-extrabold uppercase">
              Financial Disbursement
            </span>
            <span className="font-mono text-plum-soft text-xs">{claim.claimId}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-sans">
            Direct Settlement & Electronic Payout
          </h1>
          <p className="text-xs text-plum-soft/80 mt-0.5">
            Instant automated disbursement via RBI NEFT / RTGS banking gateway
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-peach-primary text-plum-deep flex items-center justify-center shadow-glow-peach flex-shrink-0">
          <CreditCard className="w-6 h-6" />
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
        {!isSuccess ? (
          <div className="space-y-6">
            <div className="border-b border-plum-light pb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                Settlement Authorization Summary
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                Review verified banking coordinates and deductible calculation
              </p>
            </div>

            {/* Calculations */}
            <div className="p-4 rounded-xl bg-ivory-warm border border-plum-soft space-y-2.5 text-xs">
              <div className="flex justify-between text-ink-secondary">
                <span>Total Claimed Amount:</span>
                <span className="font-mono font-semibold">₹{claim.claimedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>AI Approved Repair Baseline:</span>
                <span className="font-mono font-semibold text-plum-deep">
                  ₹{claim.estimatedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-semantic-danger font-medium">
                <span>Compulsory Policy Deductible:</span>
                <span className="font-mono font-bold">- ₹{claim.deductible.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2.5 border-t border-plum-light flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-plum-deep">Net Payout Authorized:</span>
                <span className="text-2xl font-extrabold font-mono text-semantic-success">
                  ₹{approvedAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payee Bank Account Details */}
            <div className="p-4 rounded-xl border border-plum-soft bg-white space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                Verified Payee Bank Coordinates
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-muted text-[10px] block">Account Holder</span>
                  <span className="font-bold text-plum-deep">{claim.customer.name}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Disbursement Method</span>
                  <span className="font-semibold text-plum-deep flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-peach-primary" />
                    Direct Bank Transfer (NEFT/RTGS)
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Bank & Account</span>
                  <span className="font-mono font-bold text-plum-deep">HDFC Bank •••• 4832</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">IFSC Verification</span>
                  <span className="font-mono font-semibold text-semantic-success flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    HDFC0001042 (Verified)
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-peach-primary hover:bg-peach-hover text-plum-deep font-extrabold text-sm shadow-glow-peach transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-plum-deep border-t-transparent rounded-full animate-spin" />
                  <span>Processing Settlement with Banking Gateway...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Disburse ₹{approvedAmount.toLocaleString('en-IN')} to Policyholder</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Payment Success Confirmation */
          <div className="text-center py-6 space-y-5 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-semantic-successBg text-semantic-success mx-auto flex items-center justify-center border-2 border-semantic-success/40 shadow-soft">
              <CheckCircle2 className="w-8 h-8 animate-bounce-subtle" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-semantic-success">
                Settlement Completed Successfully
              </span>
              <h2 className="text-3xl font-extrabold font-mono text-plum-deep mt-1">
                ₹{approvedAmount.toLocaleString('en-IN')}
              </h2>
              <p className="text-xs text-ink-secondary mt-1">
                Transferred to {claim.customer.name} (HDFC Bank •••• 4832)
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-ivory-warm border border-plum-soft text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Transaction ID:</span>
                <span className="font-bold text-plum-deep">
                  {settlementInfo?.transactionId || 'TXN-827364'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Gateway Ref:</span>
                <span className="font-bold text-plum-deep">RBI-NEFT-99182410</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Processed At:</span>
                <span className="text-ink-secondary">
                  {settlementInfo?.processedAt || new Date().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-semantic-success font-bold pt-1 border-t border-plum-light">
                <span>Status:</span>
                <span>SETTLED & DISBURSED</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => alert(`Receipt downloaded for ${claim.claimId} (TXN: ${settlementInfo?.transactionId || 'TXN-827364'})`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-plum-soft hover:bg-ivory-warm text-plum-deep font-semibold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Settlement Receipt</span>
              </button>
              {onBackToClaims && (
                <button
                  onClick={onBackToClaims}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-plum-deep text-white font-bold text-xs hover:bg-plum-secondary transition-colors"
                >
                  <span>Return to Claims Registry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
