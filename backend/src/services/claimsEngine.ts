import { Claim, ClaimStatus } from '../types/claims.js';
import { INITIAL_CLAIMS } from './mockData.js';

class ClaimsEngine {
  private claims: Claim[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.claims = JSON.parse(JSON.stringify(INITIAL_CLAIMS));
  }

  public getAllClaims(status?: ClaimStatus): Claim[] {
    if (status) {
      return this.claims.filter((c) => c.status === status);
    }
    return [...this.claims];
  }

  public getClaimById(claimId: string): Claim | undefined {
    return this.claims.find((c) => c.claimId === claimId);
  }

  public createClaim(newClaimData: Partial<Claim>): Claim {
    const claimId = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newClaim: Claim = {
      claimId,
      customer: newClaimData.customer || {
        name: 'Arun Kumar',
        email: 'arun.kumar@gmail.com',
        phone: '+91 98450 12345',
        address: 'Indiranagar, Bengaluru, Karnataka',
      },
      policyNumber: newClaimData.policyNumber || 'POL-882910',
      policyCoverage: newClaimData.policyCoverage || 'Comprehensive Motor',
      policyStatus: 'Active',
      policyLimit: 1450000,
      vehicleNumber: newClaimData.vehicleNumber || 'KA-01-MJ-4412',
      vehicleModel: newClaimData.vehicleModel || 'Hyundai Creta SX (O) 1.5 Diesel',
      accidentDate: newClaimData.accidentDate || new Date().toISOString().split('T')[0],
      accidentLocation: newClaimData.accidentLocation || 'Outer Ring Road, Bellandur, Bengaluru',
      claimType: newClaimData.claimType || 'Vehicle Collision',
      incidentDescription: newClaimData.incidentDescription || 'Rear-end collision during heavy bumper-to-bumper traffic.',
      claimedAmount: newClaimData.claimedAmount || 50000,
      estimatedAmount: 0,
      approvedAmount: 0,
      deductible: 5000,
      fraudRisk: 10,
      overallConfidence: 85,
      currentAgent: 'orchestrator',
      status: 'SUBMITTED',
      risk: 'Low',
      createdAt: now,
      updatedAt: now,
      agentResults: {
        orchestrator: {
          agentId: 'orchestrator',
          name: 'Claim Orchestrator',
          status: 'PROCESSING',
          confidence: 95,
          summary: 'Intake acknowledged. Evaluating missing evidence.',
          evidence: ['Intake Form Submitted'],
        },
        document: {
          agentId: 'document',
          name: 'Document Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Waiting for document bundle.',
          evidence: [],
        },
        vision: {
          agentId: 'vision',
          name: 'Vision Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Waiting for vehicle damage photos.',
          evidence: [],
        },
        policy: {
          agentId: 'policy',
          name: 'Policy Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Waiting for schedule evaluation.',
          evidence: [],
        },
        fraud: {
          agentId: 'fraud',
          name: 'Fraud Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Waiting for telemetry analysis.',
          evidence: [],
        },
        estimation: {
          agentId: 'estimation',
          name: 'Estimation Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Waiting for parts & labor quotes.',
          evidence: [],
        },
        decision: {
          agentId: 'decision',
          name: 'Decision Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Waiting for upstream pipeline completion.',
          evidence: [],
        },
      },
      documents: newClaimData.documents || [],
      accidentPhotos: newClaimData.accidentPhotos || [],
      damageAssessment: [],
      fraudSignals: [],
      estimationBreakdown: [],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          agentId: 'orchestrator',
          agentName: 'Claim Orchestrator',
          action: 'Claim registered and queued for dynamic AI orchestration.',
          type: 'info',
          claimId,
        },
      ],
    };

    this.claims.unshift(newClaim);
    return newClaim;
  }

  public updateClaim(claimId: string, updates: Partial<Claim>): Claim | undefined {
    const index = this.claims.findIndex((c) => c.claimId === claimId);
    if (index === -1) return undefined;

    const updatedClaim: Claim = {
      ...this.claims[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.claims[index] = updatedClaim;
    return updatedClaim;
  }

  public adjudicateClaim(
    claimId: string,
    decision: 'Approved' | 'Rejected' | 'Requested_Info',
    notes: string,
    customAmount?: number
  ): Claim | undefined {
    const claim = this.getClaimById(claimId);
    if (!claim) return undefined;

    const newStatus: ClaimStatus =
      decision === 'Approved' ? 'APPROVED' : decision === 'Rejected' ? 'REJECTED' : 'AWAITING_CUSTOMER';

    const approvedAmount =
      decision === 'Approved' ? (customAmount !== undefined ? customAmount : claim.approvedAmount || claim.estimatedAmount) : 0;

    return this.updateClaim(claimId, {
      status: newStatus,
      approvedAmount,
      humanReviewNotes: {
        flaggedBy: 'Fraud & Rules Detection Engine',
        flagReason: 'Mandatory Senior Assessor Oversight',
        reviewedBy: 'Anand Officer (Sr. Claims Assessor)',
        decision,
        decisionNotes: notes,
        overridden: customAmount !== undefined && customAmount !== claim.estimatedAmount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });
  }

  public processSettlement(claimId: string): Claim | undefined {
    const claim = this.getClaimById(claimId);
    if (!claim) return undefined;

    const payoutAmount = claim.approvedAmount || Math.max(0, claim.estimatedAmount - claim.deductible);
    const txId = `TXN-HDFC-${Math.floor(10000000 + Math.random() * 90000000)}`;

    return this.updateClaim(claimId, {
      status: 'PAID',
      settlement: {
        claimedAmount: claim.claimedAmount,
        approvedAmount: payoutAmount + claim.deductible,
        deductible: claim.deductible,
        payoutAmount,
        paymentMethod: 'IMPS Direct Bank Transfer',
        bankAccount: 'HDFC Bank •••• 4832 (IFSC: HDFC0001234)',
        transactionId: txId,
        paymentStatus: 'Completed',
        processedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });
  }

  public getKpis() {
    const total = this.claims.length;
    const approved = this.claims.filter((c) => ['APPROVED', 'PAID'].includes(c.status)).length;
    const humanReview = this.claims.filter((c) => c.status === 'HUMAN_REVIEW').length;
    const highRisk = this.claims.filter((c) => c.risk === 'High' || c.fraudRisk > 40).length;
    const aiAutonomousRate = total > 0 ? Math.round(((total - humanReview) / total) * 1000) / 10 : 0;

    return {
      totalClaims: 1284,
      aiProcessed: 1041,
      aiAutonomousRate: `${aiAutonomousRate}%`,
      autoApproved: 742,
      humanReviewCount: humanReview,
      potentialFraud: 43,
    };
  }
}

export const claimsEngine = new ClaimsEngine();
