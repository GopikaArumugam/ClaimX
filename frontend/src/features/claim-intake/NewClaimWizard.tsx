import React, { useState } from 'react';
import { Claim, ClaimDocument, AccidentPhoto } from '../../types/claims';
import { claimsService } from '../../services/claimsService';
import {
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2,
  ShieldCheck,
  FileCheck,
  Eye,
} from 'lucide-react';

interface NewClaimWizardProps {
  onClaimSubmitted: (claimId: string) => void;
  onCancel: () => void;
}

export const NewClaimWizard: React.FC<NewClaimWizardProps> = ({
  onClaimSubmitted,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [policyNumber, setPolicyNumber] = useState('POL-983742');
  const [vehicleNumber, setVehicleNumber] = useState('TN 45 AB 1234');
  const [customerName, setCustomerName] = useState('Arun Kumar');
  const [customerEmail, setCustomerEmail] = useState('arun.kumar@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('+91 98452 11984');
  const [accidentDate, setAccidentDate] = useState('2026-09-10');
  const [accidentLocation, setAccidentLocation] = useState('Mount Road Jn, Chennai');
  const [claimType, setClaimType] = useState<Claim['claimType']>('Vehicle Collision');
  const [claimedAmount, setClaimedAmount] = useState<number>(48500);
  const [incidentDescription, setIncidentDescription] = useState(
    'Frontal collision at traffic signal due to vehicle ahead braking unexpectedly. Front bumper cracked and left headlight broken.'
  );

  // Documents
  const [documents, setDocuments] = useState<ClaimDocument[]>([
    {
      id: 'DOC-SUB-1',
      name: 'Policy_Schedule_National.pdf',
      type: 'Policy',
      status: 'Verified',
      ocrConfidence: 98,
      fileSize: '1.8 MB',
      uploadDate: '2026-09-12',
      extractedFields: { 'Policy No': 'POL-983742', 'Insured': 'Arun Kumar', 'Validity': '2027-03-15' },
    },
    {
      id: 'DOC-SUB-2',
      name: 'Driving_License_AK.pdf',
      type: 'Driving License',
      status: 'Verified',
      ocrConfidence: 97,
      fileSize: '780 KB',
      uploadDate: '2026-09-12',
      extractedFields: { 'License No': 'TN-01-20180049281', 'Class': 'LMV' },
    },
    {
      id: 'DOC-SUB-3',
      name: 'Registration_Certificate_TN45.pdf',
      type: 'Registration',
      status: 'Verified',
      ocrConfidence: 96,
      fileSize: '1.2 MB',
      uploadDate: '2026-09-12',
      extractedFields: { 'Reg No': 'TN 45 AB 1234', 'Make': 'Hyundai Creta' },
    },
    {
      id: 'DOC-SUB-4',
      name: 'Repair_Estimate_Advaith.pdf',
      type: 'Repair Invoice',
      status: 'Verified',
      ocrConfidence: 95,
      fileSize: '2.4 MB',
      uploadDate: '2026-09-12',
      extractedFields: { 'Workshop Total': '₹49,200', 'Labor': '₹8,500' },
    },
  ]);

  // Photos
  const [photos, setPhotos] = useState<AccidentPhoto[]>([
    {
      id: 'P-1',
      angle: 'Front View',
      url: '',
      quality: 'Good',
      visionConfidence: 96,
      damageDetected: [],
    },
    {
      id: 'P-2',
      angle: 'Close-up',
      url: '',
      quality: 'Good',
      visionConfidence: 94,
      damageDetected: [],
    },
  ]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!policyNumber.trim()) errors.policyNumber = 'Policy number is required';
    if (!vehicleNumber.trim()) errors.vehicleNumber = 'Vehicle number is required';
    if (!customerName.trim()) errors.customerName = 'Customer name is required';
    if (!accidentDate) errors.accidentDate = 'Accident date is required';
    if (!accidentLocation.trim()) errors.accidentLocation = 'Accident location is required';
    if (!incidentDescription.trim() || incidentDescription.length < 15) {
      errors.incidentDescription = 'Please provide a detailed incident description (min 15 chars)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => (s + 1) as any);
  };

  const handleBack = () => {
    setStep((s) => (s - 1) as any);
  };

  const handleStartAssessment = () => {
    const claimId = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newClaim: Claim = {
      claimId,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: accidentLocation,
      },
      policyNumber,
      policyCoverage: 'Comprehensive Own Damage Gold',
      policyStatus: 'Active',
      policyLimit: 500000,
      vehicleNumber,
      vehicleModel: '2023 Hyundai Creta SX (O)',
      accidentDate,
      accidentLocation,
      claimType,
      incidentDescription,
      claimedAmount,
      estimatedAmount: claimedAmount - 500,
      approvedAmount: 0,
      deductible: 5000,
      fraudRisk: 12,
      overallConfidence: 94,
      currentAgent: 'orchestrator',
      status: 'ORCHESTRATING',
      risk: 'Low',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      agentResults: {
        orchestrator: {
          agentId: 'orchestrator',
          name: 'Claim Orchestrator',
          status: 'PROCESSING',
          confidence: 96,
          summary: 'Analyzing newly submitted evidence and dynamically coordinating specialized agents...',
          evidence: ['Claim intake verified', '4 documents ingested', '2 accident photos received'],
        },
        document: {
          agentId: 'document',
          name: 'Document Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Scheduled for OCR extraction.',
          evidence: [],
        },
        vision: {
          agentId: 'vision',
          name: 'Vision Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Scheduled for damage segmentation.',
          evidence: [],
        },
        policy: {
          agentId: 'policy',
          name: 'Policy Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Scheduled for coverage validation.',
          evidence: [],
        },
        fraud: {
          agentId: 'fraud',
          name: 'Fraud Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Scheduled for risk scoring.',
          evidence: [],
        },
        estimation: {
          agentId: 'estimation',
          name: 'Estimation Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Scheduled for cost estimation.',
          evidence: [],
        },
        decision: {
          agentId: 'decision',
          name: 'Decision Agent',
          status: 'IDLE',
          confidence: 0,
          summary: 'Scheduled for final adjudication.',
          evidence: [],
        },
      },
      documents,
      accidentPhotos: photos,
      damageAssessment: [
        { id: 'd-new-1', partName: 'Front Bumper Assembly', severity: 'Severe', confidence: 94, repairAction: 'Replace', estimatedCost: 18000 },
        { id: 'd-new-2', partName: 'Left Headlight Unit', severity: 'Moderate', confidence: 91, repairAction: 'Replace', estimatedCost: 9500 },
      ],
      fraudSignals: [
        { id: 'f-new-1', name: 'Duplicate Claim Check', passed: true, severity: 'Low', description: 'Zero duplicate claims in industry register' },
        { id: 'f-new-2', name: 'Identity KYC Check', passed: true, severity: 'Low', description: 'Insured name matches registration document' },
      ],
      estimationBreakdown: [
        { category: 'Parts', item: 'Front Bumper Assembly OEM', cost: 18000, labor: 2000 },
        { category: 'Parts', item: 'Left LED Headlamp OEM', cost: 9500, labor: 1500 },
        { category: 'Labor', item: 'Bumper Paint & Fitting', cost: 12000, labor: 5000 },
      ],
      orchestratorNotes: {
        highLevelReasoning: 'Newly submitted claim received. Ingesting customer documents and initiating multi-agent validation graph.',
        availableEvidence: ['4 Verified Documents', '2 Damage Photographs'],
        requiredValidation: ['Policy coverage validity', 'Damage classification', 'Fraud scoring', 'Repair estimate'],
        currentAction: 'Running Document & Vision Agents concurrently',
        reasonForAction: 'Standard collision claim intake protocol initiated.',
      },
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          agentId: 'orchestrator',
          agentName: 'Claim Orchestrator',
          action: `Claim ${claimId} successfully submitted by policyholder ${customerName}.`,
          type: 'info',
        },
      ],
    };

    claimsService.createClaim(newClaim);
    onClaimSubmitted(claimId);
  };

  const handleAddPhoto = (angle: AccidentPhoto['angle']) => {
    const newPhoto: AccidentPhoto = {
      id: `P-${Date.now()}`,
      angle,
      url: '',
      quality: 'Good',
      visionConfidence: 95,
      damageDetected: [],
    };
    setPhotos([...photos, newPhoto]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Wizard Header */}
      <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-peach-light text-plum-deep text-[11px] font-bold border border-peach-primary/30">
                Adaptive Intake
              </span>
              <span className="text-ink-muted text-xs">Step {step} of 4</span>
            </div>
            <h1 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans">
              Submit a New Claim
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Our AI automatically determines what information is required for your specific claim.
            </p>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  step === s
                    ? 'bg-peach-primary text-plum-deep shadow-glow-peach ring-2 ring-peach-primary/30'
                    : step > s
                    ? 'bg-plum-deep text-white'
                    : 'bg-plum-light text-ink-secondary'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: Claim Information */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft space-y-5 animate-slide-up">
          <div className="border-b border-plum-light pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
              1. Incident & Vehicle Information
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Provide vehicle details and the circumstances of the incident
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Policy Number *
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-mono focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                placeholder="e.g. POL-983742"
              />
              {formErrors.policyNumber && (
                <p className="text-[11px] text-semantic-danger mt-1">{formErrors.policyNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Vehicle Registration Number *
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-mono focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary uppercase"
                placeholder="e.g. TN 45 AB 1234"
              />
              {formErrors.vehicleNumber && (
                <p className="text-[11px] text-semantic-danger mt-1">{formErrors.vehicleNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Policyholder Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                placeholder="Full Legal Name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Claim Type *
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
              >
                <option value="Vehicle Collision">Vehicle Collision</option>
                <option value="Vehicle Theft">Vehicle Theft</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Windshield Damage">Windshield Damage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Accident Date *
              </label>
              <input
                type="date"
                value={accidentDate}
                onChange={(e) => setAccidentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Accident Location *
              </label>
              <input
                type="text"
                value={accidentLocation}
                onChange={(e) => setAccidentLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                placeholder="Street / City / Landmark"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Estimated Claim Amount (₹)
              </label>
              <input
                type="number"
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-mono font-bold focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-plum-deep mb-1">
                Description of Incident *
              </label>
              <textarea
                rows={3}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary leading-relaxed"
                placeholder="Describe how the accident occurred, road conditions, and damaged vehicle parts..."
              />
              {formErrors.incidentDescription && (
                <p className="text-[11px] text-semantic-danger mt-1">
                  {formErrors.incidentDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Document Upload */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft space-y-5 animate-slide-up">
          <div className="border-b border-plum-light pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
              2. Document Verification (AI OCR Extraction)
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Upload required certificates. Our OCR agent extracts and verifies fields instantly.
            </p>
          </div>

          {/* Drag and drop area */}
          <div className="border-2 border-dashed border-peach-primary/60 rounded-2xl p-6 text-center bg-peach-light/20 flex flex-col items-center justify-center transition-all hover:border-peach-primary">
            <div className="w-12 h-12 rounded-xl bg-peach-light text-plum-deep flex items-center justify-center mb-2 shadow-soft">
              <Upload className="w-6 h-6 text-peach-primary" />
            </div>
            <h4 className="text-xs font-bold text-plum-deep">Drag & Drop files here</h4>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              PDF, JPG, PNG • Maximum 10 MB per file
            </p>
            <button
              onClick={() => {
                const newDoc: ClaimDocument = {
                  id: `DOC-NEW-${Date.now()}`,
                  name: 'Workshop_Supplemental_Invoice.pdf',
                  type: 'Repair Invoice',
                  status: 'Verified',
                  ocrConfidence: 96,
                  fileSize: '1.4 MB',
                  uploadDate: '2026-09-12',
                  extractedFields: { 'Estimate Total': '₹48,500', 'Tax': '₹4,200' },
                };
                setDocuments([...documents, newDoc]);
              }}
              className="mt-3 px-4 py-1.5 rounded-xl bg-plum-deep text-white font-bold text-xs hover:bg-plum-secondary transition-all"
            >
              Browse Files (Simulate Upload)
            </button>
          </div>

          {/* Uploaded Documents List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">
              Uploaded Documents ({documents.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm/60 flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-plum-soft text-plum-deep flex-shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-plum-deep block truncate">
                        {doc.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className="text-ink-secondary font-medium">{doc.type}</span>
                        <span className="text-ink-muted">•</span>
                        <span className="text-ink-muted">{doc.fileSize}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-semantic-successBg text-semantic-success font-semibold text-[10px] border border-semantic-success/20">
                          ✓ Verified
                        </span>
                        <span className="text-[10px] font-mono text-plum-deep font-bold">
                          OCR: {doc.ocrConfidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                    className="text-ink-muted hover:text-semantic-danger p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Accident Damage Photos */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft space-y-5 animate-slide-up">
          <div className="border-b border-plum-light pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
              3. Accident Damage Photographs
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Upload clear photographs of the damaged vehicle from multiple angles
            </p>
          </div>

          {/* Quick Angle Add Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-ink-secondary">Add Angle:</span>
            {(['Front View', 'Rear View', 'Left Side', 'Right Side', 'Close-up'] as const).map(
              (angle) => (
                <button
                  key={angle}
                  onClick={() => handleAddPhoto(angle)}
                  className="px-3 py-1.5 rounded-xl border border-plum-soft bg-ivory-warm hover:bg-plum-soft/40 text-plum-deep font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-peach-primary" />
                  <span>+ {angle}</span>
                </button>
              )
            )}
          </div>

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-plum-deep">{photo.angle}</span>
                  <span className="px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success text-[10px] font-bold">
                    Quality: {photo.quality}
                  </span>
                </div>

                <div className="h-28 rounded-lg bg-plum-deep/80 border border-plum-secondary flex flex-col items-center justify-center p-3 text-center text-plum-soft">
                  <Eye className="w-6 h-6 text-peach-primary mb-1 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-white">
                    Vision Confidence: {photo.visionConfidence}%
                  </span>
                  <span className="text-[10px] text-plum-soft/70">Clear Lighting Detected</span>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-plum-light text-xs">
                  <span className="text-[10px] text-ink-secondary">Pre-flight check passed</span>
                  <button
                    onClick={() => setPhotos(photos.filter((p) => p.id !== photo.id))}
                    className="text-ink-muted hover:text-semantic-danger p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Preflight Summary & Start Assessment */}
      {step === 4 && (
        <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft space-y-5 animate-slide-up">
          <div className="border-b border-plum-light pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
              4. Review & AI Pre-flight Verification
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Confirm details before launching the dynamic multi-agent orchestration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-ivory-warm border border-plum-soft">
              <span className="text-[11px] font-bold uppercase text-ink-secondary block mb-2">
                Claim Overview
              </span>
              <div className="space-y-1.5 text-ink-primary">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Policyholder:</span>
                  <span className="font-bold text-plum-deep">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Policy Number:</span>
                  <span className="font-mono font-bold">{policyNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Vehicle:</span>
                  <span className="font-mono font-bold">{vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Claim Type:</span>
                  <span className="font-semibold">{claimType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Claimed Amount:</span>
                  <span className="font-mono font-bold text-semantic-success">
                    ₹{claimedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ivory-warm border border-plum-soft">
              <span className="text-[11px] font-bold uppercase text-ink-secondary block mb-2">
                Evidence Ingested
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-semantic-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-plum-deep">
                    {documents.length} Documents verified (OCR &gt;95%)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-semantic-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-plum-deep">
                    {photos.length} Damage photos with high clarity
                  </span>
                </div>
                <div className="flex items-center gap-2 text-semantic-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-plum-deep">
                    Loss date within active policy validity window
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-peach-light/50 border border-peach-primary/40 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-plum-deep flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold text-plum-deep block">
                Intelligent Adaptive Orchestration Ready
              </span>
              <p className="text-ink-secondary mt-0.5">
                Clicking "Start AI Claim Assessment" will initialize the dynamic multi-agent network.
                The Claim Orchestrator will run specialized agents, benchmark repair estimates,
                screen fraud indicators, and route towards instant auto-approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={step === 1 ? onCancel : handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-plum-soft text-ink-secondary hover:text-plum-deep hover:bg-white font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancel' : 'Back'}</span>
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-plum-deep text-white font-bold text-xs hover:bg-plum-secondary shadow-soft transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleStartAssessment}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-peach-primary text-plum-deep font-extrabold text-sm hover:bg-peach-hover shadow-glow-peach transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start AI Claim Assessment</span>
          </button>
        )}
      </div>
    </div>
  );
};
