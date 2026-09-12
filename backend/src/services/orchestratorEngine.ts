import { claimsEngine } from './claimsEngine.js';
import { AgentId } from '../types/claims.js';

class OrchestratorEngine {
  public async runOrchestration(claimId: string, scenario?: string): Promise<any> {
    const claim = claimsEngine.getClaimById(claimId);
    if (!claim) throw new Error(`Claim ${claimId} not found`);

    if (scenario === 'expired' || claim.policyStatus === 'Expired') {
      return this.runExpiredPolicyScenario(claimId);
    } else if (scenario === 'fraud' || claim.fraudRisk > 50) {
      return this.runFraudScenario(claimId);
    } else if (scenario === 'uncertain' || claim.claimId === 'CLM-2026-01775') {
      return this.runUncertainScenario(claimId);
    } else {
      return this.runSimpleScenario(claimId);
    }
  }

  public async runSimpleScenario(claimId: string) {
    claimsEngine.updateClaim(claimId, {
      status: 'APPROVED',
      approvedAmount: 43000,
      overallConfidence: 96,
      currentAgent: 'decision',
    });
    return claimsEngine.getClaimById(claimId);
  }

  public async runUncertainScenario(claimId: string) {
    claimsEngine.updateClaim(claimId, {
      status: 'AWAITING_CUSTOMER',
      overallConfidence: 58,
      currentAgent: 'vision',
      orchestratorNotes: {
        highLevelReasoning: 'Vision model flagged low confidence on blurred/low-light bumper photo.',
        availableEvidence: ['Driving License', 'Policy Schedule', 'RC Book'],
        requiredValidation: ['Clear daylight photo of front bumper impact zone'],
        currentAction: 'Awaiting Customer Photo Evidence',
        reasonForAction: 'Prevents hallucinated estimation by seeking high-fidelity clarification.',
      },
    });
    return claimsEngine.getClaimById(claimId);
  }

  public async runFraudScenario(claimId: string) {
    claimsEngine.updateClaim(claimId, {
      status: 'HUMAN_REVIEW',
      fraudRisk: 87,
      risk: 'High',
      overallConfidence: 89,
      currentAgent: 'fraud',
      orchestratorNotes: {
        highLevelReasoning: 'Chassis VIN transposition mismatch detected between RC Book and repair invoice. Estimate inflated by 51%.',
        availableEvidence: ['RC Book', 'Repair Estimate', 'EXIF Metadata'],
        requiredValidation: ['Physical Forensic Inspection by Senior Assessor'],
        currentAction: 'Escalated to Human Assessor Cockpit',
        reasonForAction: 'Autonomous guardrail triggered: claims with fraud score > 40 require human sign-off.',
      },
    });
    return claimsEngine.getClaimById(claimId);
  }

  public async runExpiredPolicyScenario(claimId: string) {
    claimsEngine.updateClaim(claimId, {
      status: 'REJECTED',
      overallConfidence: 99,
      currentAgent: 'policy',
      orchestratorNotes: {
        highLevelReasoning: 'Policy Agent determined policy expired 42 days prior to reported incident date. Downstream Vision, Estimation, and Settlement pruned.',
        availableEvidence: ['Policy Schedule'],
        requiredValidation: [],
        currentAction: 'Instant Rejection & Optimization',
        reasonForAction: 'Pipeline Optimization: Eliminates computational waste when fundamental coverage is inactive.',
        isOptimized: true,
        optimizationReason: 'Pruned Vision, Estimation & Payment agents (saved ~8.4s & API compute costs)',
      },
    });
    return claimsEngine.getClaimById(claimId);
  }

  public async resolveUncertaintyWithPhoto(claimId: string) {
    claimsEngine.updateClaim(claimId, {
      status: 'APPROVED',
      approvedAmount: 43000,
      overallConfidence: 94,
      currentAgent: 'decision',
      orchestratorNotes: {
        highLevelReasoning: 'Customer uploaded high-resolution daylight photo. Vision confidence restored to 94%. Auto-approval granted.',
        availableEvidence: ['Daylight Bumper Photo', 'Driving License', 'RC Book'],
        requiredValidation: ['Verification Complete'],
        currentAction: 'Instant Auto-Approval Completed',
        reasonForAction: 'All validation criteria successfully satisfied.',
      },
    });
    return claimsEngine.getClaimById(claimId);
  }
}

export const orchestratorEngine = new OrchestratorEngine();
