import { Claim, ClaimStatus, AgentId, ActivityEvent } from '../types/claims';
import { INITIAL_CLAIMS } from './mockData';
import { notificationService } from './notificationService';

type ClaimsListener = (claims: Claim[]) => void;

class ClaimsService {
  private claims: Claim[] = [];
  private listeners: Set<ClaimsListener> = new Set();

  constructor() {
    this.loadInitial();
  }

  private loadInitial() {
    const saved = localStorage.getItem('ai_claims_store');
    if (saved) {
      try {
        this.claims = JSON.parse(saved);
        return;
      } catch (e) {
        console.error('Failed to parse saved claims, reverting to defaults', e);
      }
    }
    this.claims = [...INITIAL_CLAIMS];
  }

  private save() {
    localStorage.setItem('ai_claims_store', JSON.stringify(this.claims));
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.claims]));
  }

  subscribe(listener: ClaimsListener) {
    this.listeners.add(listener);
    listener(this.claims);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getClaims(): Claim[] {
    return [...this.claims];
  }

  getClaimById(id: string): Claim | undefined {
    return this.claims.find((c) => c.claimId === id);
  }

  createClaim(newClaim: Claim): Claim {
    this.claims = [newClaim, ...this.claims];
    this.save();
    notificationService.add(
      'New Claim Submitted',
      `Claim ${newClaim.claimId} submitted for ${newClaim.customer.name}`,
      'info',
      newClaim.claimId
    );
    return newClaim;
  }

  updateClaim(id: string, updates: Partial<Claim>): Claim | undefined {
    const index = this.claims.findIndex((c) => c.claimId === id);
    if (index === -1) return undefined;

    const updated = {
      ...this.claims[index],
      ...updates,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.claims[index] = updated;
    this.save();
    return updated;
  }

  addActivity(claimId: string, event: Omit<ActivityEvent, 'id' | 'timestamp'>) {
    const claim = this.getClaimById(claimId);
    if (!claim) return;

    const newActivity: ActivityEvent = {
      ...event,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      claimId,
    };

    const updatedActivities = [newActivity, ...(claim.activityFeed || [])];
    this.updateClaim(claimId, { activityFeed: updatedActivities });
  }

  processPayment(claimId: string): Claim | undefined {
    const claim = this.getClaimById(claimId);
    if (!claim) return undefined;

    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const payout = claim.approvedAmount || (claim.estimatedAmount - claim.deductible);

    const settlement = {
      claimedAmount: claim.claimedAmount,
      approvedAmount: claim.approvedAmount || claim.estimatedAmount,
      deductible: claim.deductible,
      payoutAmount: payout,
      paymentMethod: 'Direct Bank Transfer (NEFT/RTGS)',
      bankAccount: 'HDFC Bank •••• 4832',
      transactionId: txnId,
      paymentStatus: 'Completed' as const,
      processedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updated = this.updateClaim(claimId, {
      status: 'PAID',
      settlement,
    });

    this.addActivity(claimId, {
      action: `Settlement payment of ₹${payout.toLocaleString('en-IN')} disbursed. Transaction ID: ${txnId}.`,
      type: 'success',
      amount: payout,
    });

    notificationService.add(
      'Payment Disbursed',
      `₹${payout.toLocaleString('en-IN')} settled for ${claim.claimId} (TXN: ${txnId})`,
      'success',
      claimId
    );

    return updated;
  }

  requestCustomerInfo(claimId: string, items: string[], message: string): Claim | undefined {
    const claim = this.getClaimById(claimId);
    if (!claim) return undefined;

    const updated = this.updateClaim(claimId, {
      status: 'AWAITING_CUSTOMER',
      orchestratorNotes: {
        ...(claim.orchestratorNotes || {
          highLevelReasoning: 'Customer additional evidence required.',
          availableEvidence: [],
          requiredValidation: [],
        }),
        currentAction: 'Awaiting Customer Response',
        reasonForAction: message,
      },
    });

    this.addActivity(claimId, {
      agentId: 'orchestrator',
      agentName: 'Claim Orchestrator',
      action: `Action Required: Requested additional evidence (${items.join(', ')}). Message: "${message}"`,
      type: 'alert',
    });

    notificationService.add(
      'Information Requested',
      `Request sent to policyholder ${claim.customer.name}`,
      'warning',
      claimId
    );

    return updated;
  }

  adjudicateClaim(
    claimId: string,
    decision: 'Approve' | 'Reject',
    notes: string,
    overrideAmount?: number
  ): Claim | undefined {
    const claim = this.getClaimById(claimId);
    if (!claim) return undefined;

    const isApproved = decision === 'Approve';
    const finalAmount = overrideAmount !== undefined ? overrideAmount : (claim.approvedAmount || claim.estimatedAmount);

    const updated = this.updateClaim(claimId, {
      status: isApproved ? 'APPROVED' : 'REJECTED',
      approvedAmount: isApproved ? finalAmount : 0,
      humanReviewNotes: {
        flaggedBy: claim.humanReviewNotes?.flaggedBy || 'AI Guardrail',
        flagReason: claim.humanReviewNotes?.flagReason || 'Manual Review',
        reviewedBy: 'Claims Officer (Assessor ID: OFC-481)',
        decision: isApproved ? 'Approved' : 'Rejected',
        decisionNotes: notes,
        overridden: true,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      },
    });

    this.addActivity(claimId, {
      action: `Claims Officer ${decision}d claim with note: "${notes}". Final settlement amount: ₹${finalAmount.toLocaleString('en-IN')}.`,
      type: isApproved ? 'decision' : 'alert',
      amount: finalAmount,
    });

    notificationService.add(
      `Claim ${decision}d`,
      `Claims Officer decision logged for ${claimId}`,
      isApproved ? 'success' : 'error',
      claimId
    );

    return updated;
  }

  resetToDefaults() {
    localStorage.removeItem('ai_claims_store');
    this.claims = [...INITIAL_CLAIMS];
    this.save();
    notificationService.add('System Reset', 'Claims reset to default enterprise demonstration set', 'info');
  }
}

export const claimsService = new ClaimsService();
