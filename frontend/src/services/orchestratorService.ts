import { Claim, AgentId, AgentResult, ClaimStatus } from '../types/claims';
import { claimsService } from './claimsService';
import { notificationService } from './notificationService';

export interface WorkflowStepState {
  currentAgent: AgentId;
  activeAgents: AgentId[];
  completedAgents: AgentId[];
  statusText: string;
  reasoning: string;
  isPausedForCustomer?: boolean;
  isEscalated?: boolean;
  isOptimized?: boolean;
}

type StepCallback = (state: WorkflowStepState) => void;

class OrchestratorService {
  private activeSimulations: Map<string, boolean> = new Map();

  stopSimulation(claimId: string) {
    this.activeSimulations.set(claimId, false);
  }

  isSimulating(claimId: string): boolean {
    return !!this.activeSimulations.get(claimId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // SCENARIO 1: Simple Straightforward Claim
  async runSimpleClaim(claimId: string, onStep?: StepCallback, speedMs: number = 1400) {
    this.activeSimulations.set(claimId, true);

    const updateAgent = (agentId: AgentId, result: Partial<AgentResult>) => {
      const claim = claimsService.getClaimById(claimId);
      if (!claim) return;
      const existing = claim.agentResults[agentId];
      const updatedResults = {
        ...claim.agentResults,
        [agentId]: { ...existing, ...result, completedAt: new Date().toLocaleTimeString() },
      };
      claimsService.updateClaim(claimId, {
        currentAgent: agentId,
        agentResults: updatedResults,
      });
    };

    try {
      // Step 1: Orchestrator initialization
      claimsService.updateClaim(claimId, { status: 'ORCHESTRATING', currentAgent: 'orchestrator' });
      claimsService.addActivity(claimId, {
        agentId: 'orchestrator',
        agentName: 'Claim Orchestrator',
        action: 'Ingested claim evidence. Initializing multi-agent assessment graph.',
        type: 'info',
      });
      onStep?.({
        currentAgent: 'orchestrator',
        activeAgents: ['orchestrator'],
        completedAgents: [],
        statusText: 'Orchestrator Analyzing Claim Submission...',
        reasoning: 'Verifying submitted claim payload and scheduling specialized agents based on collision type.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      // Step 2: Document Agent
      claimsService.updateClaim(claimId, { status: 'PROCESSING', currentAgent: 'document' });
      updateAgent('document', { status: 'PROCESSING', confidence: 0, summary: 'Extracting OCR entities from 4 documents...' });
      onStep?.({
        currentAgent: 'document',
        activeAgents: ['document'],
        completedAgents: ['orchestrator'],
        statusText: 'Document Agent OCR Extraction...',
        reasoning: 'Extracting structured entities from Policy Schedule, Driver License, Registration Certificate, and Garage Estimate.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('document', {
        status: 'COMPLETED',
        confidence: 97,
        summary: 'All 4 documents verified. 27 fields extracted with 97% confidence.',
        evidence: ['Policy verified', 'License DL-TN01 verified', 'RC TN 45 AB verified', 'Authorized repair estimate parsed'],
      });
      claimsService.addActivity(claimId, {
        agentId: 'document',
        agentName: 'Document Agent',
        action: 'OCR extraction successful: 4 documents verified with 97% confidence.',
        type: 'success',
        confidence: 97,
      });

      // Step 3: Vision Agent
      claimsService.updateClaim(claimId, { currentAgent: 'vision' });
      updateAgent('vision', { status: 'PROCESSING', summary: 'Detecting vehicle components and classifying impact damage...' });
      onStep?.({
        currentAgent: 'vision',
        activeAgents: ['vision'],
        completedAgents: ['orchestrator', 'document'],
        statusText: 'Vision Agent Computer Vision Damage Assessment...',
        reasoning: 'Scanning 2 multi-angle high-resolution photographs to segment damaged panels and assess deformation severity.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('vision', {
        status: 'COMPLETED',
        confidence: 94,
        summary: 'Front bumper severe crack detected. Left headlamp broken. Bonnet minor dent.',
        evidence: ['Front bumper severe crack (94% conf)', 'Left headlamp shattered (91% conf)', 'Bonnet minor crease (86% conf)'],
      });
      claimsService.addActivity(claimId, {
        agentId: 'vision',
        agentName: 'Vision Agent',
        action: 'Damage verified: Front bumper (Severe), Left Headlamp (Broken), Bonnet (Minor).',
        type: 'info',
        confidence: 94,
      });

      // Step 4: Policy Agent
      claimsService.updateClaim(claimId, { currentAgent: 'policy' });
      updateAgent('policy', { status: 'PROCESSING', summary: 'Cross-verifying policy coverage clauses and deductibles...' });
      onStep?.({
        currentAgent: 'policy',
        activeAgents: ['policy'],
        completedAgents: ['orchestrator', 'document', 'vision'],
        statusText: 'Policy Agent Coverage & Deductible Verification...',
        reasoning: 'Confirming policy was active at date of loss and that own-damage collision is covered with zero depreciation.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('policy', {
        status: 'COMPLETED',
        confidence: 99,
        summary: 'Policy POL-983742 is Active. Comprehensive cover applies. Deductible: ₹5,000.',
        evidence: ['Status: Active', 'Sum insured: ₹5,00,000', 'Accident date valid', 'Deductible: ₹5,000'],
      });
      claimsService.addActivity(claimId, {
        agentId: 'policy',
        agentName: 'Policy Agent',
        action: 'Policy verified active with Comprehensive coverage.',
        type: 'success',
        confidence: 99,
      });

      // Step 5: Fraud Agent
      claimsService.updateClaim(claimId, { currentAgent: 'fraud' });
      updateAgent('fraud', { status: 'PROCESSING', summary: 'Executing 5 fraud heuristics and geospatial checks...' });
      onStep?.({
        currentAgent: 'fraud',
        activeAgents: ['fraud'],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy'],
        statusText: 'Fraud Agent Risk Scoring & Anomaly Detection...',
        reasoning: 'Scanning national claims database for duplicate claims, inspecting photo EXIF metadata, and checking identity consistency.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('fraud', {
        status: 'COMPLETED',
        confidence: 92,
        summary: 'Low fraud score: 12 / 100. Zero anomalies detected.',
        evidence: ['No duplicate claim', 'Photo EXIF GPS aligns with location', 'Claim frequency normal', 'Identity verified'],
      });
      claimsService.addActivity(claimId, {
        agentId: 'fraud',
        agentName: 'Fraud Agent',
        action: 'Fraud screening completed. Score: 12/100 (Low Risk).',
        type: 'info',
        confidence: 92,
      });

      // Step 6: Estimation Agent
      claimsService.updateClaim(claimId, { currentAgent: 'estimation' });
      updateAgent('estimation', { status: 'PROCESSING', summary: 'Benchmarking OEM parts catalog and labor rates...' });
      onStep?.({
        currentAgent: 'estimation',
        activeAgents: ['estimation'],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy', 'fraud'],
        statusText: 'Estimation Agent Cost Calculation...',
        reasoning: 'Aggregating OEM replacement parts, painting schedules, and standardized regional labor hours.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('estimation', {
        status: 'COMPLETED',
        confidence: 93,
        summary: 'AI estimate ₹48,000 vs Customer invoice ₹49,200 (2.4% variance within acceptable threshold).',
        evidence: ['Bumper: ₹18,000', 'Headlamp: ₹9,500', 'Bonnet repair: ₹12,000', 'Labor: ₹8,500'],
      });
      claimsService.addActivity(claimId, {
        agentId: 'estimation',
        agentName: 'Estimation Agent',
        action: 'Estimated repair cost: ₹48,000. Customer invoice variance: 2.4%.',
        type: 'info',
        confidence: 93,
        amount: 48000,
      });

      // Step 7: Decision Agent
      claimsService.updateClaim(claimId, { currentAgent: 'decision' });
      updateAgent('decision', { status: 'PROCESSING', summary: 'Synthesizing agent inputs against auto-settlement guardrails...' });
      onStep?.({
        currentAgent: 'decision',
        activeAgents: ['decision'],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy', 'fraud', 'estimation'],
        statusText: 'Decision Agent Final Adjudication...',
        reasoning: 'Evaluating overall confidence (94%), low fraud risk (12/100), and policy validity.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('decision', {
        status: 'COMPLETED',
        confidence: 94,
        summary: 'AUTO-APPROVED: Net settlement ₹43,000 ready for instant payment.',
        evidence: ['All 5 guardrails satisfied', 'Fraud risk below 20', 'Variance below 5%'],
      });

      claimsService.updateClaim(claimId, {
        status: 'APPROVED',
        approvedAmount: 43000,
        currentAgent: 'decision',
        orchestratorNotes: {
          highLevelReasoning: 'Straightforward claim processed autonomously with high confidence across all 6 specialized agents.',
          availableEvidence: ['4 Verified Documents', '2 Damage Photos', 'Policy Schedule', 'Workshop Estimate'],
          requiredValidation: ['All validations passed'],
          currentAction: 'Claim Auto-Approved. Ready for settlement.',
          reasonForAction: 'All agent confidence scores >90% with low risk score (12/100).',
        },
      });

      claimsService.addActivity(claimId, {
        agentId: 'decision',
        agentName: 'Decision Agent',
        action: 'Claim AUTO-APPROVED. Net payout: ₹43,000.',
        type: 'decision',
        confidence: 94,
        amount: 43000,
      });

      notificationService.add(
        'Claim Auto-Approved',
        `Claim ${claimId} approved for ₹43,000. Ready for payment!`,
        'success',
        claimId
      );

      onStep?.({
        currentAgent: 'decision',
        activeAgents: [],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy', 'fraud', 'estimation', 'decision'],
        statusText: 'Claim Successfully Auto-Approved!',
        reasoning: 'All criteria fulfilled with 94% composite confidence. Payout authorized.',
      });
    } finally {
      this.activeSimulations.delete(claimId);
    }
  }

  // SCENARIO 2: Uncertain Claim (Vision 31% -> Pauses for Customer Clearer Image -> Customer Uploads -> Vision 94% -> Auto-Approved)
  async runUncertainClaim(claimId: string, onStep?: StepCallback, speedMs: number = 1400) {
    this.activeSimulations.set(claimId, true);

    const updateAgent = (agentId: AgentId, result: Partial<AgentResult>) => {
      const claim = claimsService.getClaimById(claimId);
      if (!claim) return;
      const existing = claim.agentResults[agentId];
      claimsService.updateClaim(claimId, {
        currentAgent: agentId,
        agentResults: {
          ...claim.agentResults,
          [agentId]: { ...existing, ...result, completedAt: new Date().toLocaleTimeString() },
        },
      });
    };

    try {
      // Step 1: Orchestrator
      claimsService.updateClaim(claimId, { status: 'ORCHESTRATING', currentAgent: 'orchestrator' });
      onStep?.({
        currentAgent: 'orchestrator',
        activeAgents: ['orchestrator'],
        completedAgents: [],
        statusText: 'Claim Orchestrator: Ingesting Low-Light Submission...',
        reasoning: 'Evaluating claim documents and accident images.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      // Step 2: Document Agent completes
      claimsService.updateClaim(claimId, { status: 'PROCESSING', currentAgent: 'document' });
      updateAgent('document', { status: 'PROCESSING' });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('document', {
        status: 'COMPLETED',
        confidence: 96,
        summary: 'Policy and driver credentials verified.',
        evidence: ['Policy verified', 'Registration valid'],
      });

      // Step 3: Vision Agent triggers LOW CONFIDENCE!
      claimsService.updateClaim(claimId, { currentAgent: 'vision' });
      updateAgent('vision', { status: 'PROCESSING', summary: 'Analyzing underexposed basement photo...' });
      onStep?.({
        currentAgent: 'vision',
        activeAgents: ['vision'],
        completedAgents: ['orchestrator', 'document'],
        statusText: 'Vision Agent: Image Quality Insufficient...',
        reasoning: 'Image is heavily shadowed and blurred. Model refusing to hallucinate damage extent.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('vision', {
        status: 'LOW_CONFIDENCE',
        confidence: 31,
        summary: '⚠ LOW CONFIDENCE (31%): Underexposed and motion blurred. Unable to reliably distinguish metal damage.',
        evidence: ['Severe grain & shadow detected', 'Model refuses to hallucinate damage without adequate clarity'],
        requiredAction: 'Request clearer daylight photograph from customer.',
        reasonForAction: 'System guardrail: Confidence 31% is below minimum 75% assessment threshold.',
      });

      // Step 4: Orchestrator dynamically pauses and requests customer evidence
      claimsService.updateClaim(claimId, {
        status: 'AWAITING_CUSTOMER',
        currentAgent: 'orchestrator',
        orchestratorNotes: {
          highLevelReasoning: 'Adaptive Recovery: The AI refuses to guess when confidence is low (31%). Requesting clear daylight photograph from customer.',
          availableEvidence: ['Verified Policy', '1 Underexposed Photo'],
          requiredValidation: ['Clear front view photograph of damaged bumper in daylight'],
          currentAction: 'Awaiting Customer Response',
          reasonForAction: 'Vision confidence 31% is below minimum 75% threshold.',
        },
      });

      claimsService.addActivity(claimId, {
        agentId: 'orchestrator',
        agentName: 'Claim Orchestrator',
        action: 'System paused: Vision Agent confidence 31%. Requested clearer daylight photo from policyholder.',
        type: 'warning',
        confidence: 31,
      });

      notificationService.add(
        'Action Required: Low Confidence',
        'Vision confidence 31%. Prompting customer for clearer image.',
        'warning',
        claimId
      );

      onStep?.({
        currentAgent: 'orchestrator',
        activeAgents: ['orchestrator'],
        completedAgents: ['document'],
        statusText: 'PAUSED: Orchestrator Requesting Customer Evidence',
        reasoning: 'AI that knows when to ask: Vision confidence 31% is below threshold. Refusing to fabricate damage.',
        isPausedForCustomer: true,
      });
    } finally {
      this.activeSimulations.delete(claimId);
    }
  }

  // Resume uncertain claim once customer uploads clearer photo
  async resumeUncertainClaimWithNewImage(claimId: string, onStep?: StepCallback, speedMs: number = 1400) {
    this.activeSimulations.set(claimId, true);

    const updateAgent = (agentId: AgentId, result: Partial<AgentResult>) => {
      const claim = claimsService.getClaimById(claimId);
      if (!claim) return;
      const existing = claim.agentResults[agentId];
      claimsService.updateClaim(claimId, {
        currentAgent: agentId,
        agentResults: {
          ...claim.agentResults,
          [agentId]: { ...existing, ...result, completedAt: new Date().toLocaleTimeString() },
        },
      });
    };

    try {
      claimsService.updateClaim(claimId, { status: 'PROCESSING', currentAgent: 'vision' });
      claimsService.addActivity(claimId, {
        agentId: 'orchestrator',
        agentName: 'Claim Orchestrator',
        action: 'New high-resolution photograph received from customer. Re-invoking Vision Agent.',
        type: 'info',
      });

      onStep?.({
        currentAgent: 'vision',
        activeAgents: ['vision'],
        completedAgents: ['document'],
        statusText: 'Vision Agent: Re-analyzing with New Clear Photograph...',
        reasoning: 'Customer provided clear daylight photo. Re-computing component segmentation and damage assessment.',
      });
      await this.sleep(speedMs);

      // Vision Agent now passes with 94% confidence!
      updateAgent('vision', {
        status: 'COMPLETED',
        confidence: 94,
        summary: '✓ CLEAR PHOTO VERIFIED (94%): Front bumper scrape and left fog lamp bezel crack successfully identified.',
        evidence: ['Clear daylight photo confirmed', 'Scrape depth: 3.2mm', 'Fog lamp bracket unseated'],
      });

      claimsService.addActivity(claimId, {
        agentId: 'vision',
        agentName: 'Vision Agent',
        action: 'Re-analysis SUCCESS: Vision confidence elevated from 31% to 94%.',
        type: 'success',
        confidence: 94,
      });

      // Policy Agent
      claimsService.updateClaim(claimId, { currentAgent: 'policy' });
      onStep?.({
        currentAgent: 'policy',
        activeAgents: ['policy'],
        completedAgents: ['document', 'vision'],
        statusText: 'Policy Agent: Verifying Coverage...',
        reasoning: 'Confirming coverage for bumper scrape.',
      });
      await this.sleep(speedMs);

      updateAgent('policy', {
        status: 'COMPLETED',
        confidence: 98,
        summary: 'Policy verified active. Parking collision covered.',
        evidence: ['Active cover', 'Deductible ₹2,000'],
      });

      // Fraud Agent
      claimsService.updateClaim(claimId, { currentAgent: 'fraud' });
      onStep?.({
        currentAgent: 'fraud',
        activeAgents: ['fraud'],
        completedAgents: ['document', 'vision', 'policy'],
        statusText: 'Fraud Agent: Screening...',
        reasoning: 'Screening customer history and EXIF consistency.',
      });
      await this.sleep(speedMs);

      updateAgent('fraud', {
        status: 'COMPLETED',
        confidence: 95,
        summary: 'Low fraud score: 14 / 100. Genuine minor parking incident.',
        evidence: ['Clean history', 'No prior claims'],
      });

      // Estimation Agent
      claimsService.updateClaim(claimId, { currentAgent: 'estimation' });
      onStep?.({
        currentAgent: 'estimation',
        activeAgents: ['estimation'],
        completedAgents: ['document', 'vision', 'policy', 'fraud'],
        statusText: 'Estimation Agent: Pricing Repair...',
        reasoning: 'Pricing bumper paint and fog lamp housing repair.',
      });
      await this.sleep(speedMs);

      updateAgent('estimation', {
        status: 'COMPLETED',
        confidence: 94,
        summary: 'Calculated repair cost: ₹22,500. Deductible: ₹2,000.',
        evidence: ['Bumper refinish: ₹14,500', 'Fog lamp bracket: ₹4,500', 'Labor: ₹3,500'],
      });

      // Decision Agent
      claimsService.updateClaim(claimId, { currentAgent: 'decision' });
      onStep?.({
        currentAgent: 'decision',
        activeAgents: ['decision'],
        completedAgents: ['document', 'vision', 'policy', 'fraud', 'estimation'],
        statusText: 'Decision Agent: Adjudication...',
        reasoning: 'Finalizing approval following successful customer evidence loop.',
      });
      await this.sleep(speedMs);

      updateAgent('decision', {
        status: 'COMPLETED',
        confidence: 95,
        summary: 'AUTO-APPROVED: Net settlement ₹20,500 ready for payout.',
        evidence: ['All requirements met after customer upload', 'Confidence elevated to 95%'],
      });

      claimsService.updateClaim(claimId, {
        status: 'APPROVED',
        approvedAmount: 20500,
        currentAgent: 'decision',
        orchestratorNotes: {
          highLevelReasoning: 'Successfully resolved low-confidence uncertainty by prompting customer. Claim verified and auto-approved.',
          availableEvidence: ['Verified Policy Schedule', 'Daylight Replacement Photo', 'Damage Assessment'],
          requiredValidation: ['All validations passed'],
          currentAction: 'Claim Auto-Approved following customer re-upload.',
          reasonForAction: 'Adaptive loop succeeded. Vision confidence raised from 31% to 94%.',
        },
      });

      claimsService.addActivity(claimId, {
        agentId: 'decision',
        agentName: 'Decision Agent',
        action: 'Claim AUTO-APPROVED after customer provided clearer image. Net payout: ₹20,500.',
        type: 'decision',
        confidence: 95,
        amount: 20500,
      });

      notificationService.add(
        'Adaptive Loop Succeeded',
        `Claim ${claimId} auto-approved after clearer photo was verified!`,
        'success',
        claimId
      );

      onStep?.({
        currentAgent: 'decision',
        activeAgents: [],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy', 'fraud', 'estimation', 'decision'],
        statusText: 'Adaptive Loop Succeeded: Claim Auto-Approved!',
        reasoning: 'The system asked when uncertain, verified the new evidence, and completed auto-approval.',
      });
    } finally {
      this.activeSimulations.delete(claimId);
    }
  }

  // SCENARIO 3: Fraud Detection Case (Escalates to Human Review)
  async runFraudClaim(claimId: string, onStep?: StepCallback, speedMs: number = 1400) {
    this.activeSimulations.set(claimId, true);

    const updateAgent = (agentId: AgentId, result: Partial<AgentResult>) => {
      const claim = claimsService.getClaimById(claimId);
      if (!claim) return;
      const existing = claim.agentResults[agentId];
      claimsService.updateClaim(claimId, {
        currentAgent: agentId,
        agentResults: {
          ...claim.agentResults,
          [agentId]: { ...existing, ...result, completedAt: new Date().toLocaleTimeString() },
        },
      });
    };

    try {
      claimsService.updateClaim(claimId, { status: 'ORCHESTRATING', currentAgent: 'orchestrator' });
      onStep?.({
        currentAgent: 'orchestrator',
        activeAgents: ['orchestrator'],
        completedAgents: [],
        statusText: 'Claim Orchestrator: Inspecting High-Value Claim...',
        reasoning: 'High-value total loss claim (₹2,15,000) ingested. Engaging multi-agent scrutiny.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      // Document Agent: flags VIN anomaly
      claimsService.updateClaim(claimId, { status: 'PROCESSING', currentAgent: 'document' });
      updateAgent('document', { status: 'PROCESSING' });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('document', {
        status: 'COMPLETED',
        confidence: 89,
        summary: '⚠ WARNING: Chassis VIN mismatch between Registration Certificate and garage quote.',
        evidence: ['RC: WBA5R1C55PFP12948', 'Invoice: WBA5R1C55PFP12984 (Transposed digits)'],
      });
      claimsService.addActivity(claimId, {
        agentId: 'document',
        agentName: 'Document Agent',
        action: 'Anomaly Detected: Vehicle Chassis number on garage quote differs from Registration.',
        type: 'alert',
        confidence: 89,
      });

      // Vision Agent: detects preexisting rust
      claimsService.updateClaim(claimId, { currentAgent: 'vision' });
      updateAgent('vision', { status: 'PROCESSING' });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('vision', {
        status: 'COMPLETED',
        confidence: 61,
        summary: '⚠ Oxidation rust detected on suspension arm, indicating pre-existing aged damage.',
        evidence: ['Rust oxidation on tie rod inconsistent with reported midnight incident'],
      });

      // Policy Agent
      claimsService.updateClaim(claimId, { currentAgent: 'policy' });
      updateAgent('policy', { status: 'PROCESSING' });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('policy', {
        status: 'COMPLETED',
        confidence: 95,
        summary: 'Policy active, but claim frequency trigger tripped (3 claims in 11 months).',
        evidence: ['3rd collision claim in 11 months'],
      });

      // Fraud Agent: TRIGGERS HIGH RISK 87 / 100
      claimsService.updateClaim(claimId, { currentAgent: 'fraud' });
      updateAgent('fraud', { status: 'PROCESSING' });
      onStep?.({
        currentAgent: 'fraud',
        activeAgents: ['fraud'],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy'],
        statusText: 'Fraud Agent: High-Risk Indicators Detected!',
        reasoning: 'Multiple red flags detected across VIN, claim frequency, photo timestamp, and repair markup.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('fraud', {
        status: 'ESCALATED',
        confidence: 94,
        summary: '🚨 CRITICAL FRAUD SCORE: 87 / 100. VIN mismatch, quote inflated by 51.4%, repeat claims.',
        evidence: ['Chassis VIN mismatch', 'Quote +51.4% above baseline', 'Photo taken 4 days prior to alleged incident', 'High frequency cluster'],
      });

      claimsService.addActivity(claimId, {
        agentId: 'fraud',
        agentName: 'Fraud Agent',
        action: '🚨 HIGH RISK FRAUD SCORE: 87/100 detected. Multiple anomalies flagged.',
        type: 'alert',
        confidence: 94,
      });

      // Decision Agent: Escalates to Human Review
      claimsService.updateClaim(claimId, { currentAgent: 'decision' });
      updateAgent('decision', { status: 'PROCESSING' });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('decision', {
        status: 'ESCALATED',
        confidence: 87,
        summary: 'DECISION: ESCALATED TO HUMAN REVIEW. Auto-approval blocked by Fraud & Risk Guardrail #3.',
        evidence: ['High fraud score (87/100) exceeds safety limit (40)'],
        requiredAction: 'Senior Claims Assessor manual physical inspection & forensic verification.',
      });

      claimsService.updateClaim(claimId, {
        status: 'HUMAN_REVIEW',
        risk: 'High',
        currentAgent: 'decision',
        orchestratorNotes: {
          highLevelReasoning: 'AI that knows when to escalate: High-risk anomalies detected. Automatically escalating to Senior Claims Assessor cockpit for forensic adjudication.',
          availableEvidence: ['Policy Schedule', 'Garage Estimate', 'Photo (1 angle)'],
          requiredValidation: ['Physical vehicle forensic inspection', 'Garage audit', 'Accident date confirmation'],
          currentAction: 'Pending Claims Officer Adjudication',
          reasonForAction: 'Fraud score 87/100 and VIN mismatch exceeded auto-approval safety limits.',
        },
        humanReviewNotes: {
          flaggedBy: 'AI Fraud Agent & Decision Engine',
          flagReason: 'Fraud Score 87/100: Chassis VIN mismatch and +₹73,000 cost inflation',
        },
      });

      claimsService.addActivity(claimId, {
        agentId: 'decision',
        agentName: 'Decision Agent',
        action: 'Claim ESCALATED TO HUMAN REVIEW. Placed in Senior Assessor review queue.',
        type: 'warning',
      });

      notificationService.add(
        'Escalated to Human Review',
        `High fraud risk (87/100) on ${claimId}. Route to Assessor Cockpit.`,
        'warning',
        claimId
      );

      onStep?.({
        currentAgent: 'decision',
        activeAgents: [],
        completedAgents: ['orchestrator', 'document', 'vision', 'policy', 'fraud', 'decision'],
        statusText: 'Escalated to Human Review: Assessor Required',
        reasoning: 'System detected high risk anomalies and safely escalated to human claims assessor.',
        isEscalated: true,
      });
    } finally {
      this.activeSimulations.delete(claimId);
    }
  }

  // SCENARIO 4: Expired Policy Dynamic Routing (Prunes Vision, Fraud & Estimation)
  async runExpiredPolicyWorkflow(claimId: string, onStep?: StepCallback, speedMs: number = 1400) {
    this.activeSimulations.set(claimId, true);

    const updateAgent = (agentId: AgentId, result: Partial<AgentResult>) => {
      const claim = claimsService.getClaimById(claimId);
      if (!claim) return;
      const existing = claim.agentResults[agentId];
      claimsService.updateClaim(claimId, {
        currentAgent: agentId,
        agentResults: {
          ...claim.agentResults,
          [agentId]: { ...existing, ...result, completedAt: new Date().toLocaleTimeString() },
        },
      });
    };

    try {
      claimsService.updateClaim(claimId, { status: 'ORCHESTRATING', currentAgent: 'orchestrator' });
      onStep?.({
        currentAgent: 'orchestrator',
        activeAgents: ['orchestrator'],
        completedAgents: [],
        statusText: 'Claim Orchestrator: Scheduling Baseline Validation...',
        reasoning: 'Prioritizing policy eligibility checks before executing heavy visual models.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      // Document Agent
      claimsService.updateClaim(claimId, { status: 'PROCESSING', currentAgent: 'document' });
      updateAgent('document', { status: 'PROCESSING' });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('document', {
        status: 'COMPLETED',
        confidence: 99,
        summary: 'Extracted policy number POL-108821 and incident timestamp.',
        evidence: ['Policy schedule parsed', 'Date of loss extracted: 07-Sep-2026'],
      });

      // Policy Agent detects EXPIRED
      claimsService.updateClaim(claimId, { currentAgent: 'policy' });
      updateAgent('policy', { status: 'PROCESSING' });
      onStep?.({
        currentAgent: 'policy',
        activeAgents: ['policy'],
        completedAgents: ['orchestrator', 'document'],
        statusText: 'Policy Agent: Verifying Coverage Validity Window...',
        reasoning: 'Comparing loss date against policy active period.',
      });
      await this.sleep(speedMs);
      if (!this.activeSimulations.get(claimId)) return;

      updateAgent('policy', {
        status: 'FAILED',
        confidence: 99,
        summary: 'POLICY EXPIRED: Expired on 15-Aug-2026. Loss occurred on 07-Sep-2026 (23 days uninsured).',
        evidence: ['Policy expired 23 days before incident', 'No active grace period'],
        requiredAction: 'Issue formal rejection notice with policy renewal proposal.',
        reasonForAction: 'Zero coverage on date of loss.',
      });

      claimsService.addActivity(claimId, {
        agentId: 'policy',
        agentName: 'Policy Agent',
        action: 'POLICY INELIGIBLE: Policy expired 23 days prior to accident date.',
        type: 'alert',
        confidence: 99,
      });

      // Orchestrator dynamic branch pruning!
      claimsService.updateClaim(claimId, { currentAgent: 'orchestrator' });
      updateAgent('vision', { status: 'SKIPPED', summary: 'SKIPPED: Not required due to policy ineligibility.' });
      updateAgent('fraud', { status: 'SKIPPED', summary: 'SKIPPED: Not required due to policy ineligibility.' });
      updateAgent('estimation', { status: 'SKIPPED', summary: 'SKIPPED: Not required due to policy ineligibility.' });

      claimsService.addActivity(claimId, {
        agentId: 'orchestrator',
        agentName: 'Claim Orchestrator',
        action: 'Dynamic Routing: Pruned Vision, Fraud, and Estimation agents. Direct to Decision.',
        type: 'warning',
      });

      onStep?.({
        currentAgent: 'orchestrator',
        activeAgents: ['orchestrator'],
        completedAgents: ['document', 'policy'],
        statusText: 'WORKFLOW OPTIMIZED: Downstream Agents Pruned',
        reasoning: 'Policy is legally void on date of loss. Skipping Vision, Fraud, and Estimation to save compute and eliminate delay.',
        isOptimized: true,
      });
      await this.sleep(speedMs);

      // Decision Agent issues rejection
      claimsService.updateClaim(claimId, { currentAgent: 'decision' });
      updateAgent('decision', { status: 'PROCESSING' });
      await this.sleep(speedMs);

      updateAgent('decision', {
        status: 'COMPLETED',
        confidence: 99,
        summary: 'CLAIM REJECTED: Coverage was not active at the time of loss.',
        evidence: ['Accident occurred outside policy validity window'],
      });

      claimsService.updateClaim(claimId, {
        status: 'REJECTED',
        currentAgent: 'decision',
        orchestratorNotes: {
          highLevelReasoning: 'WORKFLOW OPTIMIZED: The Claim Orchestrator dynamically skipped Vision, Fraud, and Estimation stages because insurance eligibility failed at baseline.',
          availableEvidence: ['Expired Policy Document'],
          requiredValidation: ['Policy coverage validity (Failed)'],
          currentAction: 'Claim Rejected. Formal notice dispatched.',
          reasonForAction: 'Loss date falls outside active coverage period.',
          isOptimized: true,
          optimizationReason: 'Zero compute wasted on damage assessment when policy coverage is legally void.',
        },
      });

      claimsService.addActivity(claimId, {
        agentId: 'decision',
        agentName: 'Decision Agent',
        action: 'Claim formally REJECTED due to expired policy. Renewal notice sent.',
        type: 'decision',
        confidence: 99,
      });

      notificationService.add(
        'Claim Rejected (Policy Expired)',
        `Claim ${claimId} resolved in 2.4s. Downstream agents skipped.`,
        'error',
        claimId
      );

      onStep?.({
        currentAgent: 'decision',
        activeAgents: [],
        completedAgents: ['orchestrator', 'document', 'policy', 'decision'],
        statusText: 'Workflow Completed: Claim Formally Rejected',
        reasoning: 'Adaptive pruning executed successfully. Downstream stages skipped.',
        isOptimized: true,
      });
    } finally {
      this.activeSimulations.delete(claimId);
    }
  }
}

export const orchestratorService = new OrchestratorService();
