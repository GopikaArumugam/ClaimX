import { Claim, ClaimStatus, AgentId, ActivityEvent } from '../types/claims';
import { INITIAL_CLAIMS } from './mockData';
import { notificationService } from './notificationService';

type ClaimsListener = (claims: Claim[]) => void;

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const TERMINAL_CLAIM_STATES: string[] = [
  'APPROVED',
  'REJECTED',
  'HUMAN_REVIEW_COMPLETED',
  'PAID',
];

export function isTerminalClaimState(status: string): boolean {
  return TERMINAL_CLAIM_STATES.includes(status);
}

class ClaimsService {
  private claims: Claim[] = [];
  private listeners: Set<ClaimsListener> = new Set();
  private authToken: string | null = null;

  constructor() {
    this.loadInitial();
    void this.syncWithBackend();
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

  private async ensureBackendToken(): Promise<string | null> {
    if (this.authToken) return this.authToken;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anand.officer@aiclaims.internal',
          password: 'password123',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        this.authToken = data.access_token || null;
        return this.authToken;
      }
    } catch {
      // Backend offline — graceful fallback to local state
    }
    return null;
  }

  async syncWithBackend(): Promise<void> {
    try {
      const token = await this.ensureBackendToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.claims) && payload.claims.length > 0) {
          // Merge backend updates into local claims store by claimId
          const byId = new Map<string, Claim>(
            this.claims.map((c) => [c.claimId, c])
          );
          for (const srvClaim of payload.claims) {
            const existing = byId.get(srvClaim.claimId);
            byId.set(
              srvClaim.claimId,
              existing ? { ...existing, ...srvClaim } : srvClaim
            );
          }
          this.claims = Array.from(byId.values());
          this.save();
        }
      }
    } catch {
      // Keep local reactive store when backend is offline
    }
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
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      claimId,
    };

    const updatedActivities = [newActivity, ...(claim.activityFeed || [])];
    this.updateClaim(claimId, { activityFeed: updatedActivities });
  }

  processPayment(claimId: string): Claim | undefined {
    const claim = this.getClaimById(claimId);
    if (!claim) return undefined;

    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const payout =
      claim.approvedAmount || claim.estimatedAmount - claim.deductible;

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

    void this.syncSettleWithBackend(claimId, txnId);
    return updated;
  }

  private async syncSettleWithBackend(claimId: string, utr: string) {
    try {
      const token = await this.ensureBackendToken();
      if (!token) return;
      await fetch(`${API_BASE_URL}/claims/${claimId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method: 'Direct Bank Transfer (NEFT/RTGS)',
          utr_reference: utr,
        }),
      });
    } catch {
      // Ignore offline errors
    }
  }

  requestCustomerInfo(
    claimId: string,
    items: string[],
    message: string
  ): Claim | undefined {
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
    const finalAmount =
      overrideAmount !== undefined
        ? overrideAmount
        : claim.approvedAmount || claim.estimatedAmount;

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

    void this.syncAdjudicateWithBackend(
      claimId,
      isApproved ? 'APPROVE' : 'REJECT',
      notes,
      overrideAmount
    );

    return updated;
  }

  private async syncAdjudicateWithBackend(
    claimId: string,
    decision: string,
    notes: string,
    overrideAmount?: number
  ) {
    try {
      const token = await this.ensureBackendToken();
      if (!token) return;
      await fetch(`${API_BASE_URL}/claims/${claimId}/adjudicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          notes,
          override_amount: overrideAmount,
        }),
      });
    } catch {
      // Ignore offline errors
    }
  }

  async fetchFinalAssessmentReport(claimId: string): Promise<any> {
    const claim = this.getClaimById(claimId);
    if (!claim) {
      throw new Error(`Claim ${claimId} not found.`);
    }
    if (!isTerminalClaimState(claim.status)) {
      throw new Error(
        `NON_TERMINAL_STATE_REPORT_BLOCKED: Final Claim Assessment Report is only generated in terminal states (APPROVED, REJECTED, HUMAN_REVIEW_COMPLETED, PAID). Current state: ${claim.status}.`
      );
    }

    try {
      const token = await this.ensureBackendToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/claims/${claimId}/report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch {
      // Fallback to deterministic local Section 16 report synthesizer
    }

    return this.buildClientFinalReport(claim);
  }

  buildClientFinalReport(claim: Claim) {
    const agentList = Object.values(claim.agentResults || {});
    return {
      report_id: `RPT-${claim.claimId}`,
      claim_id: claim.claimId,
      terminal_state: claim.status,
      generated_at: new Date().toISOString(),
      section_1_claim_summary: {
        report_id: `RPT-${claim.claimId}`,
        claim_id: claim.claimId,
        terminal_state: claim.status,
        policyholder_name: claim.customer.name,
        policyholder_email: claim.customer.email,
        policy_number: claim.policyNumber,
        vehicle_number: claim.vehicleNumber,
        vehicle_model: claim.vehicleModel,
        accident_date: claim.accidentDate,
        accident_location: claim.accidentLocation,
        claim_type: claim.claimType,
        claimed_amount_inr: claim.claimedAmount,
        estimated_amount_inr: claim.estimatedAmount,
        approved_payable_amount_inr:
          claim.approvedAmount ||
          Math.max(0, claim.estimatedAmount - claim.deductible),
        deductible_inr: claim.deductible,
        overall_ai_confidence: Number((claim.overallConfidence / 100).toFixed(4)),
      },
      section_2_submitted_evidence: {
        total_documents: claim.documents.length,
        total_images: claim.accidentPhotos.length,
        documents: claim.documents,
        images: claim.accidentPhotos,
      },
      section_3_agent_by_agent_analysis: agentList.map((a) => ({
        agent: a.name,
        status: a.status,
        confidence: Number((a.confidence / 100).toFixed(2)),
        recommended_action:
          String(a.status) === 'FLAGGED' || String(a.status) === 'FAILED'
            ? 'ESCALATE'
            : 'CONTINUE',
        summary: a.summary,
        evidence_used: a.evidence || [],
      })),
      section_4_confidence_and_recovery_history: {
        overall_confidence: Number((claim.overallConfidence / 100).toFixed(4)),
        recovery_invocations_count: (claim.activityFeed || []).filter(
          (ev) =>
            ev.action.toLowerCase().includes('re-verify') ||
            ev.action.toLowerCase().includes('requested additional evidence')
        ).length,
        orchestrator_recovery_notes: claim.orchestratorNotes || {},
      },
      section_5_policy_coverage_analysis: {
        policy_number: claim.policyNumber,
        policy_status: claim.policyStatus,
        coverage_type: claim.policyCoverage,
        coverage_limit_inr: claim.policyLimit,
        deductible_inr: claim.deductible,
        deterministic_eligibility: {
          is_active: claim.policyStatus === 'Active',
          within_coverage_limit: claim.claimedAmount <= claim.policyLimit,
        },
      },
      section_6_fraud_risk_analysis: {
        fraud_risk_score: Number((claim.fraudRisk / 100).toFixed(4)),
        risk_band: claim.risk,
        contributing_signals: claim.fraudSignals || [],
        selected_model: 'HistGradientBoosting_Calibrated_Ensemble',
      },
      section_7_repair_cost_estimation: {
        claimed_amount_inr: claim.claimedAmount,
        ai_estimated_repair_cost_inr: claim.estimatedAmount,
        policy_deductible_inr: claim.deductible,
        net_payable_amount_inr:
          claim.approvedAmount ||
          Math.max(0, claim.estimatedAmount - claim.deductible),
        itemized_breakdown: claim.estimationBreakdown || [],
      },
      section_8_final_decision_analysis: {
        final_terminal_status: claim.status,
        satisfied_conditions: [
          `Policy ${claim.policyNumber} active (${claim.policyStatus})`,
          `Claimed amount ₹${claim.claimedAmount.toLocaleString('en-IN')} within policy limit ₹${claim.policyLimit.toLocaleString('en-IN')}`,
          'Multi-agent perception & estimation pipeline completed',
        ],
        unsatisfied_conditions:
          claim.status === 'REJECTED'
            ? ['Disqualifying policy or fraud violation detected']
            : [],
        human_specialist_adjudication: claim.humanReviewNotes || null,
        settlement_details: claim.settlement || null,
      },
      section_9_complete_audit_timeline: claim.activityFeed || [],
    };
  }

  resetToDefaults() {
    localStorage.removeItem('ai_claims_store');
    this.claims = [...INITIAL_CLAIMS];
    this.save();
    notificationService.add(
      'System Reset',
      'Claims reset to default enterprise demonstration set',
      'info'
    );
  }
}

export const claimsService = new ClaimsService();
