import { Claim, AgentResult } from '../types/claims';

// SVG data URI generator for vehicle damage graphics
const createCarDamageSvg = (title: string, highlightPart: string, severityColor: string = '#F08A7E') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%">
    <rect width="600" height="380" fill="#1C1820" rx="8"/>
    <!-- Grid pattern -->
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2C2430" stroke-width="0.5"/>
      </pattern>
    </defs>
    <rect width="600" height="380" fill="url(#grid)"/>
    
    <!-- Car body outline (front-quarter view) -->
    <g transform="translate(60, 40)">
      <!-- Car silhouette -->
      <path d="M 80,180 L 120,110 L 220,90 L 360,95 L 420,140 L 460,180 L 470,220 L 450,240 L 400,240 C 390,210 350,210 340,240 L 170,240 C 160,210 120,210 110,240 L 50,240 L 40,210 Z" 
            fill="#2E2433" stroke="#542653" stroke-width="3"/>
      
      <!-- Windshield & Windows -->
      <path d="M 140,115 L 210,100 L 250,145 L 155,145 Z" fill="#3D3144" stroke="#542653" stroke-width="1.5"/>
      <path d="M 260,145 L 225,100 L 350,102 L 395,145 Z" fill="#3D3144" stroke="#542653" stroke-width="1.5"/>
      
      <!-- Wheels -->
      <circle cx="135" cy="235" r="32" fill="#1A151E" stroke="#542653" stroke-width="4"/>
      <circle cx="135" cy="235" r="16" fill="#421E41"/>
      <circle cx="370" cy="235" r="32" fill="#1A151E" stroke="#542653" stroke-width="4"/>
      <circle cx="370" cy="235" r="16" fill="#421E41"/>

      <!-- Headlight -->
      <path d="M 430,175 L 455,178 L 445,195 L 425,190 Z" fill="#FDE047" opacity="0.85"/>

      <!-- Damage Bounding Box Overlay -->
      <rect x="360" y="160" width="115" height="75" fill="none" stroke="${severityColor}" stroke-width="2.5" stroke-dasharray="4 2"/>
      <rect x="360" y="140" width="115" height="20" fill="${severityColor}" opacity="0.9"/>
      <text x="365" y="154" fill="#FFFFFF" font-size="11" font-weight="bold" font-family="sans-serif">${highlightPart}</text>

      <!-- AI Vision Scan points -->
      <circle cx="430" cy="180" r="3" fill="#F08A7E"/>
      <circle cx="390" cy="200" r="3" fill="#F08A7E"/>
      <circle cx="450" cy="210" r="3" fill="#F08A7E"/>
      <circle cx="410" cy="170" r="3" fill="#F08A7E"/>
    </g>

    <!-- Header info banner -->
    <rect x="20" y="20" width="220" height="32" rx="4" fill="rgba(53, 27, 54, 0.85)" stroke="#542653" stroke-width="1"/>
    <text x="32" y="41" fill="#FBE2DE" font-size="12" font-family="sans-serif" font-weight="600">● AI VISION SCAN: ${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createDocPreviewSvg = (type: string, docNum: string, status: string = 'VERIFIED') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 540" width="100%" height="100%">
    <rect width="420" height="540" fill="#FFFFFF" rx="6"/>
    <rect x="15" y="15" width="390" height="510" fill="#FCF9F7" stroke="#EDE1EB" stroke-width="1.5" rx="4"/>
    <!-- Top Header -->
    <rect x="35" y="35" width="350" height="40" fill="#351B36" rx="3"/>
    <text x="50" y="60" fill="#FCF9F7" font-size="14" font-weight="bold" font-family="sans-serif">NATIONAL ASSURANCE CO. — ${type.toUpperCase()}</text>
    <text x="35" y="105" fill="#827580" font-size="11" font-family="sans-serif">DOCUMENT ID: ${docNum}</text>
    <line x1="35" y1="115" x2="385" y2="115" stroke="#EDE1EB" stroke-width="1.5"/>

    <!-- Document fields -->
    <rect x="35" y="130" width="120" height="12" fill="#EDE1EB" rx="2"/>
    <rect x="35" y="150" width="300" height="10" fill="#F5EFF4" rx="2"/>
    <rect x="35" y="170" width="260" height="10" fill="#F5EFF4" rx="2"/>

    <rect x="35" y="200" width="100" height="12" fill="#EDE1EB" rx="2"/>
    <rect x="35" y="220" width="320" height="10" fill="#F5EFF4" rx="2"/>
    <rect x="35" y="240" width="280" height="10" fill="#F5EFF4" rx="2"/>

    <!-- Watermark Stamp -->
    <g transform="translate(180, 360) rotate(-15)">
      <rect x="-80" y="-20" width="160" height="40" fill="none" stroke="#26966F" stroke-width="2" rx="4"/>
      <text x="-65" y="6" fill="#26966F" font-size="16" font-weight="800" font-family="sans-serif">OCR ${status}</text>
    </g>

    <!-- Bottom Barcode -->
    <g transform="translate(35, 460)">
      <rect x="0" y="0" width="4" height="30" fill="#292329"/>
      <rect x="6" y="0" width="2" height="30" fill="#292329"/>
      <rect x="10" y="0" width="6" height="30" fill="#292329"/>
      <rect x="18" y="0" width="3" height="30" fill="#292329"/>
      <rect x="23" y="0" width="5" height="30" fill="#292329"/>
      <rect x="30" y="0" width="2" height="30" fill="#292329"/>
      <rect x="34" y="0" width="7" height="30" fill="#292329"/>
      <rect x="44" y="0" width="3" height="30" fill="#292329"/>
      <text x="60" y="20" fill="#827580" font-size="11" font-family="sans-serif">AI-EXTRACTED ID: OCR-99824</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_CLAIMS: Claim[] = [
  {
    claimId: 'CLM-2026-01842',
    customer: {
      name: 'Arun Kumar',
      email: 'arun.kumar@gmail.com',
      phone: '+91 98452 11984',
      address: 'Plot 42, Anna Nagar, Chennai, Tamil Nadu',
    },
    policyNumber: 'POL-983742',
    policyCoverage: 'Comprehensive Private Car Gold',
    policyStatus: 'Active',
    policyLimit: 500000,
    vehicleNumber: 'TN 45 AB 1234',
    vehicleModel: '2023 Hyundai Creta SX (O)',
    accidentDate: '2026-09-10',
    accidentLocation: 'Mount Road Jn, Chennai',
    claimType: 'Vehicle Collision',
    incidentDescription: 'Frontal collision at intersection due to sudden braking by vehicle ahead. Front bumper cracked and left headlamp shattered.',
    claimedAmount: 48500,
    estimatedAmount: 48000,
    approvedAmount: 43000,
    deductible: 5000,
    fraudRisk: 12,
    overallConfidence: 94,
    currentAgent: 'decision',
    status: 'APPROVED',
    risk: 'Low',
    createdAt: '2026-09-11 08:30:00',
    updatedAt: '2026-09-12 08:42:21',
    agentResults: {
      orchestrator: {
        agentId: 'orchestrator',
        name: 'Claim Orchestrator',
        status: 'COMPLETED',
        confidence: 96,
        summary: 'Adaptive coordination finished. All 6 agents dispatched and verified with zero uncertainty remaining.',
        evidence: ['Policy verified active', 'License matches driver', 'Photos show consistent collision physics', 'Repair estimate matches baseline'],
        completedAt: '08:42:21',
      },
      document: {
        agentId: 'document',
        name: 'Document Agent',
        status: 'COMPLETED',
        confidence: 97,
        summary: 'All 4 mandatory documents verified. 27 key fields extracted with 97% average OCR confidence.',
        evidence: ['Policy POL-983742 verified', 'License DL-TN01-2018 verified', 'Registration TN 45 AB 1234 verified', 'Authorized repair garage invoice parsed'],
        completedAt: '08:42:10',
      },
      vision: {
        agentId: 'vision',
        name: 'Vision Agent',
        status: 'COMPLETED',
        confidence: 94,
        summary: 'Front bumper severe crack detected. Left headlamp cracked. Minor bonnet misalignment identified.',
        evidence: ['Front bumper severe crack (94% conf)', 'Left headlamp broken (91% conf)', 'Bonnet minor crease (86% conf)'],
        completedAt: '08:42:12',
      },
      policy: {
        agentId: 'policy',
        name: 'Policy Agent',
        status: 'COMPLETED',
        confidence: 99,
        summary: 'Policy active through 2027-03-15. Comprehensive coverage includes collision & zero depreciation.',
        evidence: ['Status: Active', 'Coverage limit ₹5,00,000', 'Accident date within validity period', 'Compulsory deductible: ₹5,000'],
        completedAt: '08:42:14',
      },
      fraud: {
        agentId: 'fraud',
        name: 'Fraud Agent',
        status: 'COMPLETED',
        confidence: 92,
        summary: 'Low fraud score: 12/100. No prior claims in 18 months. Metadata matches stated time and GPS.',
        evidence: ['No duplicate claim across industry database', 'Photo EXIF location aligns with Mount Road', 'Claim frequency normal (0 prior claims)', 'Identity KYC clean'],
        completedAt: '08:42:16',
      },
      estimation: {
        agentId: 'estimation',
        name: 'Estimation Agent',
        status: 'COMPLETED',
        confidence: 93,
        summary: 'Calculated baseline repair cost ₹48,000 vs repairer invoice ₹49,200 (2.4% variance within acceptable band).',
        evidence: ['Front bumper OEM assembly: ₹18,000', 'Left LED headlamp unit: ₹9,500', 'Bonnet repair & paint: ₹12,000', 'Authorized labor: ₹8,500'],
        completedAt: '08:42:19',
      },
      decision: {
        agentId: 'decision',
        name: 'Decision Agent',
        status: 'COMPLETED',
        confidence: 94,
        summary: 'AUTO APPROVAL GRANTED. Total eligible: ₹48,000 minus ₹5,000 deductible = ₹43,000 net settlement.',
        evidence: ['All 5 eligibility guardrails satisfied', 'Fraud risk below 20 threshold', 'Variance below 5%'],
        completedAt: '08:42:21',
      },
    },
    documents: [
      {
        id: 'DOC-01',
        name: 'Policy_POL983742.pdf',
        type: 'Policy',
        status: 'Verified',
        ocrConfidence: 98,
        fileSize: '1.8 MB',
        uploadDate: '2026-09-11',
        previewUrl: createDocPreviewSvg('Policy Schedule', 'POL-983742'),
        extractedFields: {
          'Policy Number': 'POL-983742',
          'Insured Name': 'Arun Kumar',
          'Period of Insurance': '16-Mar-2025 to 15-Mar-2027',
          'Vehicle Make/Model': 'Hyundai Creta SX(O)',
          'IDV (Sum Insured)': '₹14,50,000',
        },
      },
      {
        id: 'DOC-02',
        name: 'Driving_License_Arun.pdf',
        type: 'Driving License',
        status: 'Verified',
        ocrConfidence: 97,
        fileSize: '840 KB',
        uploadDate: '2026-09-11',
        previewUrl: createDocPreviewSvg('Driving License', 'DL-TN01-2018'),
        extractedFields: {
          'License No': 'TN-01-20180049281',
          'Name': 'Arun Kumar',
          'Class of Vehicle': 'LMV (Light Motor Vehicle)',
          'Validity': '2038-04-12',
        },
      },
      {
        id: 'DOC-03',
        name: 'Registration_Certificate_TN45.pdf',
        type: 'Registration',
        status: 'Verified',
        ocrConfidence: 96,
        fileSize: '1.2 MB',
        uploadDate: '2026-09-11',
        previewUrl: createDocPreviewSvg('RC Card', 'TN-45-AB-1234'),
        extractedFields: {
          'Reg No': 'TN 45 AB 1234',
          'Chassis No': 'MALC381CLPM19842',
          'Engine No': 'G4FJPM00912',
          'Registration Date': '2023-04-19',
        },
      },
      {
        id: 'DOC-04',
        name: 'Hyundai_Workshop_Estimate.pdf',
        type: 'Repair Invoice',
        status: 'Verified',
        ocrConfidence: 95,
        fileSize: '2.1 MB',
        uploadDate: '2026-09-11',
        previewUrl: createDocPreviewSvg('Workshop Estimate', 'EST-HYU-8921'),
        extractedFields: {
          'Workshop': 'Advaith Hyundai Authorized Center',
          'Estimated Total': '₹49,200',
          'Labor Charges': '₹8,500',
          'Parts Total': '₹40,700',
        },
      },
    ],
    accidentPhotos: [
      {
        id: 'IMG-01',
        angle: 'Front View',
        url: createCarDamageSvg('Front Collision Angle', 'Front Bumper: Severe Damage', '#F08A7E'),
        quality: 'Good',
        visionConfidence: 96,
        damageDetected: [
          {
            id: 'DMG-01',
            partName: 'Front Bumper Assembly',
            severity: 'Severe',
            confidence: 94,
            repairAction: 'Replace',
            estimatedCost: 18000,
          },
          {
            id: 'DMG-02',
            partName: 'Left Headlight Unit',
            severity: 'Moderate',
            confidence: 91,
            repairAction: 'Replace',
            estimatedCost: 9500,
          },
        ],
      },
      {
        id: 'IMG-02',
        angle: 'Close-up',
        url: createCarDamageSvg('Headlamp Close-up', 'Left Headlamp: Crushed Lens', '#D99A3D'),
        quality: 'Good',
        visionConfidence: 93,
        damageDetected: [
          {
            id: 'DMG-03',
            partName: 'Bonnet Front Edge',
            severity: 'Minor',
            confidence: 86,
            repairAction: 'Repair',
            estimatedCost: 12000,
          },
        ],
      },
    ],
    damageAssessment: [
      { id: 'D-1', partName: 'Front Bumper Assembly', severity: 'Severe', confidence: 94, repairAction: 'Replace', estimatedCost: 18000 },
      { id: 'D-2', partName: 'Left Headlight Assembly', severity: 'Moderate', confidence: 91, repairAction: 'Replace', estimatedCost: 9500 },
      { id: 'D-3', partName: 'Bonnet Dent & Paint', severity: 'Minor', confidence: 86, repairAction: 'Repair', estimatedCost: 12000 },
    ],
    fraudSignals: [
      { id: 'F-1', name: 'Duplicate Claim Check', passed: true, severity: 'Low', description: 'No previous claims logged for this vehicle in past 18 months.' },
      { id: 'F-2', name: 'Document Metadata Match', passed: true, severity: 'Low', description: 'All PDF generation dates match accident timeline.' },
      { id: 'F-3', name: 'Geo-Temporal Integrity', passed: true, severity: 'Low', description: 'Photo EXIF GPS corresponds to Chennai Mount Road location.' },
      { id: 'F-4', name: 'Estimate Variance Check', passed: true, severity: 'Low', description: 'Workshop estimate ₹49,200 is within 2.4% of AI baseline.' },
      { id: 'F-5', name: 'Driver Identity Verification', passed: true, severity: 'Low', description: 'License name and address match policyholder KYC exactly.' },
    ],
    estimationBreakdown: [
      { category: 'Parts', item: 'Front Bumper Skin & Grille Assy', cost: 18000, labor: 2000 },
      { category: 'Parts', item: 'Left LED Headlamp Unit OEM', cost: 9500, labor: 1500 },
      { category: 'Panel', item: 'Bonnet Dent Repair & Paint Refinish', cost: 12000, labor: 3500 },
      { category: 'Labor', item: 'Disassembly & Final Alignment', cost: 0, labor: 1500 },
    ],
    settlement: {
      claimedAmount: 48500,
      approvedAmount: 43000,
      deductible: 5000,
      payoutAmount: 43000,
      paymentMethod: 'Direct Bank Transfer (NEFT/RTGS)',
      bankAccount: 'HDFC Bank •••• 4832',
      transactionId: 'TXN-827364',
      paymentStatus: 'Processing',
    },
    orchestratorNotes: {
      highLevelReasoning: 'Claim understanding complete. All evidence verified. Straightforward collision with verified coverage and low risk. Routed to Auto-Approve.',
      availableEvidence: ['Policy Schedule', 'Driver License', 'Registration Certificate', 'Accident Photos (2 views)', 'Workshop Estimate'],
      requiredValidation: ['Policy coverage validity', 'KYC & Driver identity match', 'Physical damage corroboration', 'Fraud risk scoring', 'Repair estimate benchmarking'],
      currentAction: 'Auto-Approved. Awaiting payment authorization.',
      reasonForAction: 'All agent confidence scores exceed threshold (>90%) with zero fraud indicators.',
    },
    activityFeed: [
      { id: 'ACT-1', timestamp: '08:42:10', agentId: 'document', agentName: 'Document Agent', action: 'Verified 4 uploaded files. OCR Confidence: 97%.', type: 'success', confidence: 97 },
      { id: 'ACT-2', timestamp: '08:42:12', agentId: 'vision', agentName: 'Vision Agent', action: 'Completed vehicle scan. Front bumper severe damage identified.', type: 'info', confidence: 94 },
      { id: 'ACT-3', timestamp: '08:42:14', agentId: 'policy', agentName: 'Policy Agent', action: 'Policy verified active. Coverage: Comprehensive ₹5,00,000.', type: 'success', confidence: 99 },
      { id: 'ACT-4', timestamp: '08:42:16', agentId: 'fraud', agentName: 'Fraud Agent', action: 'Fraud screening completed. Score: 12/100 (Low Risk).', type: 'info', confidence: 92 },
      { id: 'ACT-5', timestamp: '08:42:19', agentId: 'estimation', agentName: 'Estimation Agent', action: 'Estimated repair cost: ₹48,000. Customer invoice variance: 2.4%.', type: 'info', confidence: 93, amount: 48000 },
      { id: 'ACT-6', timestamp: '08:42:21', agentId: 'decision', agentName: 'Decision Agent', action: 'Claim Auto-Approved. Net payout: ₹43,000.', type: 'decision', confidence: 94, amount: 43000 },
    ],
  },

  // Claim 2: Priya Sharma - FRAUD CASE (High Risk 87/100 -> Human Review)
  {
    claimId: 'CLM-2026-01903',
    customer: {
      name: 'Priya Sharma',
      email: 'priya.s91@outlook.com',
      phone: '+91 91234 56789',
      address: 'Indiranagar 100ft Road, Bengaluru, Karnataka',
    },
    policyNumber: 'POL-610294',
    policyCoverage: 'Zero Depreciation Gold Plan',
    policyStatus: 'Active',
    policyLimit: 800000,
    vehicleNumber: 'KA 03 MM 9941',
    vehicleModel: '2024 BMW 3 Series 330i',
    accidentDate: '2026-09-08',
    accidentLocation: 'Outer Ring Road, Bellandur, Bengaluru',
    claimType: 'Vehicle Collision',
    incidentDescription: 'High-speed undercarriage and front suspension impact after hitting a road divider at midnight.',
    claimedAmount: 215000,
    estimatedAmount: 142000,
    approvedAmount: 0,
    deductible: 10000,
    fraudRisk: 87,
    overallConfidence: 71,
    currentAgent: 'decision',
    status: 'HUMAN_REVIEW',
    risk: 'High',
    createdAt: '2026-09-09 14:15:00',
    updatedAt: '2026-09-12 08:15:00',
    agentResults: {
      orchestrator: {
        agentId: 'orchestrator',
        name: 'Claim Orchestrator',
        status: 'ESCALATED',
        confidence: 71,
        summary: 'High fraud signals and significant estimate variance detected. Orchestrator escalated to Senior Claims Assessor.',
        evidence: ['Fraud risk score 87/100', 'Chassis VIN mismatch in repair estimate', 'Repair quote 51.4% inflated above OEM baseline', '3 similar collision claims in 11 months'],
        requiredAction: 'Senior Claims Assessor manual physical inspection & forensic verification.',
        reasonForAction: 'Multiple critical fraud triggers exceeded auto-settlement safety thresholds.',
      },
      document: {
        agentId: 'document',
        name: 'Document Agent',
        status: 'COMPLETED',
        confidence: 89,
        summary: 'Documents parsed. Warning: Registration vehicle identification number differs by 2 digits from repair bill.',
        evidence: ['RC Chassis: WBA5R1C55PFP12948', 'Invoice Chassis: WBA5R1C55PFP12984 (Digit transposition)'],
      },
      vision: {
        agentId: 'vision',
        name: 'Vision Agent',
        status: 'COMPLETED',
        confidence: 61,
        summary: 'Photographs show preexisting rusted scratches along lower control arm inconsistent with fresh divider impact.',
        evidence: ['Rust oxidation on suspension tie rod indicates aged damage', 'Angle lighting obscured undercarriage extent'],
      },
      policy: {
        agentId: 'policy',
        name: 'Policy Agent',
        status: 'COMPLETED',
        confidence: 95,
        summary: 'Policy active, but claim frequency endorsement triggered (3 claims within 365 days).',
        evidence: ['Policy active', 'Policy limit ₹8,00,000', 'Prior claims: 2 in past 11 months totaling ₹3,40,000'],
      },
      fraud: {
        agentId: 'fraud',
        name: 'Fraud Agent',
        status: 'ESCALATED',
        confidence: 94,
        summary: 'HIGH RISK: 87 / 100. Vehicle number discrepancy, suspicious repeat claim cluster, and quote inflation.',
        evidence: ['⚠ Vehicle chassis number mismatch', '⚠ Unusual claim frequency (3rd claim in 11 months)', '⚠ Repair quote is 51.4% above AI benchmark', '⚠ EXIF metadata shows photo taken 4 days prior to alleged incident date'],
      },
      estimation: {
        agentId: 'estimation',
        name: 'Estimation Agent',
        status: 'COMPLETED',
        confidence: 78,
        summary: 'AI benchmark estimate ₹1,42,000 vs Claimed invoice ₹2,15,000 (+₹73,000 unexplained markup).',
        evidence: ['Suspension arm replacement: AI ₹68,000 vs Bill ₹1,10,000', 'Unjustified transmission diagnostic charge ₹25,000'],
      },
      decision: {
        agentId: 'decision',
        name: 'Decision Agent',
        status: 'ESCALATED',
        confidence: 87,
        summary: 'ESCALATE TO HUMAN REVIEW. High risk of fraudulent inflation and vehicle identity discrepancy.',
        evidence: ['Auto-approval denied by Fraud & Risk Guardrail #3'],
      },
    },
    documents: [
      {
        id: 'DOC-11',
        name: 'BMW_Policy_Schedule.pdf',
        type: 'Policy',
        status: 'Verified',
        ocrConfidence: 98,
        fileSize: '2.4 MB',
        uploadDate: '2026-09-09',
        previewUrl: createDocPreviewSvg('Policy Schedule', 'POL-610294'),
        extractedFields: {
          'Policy Number': 'POL-610294',
          'Insured Name': 'Priya Sharma',
          'Coverage': 'Zero Depreciation Gold Plan',
          'Sum Insured': '₹48,00,000',
        },
      },
      {
        id: 'DOC-12',
        name: 'Invoice_Express_Motors.pdf',
        type: 'Repair Invoice',
        status: 'Low Quality',
        ocrConfidence: 74,
        fileSize: '3.1 MB',
        uploadDate: '2026-09-09',
        previewUrl: createDocPreviewSvg('Repair Invoice', 'INV-EXPR-992', 'FLAGGED'),
        extractedFields: {
          'Repairer': 'Express Supercars Workshop',
          'Quoted Amount': '₹2,15,000',
          'Chassis Match': 'MISMATCH (WBA5R1C55PFP12984)',
        },
      },
    ],
    accidentPhotos: [
      {
        id: 'IMG-11',
        angle: 'Front View',
        url: createCarDamageSvg('Front Subframe Damage', 'Suspension: Pre-existing Oxidation', '#C94B58'),
        quality: 'Fair',
        visionConfidence: 61,
        damageDetected: [
          { id: 'DMG-11', partName: 'Front Lower Control Arm', severity: 'Severe', confidence: 61, repairAction: 'Replace', estimatedCost: 68000 },
          { id: 'DMG-12', partName: 'Steering Knuckle', severity: 'Moderate', confidence: 65, repairAction: 'Replace', estimatedCost: 45000 },
        ],
      },
    ],
    damageAssessment: [
      { id: 'D-11', partName: 'Front Lower Control Arm', severity: 'Severe', confidence: 61, repairAction: 'Replace', estimatedCost: 68000 },
      { id: 'D-12', partName: 'Steering Knuckle & Hub', severity: 'Moderate', confidence: 65, repairAction: 'Replace', estimatedCost: 45000 },
      { id: 'D-13', partName: 'Subframe Straightening', severity: 'Moderate', confidence: 70, repairAction: 'Repair', estimatedCost: 29000 },
    ],
    fraudSignals: [
      { id: 'F-11', name: 'Vehicle Chassis Discrepancy', passed: false, severity: 'High', description: 'Chassis VIN on garage estimate differs from official registration.' },
      { id: 'F-12', name: 'Unusual Claim Frequency', passed: false, severity: 'High', description: 'Third total-subframe collision claim in past 11 calendar months.' },
      { id: 'F-13', name: 'Invoice Inflation Variance', passed: false, severity: 'High', description: 'Claimed ₹2,15,000 is 51.4% higher than verified OEM catalog prices.' },
      { id: 'F-14', name: 'EXIF Timestamp Conflict', passed: false, severity: 'Medium', description: 'Accident photo timestamp is 4 days older than reported accident date.' },
    ],
    estimationBreakdown: [
      { category: 'Suspension', item: 'Front Lower Wishbone OEM', cost: 68000, labor: 9000 },
      { category: 'Steering', item: 'Hub Carrier & Knuckle Assembly', cost: 45000, labor: 6000 },
      { category: 'Chassis', item: 'Cross-member Realignment', cost: 14000, labor: 15000 },
    ],
    orchestratorNotes: {
      highLevelReasoning: 'Escalated to human claims officer. Fraud risk 87/100 with VIN mismatch and severe invoice markup.',
      availableEvidence: ['Policy Schedule', 'Repair Estimate', 'Photo (1 angle)'],
      requiredValidation: ['Physical vehicle forensic inspection', 'Garage audit', 'Accident date confirmation'],
      currentAction: 'Pending Claims Officer review and adjudication.',
      reasonForAction: 'Exceeded automated fraud safety threshold (>40).',
    },
    humanReviewNotes: {
      flaggedBy: 'AI Fraud Agent & Decision Engine',
      flagReason: 'Fraud Score 87/100: Chassis VIN mismatch and +₹73,000 cost inflation',
    },
    activityFeed: [
      { id: 'ACT-11', timestamp: '08:14:02', agentId: 'document', agentName: 'Document Agent', action: 'Flagged VIN mismatch between RC and Repair Bill.', type: 'alert', confidence: 89 },
      { id: 'ACT-12', timestamp: '08:14:15', agentId: 'fraud', agentName: 'Fraud Agent', action: 'ALERT: Fraud risk score 87 / 100.', type: 'alert', confidence: 94 },
      { id: 'ACT-13', timestamp: '08:14:30', agentId: 'decision', agentName: 'Decision Agent', action: 'Escalated to Human Claims Assessor queue.', type: 'warning' },
    ],
  },

  // Claim 3: Vikramaditya Rao - UNCERTAIN / LOW-CONFIDENCE (Vision 31% -> Customer Loop)
  {
    claimId: 'CLM-2026-01775',
    customer: {
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@techmail.com',
      phone: '+91 99887 76655',
      address: 'Banjara Hills, Hyderabad, Telangana',
    },
    policyNumber: 'POL-441920',
    policyCoverage: 'Comprehensive Auto Protection',
    policyStatus: 'Active',
    policyLimit: 600000,
    vehicleNumber: 'TS 09 EQ 4481',
    vehicleModel: '2022 Honda City ZX',
    accidentDate: '2026-09-11',
    accidentLocation: 'Jubilee Hills Check Post, Hyderabad',
    claimType: 'Vehicle Collision',
    incidentDescription: 'Scraped parking pillar while reversing in basement parking garage. Low lighting conditions.',
    claimedAmount: 24000,
    estimatedAmount: 22500,
    approvedAmount: 0,
    deductible: 2000,
    fraudRisk: 14,
    overallConfidence: 42,
    currentAgent: 'vision',
    status: 'AWAITING_CUSTOMER',
    risk: 'Low',
    createdAt: '2026-09-11 19:40:00',
    updatedAt: '2026-09-12 07:55:00',
    agentResults: {
      orchestrator: {
        agentId: 'orchestrator',
        name: 'Claim Orchestrator',
        status: 'NEEDS_INFORMATION',
        confidence: 42,
        summary: 'Vision Agent low confidence (31%) due to dark underexposed image. Customer requested to upload clearer front/side view.',
        evidence: ['Policy verified active', 'Low quality blurry image provided', 'Cannot reliably identify damaged components'],
        requiredAction: 'Please upload a clear photograph of the damaged front bumper in daylight.',
        reasonForAction: 'System refuses to hallucinate damage when image quality falls below 50% threshold.',
      },
      document: {
        agentId: 'document',
        name: 'Document Agent',
        status: 'COMPLETED',
        confidence: 96,
        summary: 'Policy and Registration validated successfully.',
        evidence: ['Policy POL-441920 verified', 'RC TS 09 EQ 4481 verified'],
      },
      vision: {
        agentId: 'vision',
        name: 'Vision Agent',
        status: 'LOW_CONFIDENCE',
        confidence: 31,
        summary: '⚠ LOW CONFIDENCE (31%). Underexposed and motion blurred. Unable to distinguish shadow from metal deformation.',
        evidence: ['Severe grain and motion blur detected', 'Dynamic range insufficient for component segmentation'],
        requiredAction: 'Customer must provide clearer front view in daylight.',
        reasonForAction: 'Image clarity insufficient for confident damage classification.',
      },
      policy: {
        agentId: 'policy',
        name: 'Policy Agent',
        status: 'COMPLETED',
        confidence: 98,
        summary: 'Policy active. Parking damage fully covered under Section II.',
        evidence: ['Active policy', 'Comprehensive cover'],
      },
      fraud: {
        agentId: 'fraud',
        name: 'Fraud Agent',
        status: 'IDLE',
        confidence: 0,
        summary: 'Awaiting vision component verification before fraud assessment.',
        evidence: [],
      },
      estimation: {
        agentId: 'estimation',
        name: 'Estimation Agent',
        status: 'IDLE',
        confidence: 0,
        summary: 'Awaiting verified parts breakdown from Vision Agent.',
        evidence: [],
      },
      decision: {
        agentId: 'decision',
        name: 'Decision Agent',
        status: 'IDLE',
        confidence: 0,
        summary: 'Pending customer evidence response.',
        evidence: [],
      },
    },
    documents: [
      {
        id: 'DOC-21',
        name: 'Policy_City_441920.pdf',
        type: 'Policy',
        status: 'Verified',
        ocrConfidence: 96,
        fileSize: '1.5 MB',
        uploadDate: '2026-09-11',
        previewUrl: createDocPreviewSvg('Policy Certificate', 'POL-441920'),
        extractedFields: {
          'Policy Number': 'POL-441920',
          'Insured Name': 'Vikramaditya Rao',
          'Coverage': 'Comprehensive Protection',
          'Vehicle': 'Honda City ZX',
        },
      },
    ],
    accidentPhotos: [
      {
        id: 'IMG-21',
        angle: 'Front View',
        url: createCarDamageSvg('Dark Basement Photo (Low Light)', 'Blurry / Shadowed Area', '#D99A3D'),
        quality: 'Insufficient',
        visionConfidence: 31,
        damageDetected: [],
      },
    ],
    damageAssessment: [],
    fraudSignals: [
      { id: 'F-21', name: 'Policy Standing', passed: true, severity: 'Low', description: 'Active customer for 4 years with no claims history.' },
    ],
    estimationBreakdown: [],
    orchestratorNotes: {
      highLevelReasoning: 'Claim paused at Vision stage. The system will never fabricate an answer when confidence is low. Requesting clear daylight photo from customer.',
      availableEvidence: ['Policy Schedule', '1 Underexposed Garage Photo'],
      requiredValidation: ['Clear daylight photograph of front bumper'],
      currentAction: 'Awaiting Customer Response',
      reasonForAction: 'Vision confidence 31% is below minimum 75% assessment threshold.',
    },
    activityFeed: [
      { id: 'ACT-21', timestamp: '07:54:12', agentId: 'document', agentName: 'Document Agent', action: 'Policy verified successfully.', type: 'success', confidence: 96 },
      { id: 'ACT-22', timestamp: '07:54:30', agentId: 'vision', agentName: 'Vision Agent', action: 'LOW CONFIDENCE (31%): Image quality insufficient to classify damage.', type: 'warning', confidence: 31 },
      { id: 'ACT-23', timestamp: '07:55:00', agentId: 'orchestrator', agentName: 'Claim Orchestrator', action: 'Triggered customer notification: Please upload clearer daylight photo.', type: 'alert' },
    ],
  },

  // Claim 4: Rajeshwari Patel - DYNAMIC ROUTING / EXPIRED POLICY DEMO (Policy Agent Fails -> Prunes Vision/Fraud/Estimation)
  {
    claimId: 'CLM-2026-01640',
    customer: {
      name: 'Rajeshwari Patel',
      email: 'r.patel@ahmedabadchem.com',
      phone: '+91 97123 44556',
      address: 'SG Highway, Bodakdev, Ahmedabad, Gujarat',
    },
    policyNumber: 'POL-108821',
    policyCoverage: 'Standard Third Party & Own Damage',
    policyStatus: 'Expired',
    policyLimit: 450000,
    vehicleNumber: 'GJ 01 XX 7712',
    vehicleModel: '2021 Maruti Suzuki Dzire VXI',
    accidentDate: '2026-09-07',
    accidentLocation: 'SG Highway, Ahmedabad',
    claimType: 'Vehicle Collision',
    incidentDescription: 'Side contact with auto-rickshaw during peak hour traffic. Right doors scraped.',
    claimedAmount: 55000,
    estimatedAmount: 0,
    approvedAmount: 0,
    deductible: 1500,
    fraudRisk: 22,
    overallConfidence: 98,
    currentAgent: 'decision',
    status: 'REJECTED',
    risk: 'Low',
    createdAt: '2026-09-08 10:20:00',
    updatedAt: '2026-09-08 10:22:15',
    agentResults: {
      orchestrator: {
        agentId: 'orchestrator',
        name: 'Claim Orchestrator',
        status: 'COMPLETED',
        confidence: 98,
        summary: 'WORKFLOW OPTIMIZED: Policy agent detected policy expired on 2026-08-15. Vision, Fraud, and Estimation stages skipped to save compute and eliminate delay.',
        evidence: ['Policy expired 23 days prior to accident date', 'Direct route to Decision Agent for formal rejection notice'],
        isOptimized: true,
        optimizationReason: 'Downstream damage assessment skipped because insurance eligibility failed at baseline.',
      },
      document: {
        agentId: 'document',
        name: 'Document Agent',
        status: 'COMPLETED',
        confidence: 96,
        summary: 'Documents parsed. Policy record POL-108821 identified.',
        evidence: ['Policy document submitted', 'RC submitted'],
      },
      policy: {
        agentId: 'policy',
        name: 'Policy Agent',
        status: 'FAILED',
        confidence: 99,
        summary: 'POLICY INELIGIBLE: Expired on 15-Aug-2026. Accident occurred on 07-Sep-2026 (Grace period lapsed).',
        evidence: ['Policy expiration: 15-Aug-2026', 'Accident date: 07-Sep-2026 (23 days uninsured)'],
        requiredAction: 'Issue formal rejection notice with policy renewal proposal.',
        reasonForAction: 'No active risk coverage on date of loss.',
      },
      vision: {
        agentId: 'vision',
        name: 'Vision Agent',
        status: 'SKIPPED',
        confidence: 0,
        summary: 'SKIPPED: Not required due to policy ineligibility.',
        evidence: [],
      },
      fraud: {
        agentId: 'fraud',
        name: 'Fraud Agent',
        status: 'SKIPPED',
        confidence: 0,
        summary: 'SKIPPED: Not required due to policy ineligibility.',
        evidence: [],
      },
      estimation: {
        agentId: 'estimation',
        name: 'Estimation Agent',
        status: 'SKIPPED',
        confidence: 0,
        summary: 'SKIPPED: Not required due to policy ineligibility.',
        evidence: [],
      },
      decision: {
        agentId: 'decision',
        name: 'Decision Agent',
        status: 'COMPLETED',
        confidence: 99,
        summary: 'CLAIM REJECTED: Coverage was not active at the time of loss.',
        evidence: ['Policy expired before incident date'],
      },
    },
    documents: [
      {
        id: 'DOC-31',
        name: 'Expired_Policy_Schedule.pdf',
        type: 'Policy',
        status: 'Verified',
        ocrConfidence: 99,
        fileSize: '1.4 MB',
        uploadDate: '2026-09-08',
        previewUrl: createDocPreviewSvg('Policy Schedule (Expired)', 'POL-108821', 'EXPIRED'),
        extractedFields: {
          'Policy Number': 'POL-108821',
          'Insured Name': 'Rajeshwari Patel',
          'Expiry Date': '15-Aug-2026 (Lapsed)',
        },
      },
    ],
    accidentPhotos: [],
    damageAssessment: [],
    fraudSignals: [],
    estimationBreakdown: [],
    orchestratorNotes: {
      highLevelReasoning: 'WORKFLOW OPTIMIZED: Policy expired. The system intentionally skipped Vision, Fraud, and Estimation to deliver an instant, evidence-backed decision in 2.3 seconds.',
      availableEvidence: ['Expired Policy Document'],
      requiredValidation: ['Policy coverage dates'],
      currentAction: 'Rejection notice issued.',
      reasonForAction: 'Policy lapsed before accident date.',
      isOptimized: true,
      optimizationReason: 'Zero compute wasted on damage assessment when policy coverage is legally void.',
    },
    activityFeed: [
      { id: 'ACT-31', timestamp: '10:21:05', agentId: 'document', agentName: 'Document Agent', action: 'Extracted policy expiry date: 15-Aug-2026.', type: 'info', confidence: 99 },
      { id: 'ACT-32', timestamp: '10:21:18', agentId: 'policy', agentName: 'Policy Agent', action: 'POLICY EXPIRED: Accident occurred outside coverage dates.', type: 'alert', confidence: 99 },
      { id: 'ACT-33', timestamp: '10:21:20', agentId: 'orchestrator', agentName: 'Claim Orchestrator', action: 'Dynamic routing: Pruned Vision & Estimation agents. Direct to Decision.', type: 'warning' },
      { id: 'ACT-34', timestamp: '10:22:15', agentId: 'decision', agentName: 'Decision Agent', action: 'Formal Rejection letter generated and sent to customer.', type: 'decision', confidence: 99 },
    ],
  },

  // Claim 5: Sneha Sengupta - SETTLED / PAID (Full settlement proof)
  {
    claimId: 'CLM-2026-01511',
    customer: {
      name: 'Sneha Sengupta',
      email: 'sneha.s@kolkatadesign.com',
      phone: '+91 98310 98765',
      address: 'Salt Lake Sector V, Kolkata, West Bengal',
    },
    policyNumber: 'POL-772910',
    policyCoverage: 'Zero Depreciation Comprehensive',
    policyStatus: 'Active',
    policyLimit: 400000,
    vehicleNumber: 'WB 06 H 2911',
    vehicleModel: '2023 Tata Nexon EV Prime',
    accidentDate: '2026-09-04',
    accidentLocation: 'EM Bypass, Kolkata',
    claimType: 'Vehicle Collision',
    incidentDescription: 'Scratched side panel and rear bumper by two-wheeler in tight moving traffic.',
    claimedAmount: 36000,
    estimatedAmount: 34500,
    approvedAmount: 31500,
    deductible: 3000,
    fraudRisk: 8,
    overallConfidence: 96,
    currentAgent: 'decision',
    status: 'PAID',
    risk: 'Low',
    createdAt: '2026-09-05 11:10:00',
    updatedAt: '2026-09-06 16:30:00',
    agentResults: {
      orchestrator: { agentId: 'orchestrator', name: 'Claim Orchestrator', status: 'COMPLETED', confidence: 98, summary: 'Settlement finalized and paid into customer bank account.', evidence: ['Payment transaction confirmed'] },
      document: { agentId: 'document', name: 'Document Agent', status: 'COMPLETED', confidence: 98, summary: 'Documents verified.', evidence: ['Full documents valid'] },
      vision: { agentId: 'vision', name: 'Vision Agent', status: 'COMPLETED', confidence: 95, summary: 'Rear bumper and side panel scratch confirmed.', evidence: ['Clear scratch along quarter panel'] },
      policy: { agentId: 'policy', name: 'Policy Agent', status: 'COMPLETED', confidence: 99, summary: 'Coverage verified.', evidence: ['Comprehensive cover'] },
      fraud: { agentId: 'fraud', name: 'Fraud Agent', status: 'COMPLETED', confidence: 96, summary: 'Low fraud score (8/100).', evidence: ['Zero risk indicators'] },
      estimation: { agentId: 'estimation', name: 'Estimation Agent', status: 'COMPLETED', confidence: 95, summary: 'Baseline cost ₹34,500.', evidence: ['OEM paint refinish'] },
      decision: { agentId: 'decision', name: 'Decision Agent', status: 'COMPLETED', confidence: 96, summary: 'Approved & Settled: ₹31,500.', evidence: ['Instant settlement authorized'] },
    },
    documents: [],
    accidentPhotos: [],
    damageAssessment: [],
    fraudSignals: [],
    estimationBreakdown: [],
    settlement: {
      claimedAmount: 36000,
      approvedAmount: 31500,
      deductible: 3000,
      payoutAmount: 31500,
      paymentMethod: 'Instant UPI / NEFT',
      bankAccount: 'ICICI Bank •••• 9104',
      transactionId: 'TXN-991204',
      paymentStatus: 'Completed',
      processedAt: '2026-09-06 16:30:00',
    },
    activityFeed: [
      { id: 'ACT-51', timestamp: '16:29:40', agentId: 'decision', agentName: 'Decision Agent', action: 'Approved claim for ₹31,500 payout.', type: 'decision', confidence: 96, amount: 31500 },
      { id: 'ACT-52', timestamp: '16:30:00', action: 'Payment transferred via NEFT. Transaction ID: TXN-991204.', type: 'success', amount: 31500 },
    ],
  },
  // Claim 6: Mohammed Imran - Medium Risk Human Review
  {
    claimId: 'CLM-2026-01490',
    customer: {
      name: 'Mohammed Imran',
      email: 'imran.m@transportlogistics.in',
      phone: '+91 98200 12345',
      address: 'Andheri East, Mumbai, Maharashtra',
    },
    policyNumber: 'POL-550912',
    policyCoverage: 'Commercial Fleet Protector',
    policyStatus: 'Active',
    policyLimit: 1200000,
    vehicleNumber: 'MH 02 CR 8801',
    vehicleModel: '2023 Ashok Leyland Bada Dost',
    accidentDate: '2026-09-06',
    accidentLocation: 'Western Express Highway, Goregaon',
    claimType: 'Vehicle Collision',
    incidentDescription: 'Multiple vehicle pileup during heavy rain on highway. Front grille and radiator crushed.',
    claimedAmount: 185000,
    estimatedAmount: 160000,
    approvedAmount: 0,
    deductible: 8000,
    fraudRisk: 55,
    overallConfidence: 74,
    currentAgent: 'decision',
    status: 'HUMAN_REVIEW',
    risk: 'Medium',
    createdAt: '2026-09-07 09:00:00',
    updatedAt: '2026-09-11 11:20:00',
    agentResults: {
      orchestrator: { agentId: 'orchestrator', name: 'Claim Orchestrator', status: 'ESCALATED', confidence: 74, summary: 'Medium risk: Multiple vehicle accident requires assessor inspection of radiator assembly.', evidence: ['Multi-vehicle pileup', 'Radiator replacement required'] },
      document: { agentId: 'document', name: 'Document Agent', status: 'COMPLETED', confidence: 92, summary: 'Commercial documents verified.', evidence: ['Permit & Fitness valid'] },
      vision: { agentId: 'vision', name: 'Vision Agent', status: 'COMPLETED', confidence: 79, summary: 'Front grille & radiator assembly damage detected.', evidence: ['Crushed radiator fins'] },
      policy: { agentId: 'policy', name: 'Policy Agent', status: 'COMPLETED', confidence: 96, summary: 'Fleet policy active.', evidence: ['Valid commercial cover'] },
      fraud: { agentId: 'fraud', name: 'Fraud Agent', status: 'COMPLETED', confidence: 76, summary: 'Medium fraud risk 55/100 due to third-party liability overlap.', evidence: ['Multi-vehicle claim correlation pending'] },
      estimation: { agentId: 'estimation', name: 'Estimation Agent', status: 'COMPLETED', confidence: 82, summary: 'AI baseline ₹1,60,000 vs Claimed ₹1,85,000.', evidence: ['Radiator and front apron replacement'] },
      decision: { agentId: 'decision', name: 'Decision Agent', status: 'ESCALATED', confidence: 74, summary: 'Escalated to Claims Assessor for commercial fleet verification.', evidence: ['Commercial vehicle multi-party collision'] },
    },
    documents: [],
    accidentPhotos: [],
    damageAssessment: [],
    fraudSignals: [
      { id: 'F-61', name: 'Multi-party cross check', passed: false, severity: 'Medium', description: 'Cross-verifying police FIR report for 3-vehicle pileup.' },
    ],
    estimationBreakdown: [],
    activityFeed: [],
  },
];
