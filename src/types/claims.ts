export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ORCHESTRATING'
  | 'PROCESSING'
  | 'AWAITING_CUSTOMER'
  | 'ASSESSING'
  | 'HUMAN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PROCESSING'
  | 'PAID';

export type ClaimRisk = 'Low' | 'Medium' | 'High';

export type AgentId =
  | 'orchestrator'
  | 'document'
  | 'vision'
  | 'policy'
  | 'fraud'
  | 'estimation'
  | 'decision';

export type AgentStatus =
  | 'IDLE'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'LOW_CONFIDENCE'
  | 'NEEDS_INFORMATION'
  | 'ESCALATED'
  | 'FAILED'
  | 'SKIPPED';

export interface AgentResult {
  agentId: AgentId;
  name: string;
  status: AgentStatus;
  confidence: number; // 0 - 100
  summary: string;
  evidence: string[];
  requiredAction?: string;
  reasonForAction?: string;
  completedAt?: string;
  details?: Record<string, any>;
  isOptimized?: boolean;
  optimizationReason?: string;
}

export interface ClaimDocument {
  id: string;
  name: string;
  type: 'Policy' | 'Driving License' | 'Registration' | 'Repair Invoice' | 'FIR' | 'Other';
  status: 'Verified' | 'Low Quality' | 'Pending' | 'Rejected';
  ocrConfidence: number;
  fileSize: string;
  uploadDate: string;
  extractedFields: Record<string, string>;
  previewUrl?: string;
}

export interface DamageItem {
  id: string;
  partName: string;
  severity: 'Severe' | 'Moderate' | 'Minor';
  confidence: number;
  repairAction: 'Replace' | 'Repair' | 'Paint';
  estimatedCost: number;
  boxCoordinates?: { x: number; y: number; width: number; height: number };
}

export interface AccidentPhoto {
  id: string;
  angle: 'Front View' | 'Rear View' | 'Left Side' | 'Right Side' | 'Close-up';
  url: string;
  quality: 'Good' | 'Insufficient' | 'Fair';
  visionConfidence: number;
  damageDetected: DamageItem[];
}

export interface FraudSignal {
  id: string;
  name: string;
  passed: boolean;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface EstimationItem {
  category: string;
  item: string;
  cost: number;
  labor: number;
  notes?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId?: AgentId;
  agentName?: string;
  action: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'decision';
  confidence?: number;
  amount?: number;
  claimId?: string;
}

export interface Claim {
  claimId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  policyNumber: string;
  policyCoverage: string;
  policyStatus: 'Active' | 'Expired' | 'Lapsed';
  policyLimit: number;
  vehicleNumber: string;
  vehicleModel: string;
  accidentDate: string;
  accidentLocation: string;
  claimType: 'Vehicle Collision' | 'Vehicle Theft' | 'Property Damage' | 'Windshield Damage' | 'Other';
  incidentDescription: string;
  claimedAmount: number;
  estimatedAmount: number;
  approvedAmount: number;
  deductible: number;
  fraudRisk: number; // 0 - 100
  overallConfidence: number; // 0 - 100
  currentAgent: AgentId;
  status: ClaimStatus;
  risk: ClaimRisk;
  createdAt: string;
  updatedAt: string;
  
  // Dynamic Agent States
  agentResults: Record<AgentId, AgentResult>;

  // Detailed Evidence Artefacts
  documents: ClaimDocument[];
  accidentPhotos: AccidentPhoto[];
  damageAssessment: DamageItem[];
  fraudSignals: FraudSignal[];
  estimationBreakdown: EstimationItem[];
  
  // Payment / Settlement
  settlement?: {
    claimedAmount: number;
    approvedAmount: number;
    deductible: number;
    payoutAmount: number;
    paymentMethod: string;
    bankAccount: string;
    transactionId?: string;
    paymentStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    processedAt?: string;
  };

  // Dynamic Orchestration Notes
  orchestratorNotes?: {
    highLevelReasoning: string;
    availableEvidence: string[];
    requiredValidation: string[];
    currentAction: string;
    reasonForAction: string;
    isOptimized?: boolean;
    optimizationReason?: string;
  };

  // Human Review Audit
  humanReviewNotes?: {
    flaggedBy: string;
    flagReason: string;
    reviewedBy?: string;
    decision?: 'Approved' | 'Rejected' | 'Requested_Info';
    decisionNotes?: string;
    overridden?: boolean;
    timestamp?: string;
  };

  // Activity Log
  activityFeed: ActivityEvent[];
}
