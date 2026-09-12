import React, { useState } from 'react';
import { Claim, ClaimDocument } from '../../types/claims';
import { StatusBadge, RiskBadge, ConfidenceMeter, Modal } from '@/components/ui';
import {
  FileText,
  Eye,
  ShieldAlert,
  Calculator,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  CreditCard,
  UserCheck,
  Workflow,
  Sparkles,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ClaimDetailsViewProps {
  claim: Claim;
  onLiveOrchestration: (claimId: string) => void;
  onHumanReview: (claimId: string) => void;
  onProcessPayment: (claimId: string) => void;
}

export const ClaimDetailsView: React.FC<ClaimDetailsViewProps> = ({
  claim,
  onLiveOrchestration,
  onHumanReview,
  onProcessPayment,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'documents' | 'damage' | 'fraud' | 'estimation' | 'decision' | 'activity'
  >('overview');
  const [previewDocument, setPreviewDocument] = useState<ClaimDocument | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FileText },
    { id: 'documents' as const, label: `Documents (${claim.documents.length})`, icon: FileText },
    { id: 'damage' as const, label: 'Damage Assessment', icon: Eye },
    { id: 'fraud' as const, label: 'Fraud Intelligence', icon: ShieldAlert },
    { id: 'estimation' as const, label: 'Estimation', icon: Calculator },
    { id: 'decision' as const, label: 'Decision', icon: CheckCircle2 },
    { id: 'activity' as const, label: 'Activity Feed', icon: Clock },
  ];

  // Estimation comparison data for Recharts
  const estimationChartData = [
    { name: 'Customer Invoice', amount: claim.claimedAmount, fill: '#827580' },
    { name: 'AI Baseline', amount: claim.estimatedAmount, fill: '#F08A7E' },
    { name: 'Net Settlement', amount: claim.approvedAmount || (claim.estimatedAmount - claim.deductible), fill: '#26966F' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono font-bold text-sm text-plum-deep bg-ivory-warm px-2.5 py-0.5 rounded-lg border border-plum-soft">
                {claim.claimId}
              </span>
              <StatusBadge status={claim.status} />
              <RiskBadge risk={claim.risk} score={claim.fraudRisk} />
              <span className="text-xs text-ink-secondary">
                Submitted {claim.createdAt.substring(0, 10)}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-plum-deep tracking-tight font-sans">
              {claim.claimType} — {claim.customer.name}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Vehicle: <span className="font-semibold text-plum-deep">{claim.vehicleModel}</span> (
              <span className="font-mono">{claim.vehicleNumber}</span>) • Policy:{' '}
              <span className="font-mono font-semibold text-plum-deep">{claim.policyNumber}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right lg:border-r border-plum-light lg:pr-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">
                Claimed Amount
              </span>
              <span className="text-2xl font-bold font-mono text-plum-deep">
                ₹{claim.claimedAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={() => onLiveOrchestration(claim.claimId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-plum-deep text-white hover:bg-plum-secondary font-bold text-xs shadow-soft transition-all"
            >
              <Workflow className="w-4 h-4 text-peach-primary" />
              <span>Live AI Orchestrator</span>
            </button>

            {claim.status === 'APPROVED' && (
              <button
                onClick={() => onProcessPayment(claim.claimId)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-peach-primary text-plum-deep font-extrabold text-xs hover:bg-peach-hover shadow-glow-peach transition-all hover:scale-105"
              >
                <CreditCard className="w-4 h-4" />
                <span>Process Payment</span>
              </button>
            )}

            {claim.status === 'HUMAN_REVIEW' && (
              <button
                onClick={() => onHumanReview(claim.claimId)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-semantic-danger text-white font-bold text-xs hover:bg-red-700 shadow-soft transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Open Assessor Cockpit</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-t border-plum-light pt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-plum-deep text-white shadow-soft font-bold'
                    : 'text-ink-secondary hover:text-plum-deep hover:bg-ivory-warm'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? 'text-peach-primary' : 'text-ink-muted'}`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up">
          {/* Left Column: Claim & Policy Details (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
              <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-4">
                Policyholder & Loss Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-ink-muted block text-[11px]">Insured Customer</span>
                  <span className="font-bold text-plum-deep text-sm">{claim.customer.name}</span>
                  <p className="text-ink-secondary text-[11px] mt-0.5">{claim.customer.phone}</p>
                  <p className="text-ink-secondary text-[11px]">{claim.customer.email}</p>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Policy Plan</span>
                  <span className="font-bold text-plum-deep text-sm">{claim.policyNumber}</span>
                  <p className="text-ink-secondary text-[11px] mt-0.5">{claim.policyCoverage}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-semantic-successBg text-semantic-success font-bold text-[10px]">
                    Status: {claim.policyStatus}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Insured Vehicle</span>
                  <span className="font-bold text-plum-deep">{claim.vehicleModel}</span>
                  <p className="font-mono text-ink-secondary mt-0.5">{claim.vehicleNumber}</p>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Date & Location of Loss</span>
                  <span className="font-bold text-plum-deep">{claim.accidentDate}</span>
                  <p className="text-ink-secondary text-[11px] mt-0.5">{claim.accidentLocation}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-plum-light">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Incident Description
                </span>
                <p className="text-xs text-ink-primary leading-relaxed bg-ivory-warm p-3.5 rounded-xl border border-plum-soft">
                  {claim.incidentDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: AI Assessment Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-plum-deep text-white rounded-2xl p-6 border border-plum-secondary shadow-modal">
              <div className="flex items-center justify-between pb-3 border-b border-plum-secondary mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-peach-primary animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    AI Assessment Summary
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-peach-primary">
                  {claim.overallConfidence}% Confidence
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-plum-secondary/70 border border-plum-soft/20">
                  <span className="text-plum-soft">Policy Coverage</span>
                  <span className="font-bold text-semantic-success">✓ Valid & Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-plum-secondary/70 border border-plum-soft/20">
                  <span className="text-plum-soft">Physical Damage</span>
                  <span className="font-bold text-semantic-success">✓ Verified by Vision</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-plum-secondary/70 border border-plum-soft/20">
                  <span className="text-plum-soft">Fraud Risk Score</span>
                  <span
                    className={`font-bold ${
                      claim.fraudRisk > 40 ? 'text-semantic-danger' : 'text-semantic-success'
                    }`}
                  >
                    {claim.fraudRisk} / 100 ({claim.risk} Risk)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-plum-secondary/70 border border-plum-soft/20">
                  <span className="text-plum-soft">Estimated Repair Cost</span>
                  <span className="font-bold font-mono text-white">
                    ₹{claim.estimatedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-plum-secondary/70 border border-plum-soft/20">
                  <span className="text-plum-soft">Policy Deductible</span>
                  <span className="font-bold font-mono text-plum-soft">
                    - ₹{claim.deductible.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-plum-secondary flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-plum-soft block">
                    AI Recommendation
                  </span>
                  <span
                    className={`text-base font-extrabold tracking-tight ${
                      claim.status === 'HUMAN_REVIEW' ? 'text-semantic-danger' : 'text-peach-primary'
                    }`}
                  >
                    {claim.status === 'HUMAN_REVIEW' ? 'HUMAN REVIEW REQUIRED' : 'AUTO APPROVE'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-plum-soft block">
                    Net Approved Settlement
                  </span>
                  <span className="text-xl font-extrabold font-mono text-white">
                    ₹{(claim.approvedAmount || (claim.estimatedAmount - claim.deductible)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4 animate-slide-up">
          <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
              Verified Claim Documents ({claim.documents.length})
            </h3>
            <p className="text-xs text-ink-secondary mb-4">
              Click any document to inspect OCR extraction fields and generated verification certificates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {claim.documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setPreviewDocument(doc)}
                  className="rounded-xl border border-plum-soft bg-ivory-warm/60 p-4 hover:border-peach-primary hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-plum-deep px-2 py-0.5 rounded bg-plum-soft">
                        {doc.type}
                      </span>
                      <span className="text-[10px] font-mono text-semantic-success font-bold">
                        OCR {doc.ocrConfidence}%
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-plum-deep truncate mb-1">{doc.name}</h4>
                    <p className="text-[11px] text-ink-secondary">{doc.fileSize} • {doc.uploadDate}</p>

                    <div className="mt-3 space-y-1 text-[11px] bg-white p-2 rounded-lg border border-plum-light">
                      {Object.entries(doc.extractedFields).slice(0, 2).map(([k, v]) => (
                        <div key={k} className="flex justify-between truncate">
                          <span className="text-ink-muted">{k}:</span>
                          <span className="font-semibold text-plum-deep truncate max-w-[110px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-plum-light flex items-center justify-between text-xs text-peach-primary font-bold">
                    <span>Inspect Document</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAMAGE ASSESSMENT */}
      {activeTab === 'damage' && (
        <div className="space-y-5 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-plum-light mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                  Vision Agent Computer Vision Damage Segmentation
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Automated panel segmentation, deformation severity classification, and parts costing
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-semantic-success px-2.5 py-1 rounded-full bg-semantic-successBg border border-semantic-success/30">
                Vision Confidence: {claim.agentResults.vision?.confidence || 94}%
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Photo Viewer with Bounding Box overlays */}
              <div className="space-y-3">
                {claim.accidentPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-2xl border border-plum-secondary overflow-hidden bg-plum-deep relative group"
                  >
                    <div className="p-3 bg-plum-deep/90 border-b border-plum-secondary flex items-center justify-between text-xs text-white">
                      <span className="font-bold">{photo.angle}</span>
                      <span className="font-mono text-[11px] text-peach-primary">
                        Clarity: {photo.quality} ({photo.visionConfidence}%)
                      </span>
                    </div>

                    <div className="relative aspect-video flex items-center justify-center p-2 bg-black/40">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={photo.angle}
                          className="max-h-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="text-center text-plum-soft">
                          <Eye className="w-8 h-8 text-peach-primary mx-auto mb-1 animate-pulse" />
                          <span className="text-xs">Damage Scan Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detected Parts Classification Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Detected Damaged Components ({claim.damageAssessment.length})
                </h4>
                <div className="space-y-2.5">
                  {claim.damageAssessment.map((dmg) => (
                    <div
                      key={dmg.id}
                      className="p-3.5 rounded-xl border border-plum-soft bg-ivory-warm flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-plum-deep">{dmg.partName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              dmg.severity === 'Severe'
                                ? 'bg-semantic-dangerBg text-semantic-danger'
                                : dmg.severity === 'Moderate'
                                ? 'bg-semantic-warningBg text-semantic-warning'
                                : 'bg-plum-soft text-plum-deep'
                            }`}
                          >
                            {dmg.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Action: <span className="font-semibold text-plum-deep">{dmg.repairAction}</span> • AI Confidence: {dmg.confidence}%
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-ink-muted block">Estimated Part Cost</span>
                        <span className="font-mono font-bold text-xs text-plum-deep">
                          ₹{dmg.estimatedCost.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FRAUD INTELLIGENCE */}
      {activeTab === 'fraud' && (
        <div className="space-y-5 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-plum-light mb-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                  Fraud Intelligence & Anomaly Detection
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Cross-referencing claims database, vehicle identity registry, metadata, and cost variance
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-ink-muted block">
                    Composite Risk Score
                  </span>
                  <span
                    className={`text-2xl font-extrabold font-mono ${
                      claim.fraudRisk > 40 ? 'text-semantic-danger' : 'text-semantic-success'
                    }`}
                  >
                    {claim.fraudRisk} / 100
                  </span>
                </div>
                <RiskBadge risk={claim.risk} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {claim.fraudSignals.map((signal) => (
                <div
                  key={signal.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    signal.passed
                      ? 'bg-semantic-successBg/40 border-semantic-success/30'
                      : 'bg-semantic-dangerBg/50 border-semantic-danger/40'
                  }`}
                >
                  {signal.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-semantic-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-plum-deep">{signal.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          signal.passed
                            ? 'bg-semantic-success text-white'
                            : 'bg-semantic-danger text-white'
                        }`}
                      >
                        {signal.passed ? 'PASSED' : 'FLAGGED'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                      {signal.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ESTIMATION */}
      {activeTab === 'estimation' && (
        <div className="space-y-5 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-plum-light mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                  Repair Cost Estimation Agent
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Itemized OEM catalog pricing, labor schedules, and variance against customer repair bill
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-plum-deep px-3 py-1 rounded-lg bg-ivory-warm border border-plum-soft">
                Benchmark Variance: 2.4%
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Itemized Table (7 cols) */}
              <div className="lg:col-span-7 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-ivory-warm border-b border-plum-soft text-[11px] font-bold uppercase text-ink-secondary">
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Item / Service</th>
                      <th className="py-2.5 px-3 text-right">Parts (₹)</th>
                      <th className="py-2.5 px-3 text-right">Labor (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum-light">
                    {claim.estimationBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-ivory-warm/50">
                        <td className="py-2.5 px-3 font-semibold text-ink-secondary">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-plum-deep">{item.item}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{item.cost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{item.labor.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-plum-deep">
                          ₹{(item.cost + item.labor).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-ivory-warm/80 font-bold border-t-2 border-plum-soft">
                      <td colSpan={4} className="py-3 px-3 uppercase text-plum-deep">
                        Estimated Repair Baseline
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-base text-plum-deep">
                        ₹{claim.estimatedAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Visual Comparison Chart (5 cols) */}
              <div className="lg:col-span-5 bg-ivory-warm/70 p-4 rounded-xl border border-plum-soft flex flex-col justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-2">
                  Invoice vs AI Benchmark
                </h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estimationChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {estimationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 pt-3 border-t border-plum-light text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Customer Claim:</span>
                    <span className="font-mono font-bold">₹{claim.claimedAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Policy Deductible:</span>
                    <span className="font-mono font-bold text-semantic-danger">- ₹{claim.deductible.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-semantic-success pt-1 border-t border-plum-light">
                    <span>Net Approved Payout:</span>
                    <span className="font-mono">₹{(claim.approvedAmount || (claim.estimatedAmount - claim.deductible)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DECISION */}
      {activeTab === 'decision' && (
        <div className="space-y-5 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-4">
              Decision Agent Final Adjudication
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  5 Safety Guardrails Verification
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-semantic-successBg/60 border border-semantic-success/30 flex items-center justify-between">
                    <span className="font-semibold text-plum-deep">1. Policy Active on Date of Loss</span>
                    <span className="font-bold text-semantic-success">✓ Verified</span>
                  </div>
                  <div className="p-3 rounded-xl bg-semantic-successBg/60 border border-semantic-success/30 flex items-center justify-between">
                    <span className="font-semibold text-plum-deep">2. KYC & Driver Credentials Valid</span>
                    <span className="font-bold text-semantic-success">✓ Verified</span>
                  </div>
                  <div className="p-3 rounded-xl bg-semantic-successBg/60 border border-semantic-success/30 flex items-center justify-between">
                    <span className="font-semibold text-plum-deep">3. Photo Damage Matches Collision Physics</span>
                    <span className="font-bold text-semantic-success">✓ Verified</span>
                  </div>
                  <div className="p-3 rounded-xl bg-semantic-successBg/60 border border-semantic-success/30 flex items-center justify-between">
                    <span className="font-semibold text-plum-deep">4. Fraud Risk Below Threshold (&lt;40)</span>
                    <span
                      className={`font-bold ${
                        claim.fraudRisk < 40 ? 'text-semantic-success' : 'text-semantic-danger'
                      }`}
                    >
                      {claim.fraudRisk < 40 ? '✓ Verified (12/100)' : '⚠ Flagged (87/100)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-semantic-successBg/60 border border-semantic-success/30 flex items-center justify-between">
                    <span className="font-semibold text-plum-deep">5. Repair Cost Variance Below 10%</span>
                    <span className="font-bold text-semantic-success">✓ Verified (2.4%)</span>
                  </div>
                </div>
              </div>

              {/* Large Verdict Card */}
              <div className="p-6 rounded-2xl bg-plum-deep text-white flex flex-col justify-between border border-plum-secondary">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-plum-soft">
                    Final Adjudication Outcome
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    {claim.status === 'APPROVED' || claim.status === 'PAID' ? (
                      <CheckCircle2 className="w-8 h-8 text-semantic-success" />
                    ) : claim.status === 'HUMAN_REVIEW' ? (
                      <AlertTriangle className="w-8 h-8 text-semantic-danger" />
                    ) : (
                      <Clock className="w-8 h-8 text-peach-primary" />
                    )}
                    <div>
                      <h2 className="text-2xl font-black font-sans">
                        {claim.status === 'APPROVED' || claim.status === 'PAID'
                          ? 'AUTO APPROVED'
                          : claim.status === 'HUMAN_REVIEW'
                          ? 'HUMAN REVIEW REQUIRED'
                          : claim.status}
                      </h2>
                      <span className="text-xs text-plum-soft">
                        Overall Confidence: {claim.overallConfidence}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-plum-soft mt-4 leading-relaxed bg-plum-secondary/70 p-3 rounded-xl border border-plum-soft/20">
                    {claim.agentResults.decision?.summary ||
                      'Decision Engine evaluated all evidence inputs against policy guidelines.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-plum-secondary flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-plum-soft block uppercase font-bold">
                      Settlement Payout
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-peach-primary">
                      ₹{(claim.approvedAmount || (claim.estimatedAmount - claim.deductible)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {claim.status === 'APPROVED' && (
                    <button
                      onClick={() => onProcessPayment(claim.claimId)}
                      className="px-5 py-2.5 rounded-xl bg-peach-primary text-plum-deep font-extrabold text-xs hover:bg-peach-hover shadow-glow-peach transition-all"
                    >
                      Process Payment Now
                    </button>
                  )}

                  {claim.status === 'HUMAN_REVIEW' && (
                    <button
                      onClick={() => onHumanReview(claim.claimId)}
                      className="px-5 py-2.5 rounded-xl bg-semantic-danger text-white font-bold text-xs hover:bg-red-700 shadow-soft transition-all"
                    >
                      Open Assessor Cockpit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY FEED */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft animate-slide-up">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-4">
            Auditable Multi-Agent Event Trail ({claim.activityFeed?.length || 0} Events)
          </h3>
          <div className="space-y-3">
            {(claim.activityFeed || []).map((event) => (
              <div
                key={event.id}
                className="p-3.5 rounded-xl bg-ivory-warm border border-plum-soft flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-plum-deep">
                      {event.agentName || 'System'}
                    </span>
                    <span className="text-[10px] text-ink-muted font-mono">{event.timestamp}</span>
                  </div>
                  <p className="text-ink-primary leading-relaxed">{event.action}</p>
                </div>
                {event.confidence !== undefined && (
                  <span className="text-[11px] font-mono font-bold text-plum-deep px-2 py-0.5 rounded bg-plum-soft">
                    {event.confidence}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <Modal
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          title={`Document Preview: ${previewDocument.name}`}
          subtitle={`${previewDocument.type} • OCR Confidence: ${previewDocument.ocrConfidence}%`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {previewDocument.previewUrl ? (
              <div className="border border-plum-soft rounded-xl overflow-hidden max-h-96 flex items-center justify-center bg-ivory-warm">
                <img
                  src={previewDocument.previewUrl}
                  alt={previewDocument.name}
                  className="max-h-96 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-ink-muted bg-ivory-warm rounded-xl border border-plum-soft">
                <FileText className="w-10 h-10 mx-auto mb-2 text-peach-primary" />
                <span className="text-xs">Document OCR Text Extracted Successfully</span>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-2">
                AI Extracted Fields
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(previewDocument.extractedFields).map(([key, value]) => (
                  <div key={key} className="p-2 rounded-lg bg-ivory-warm border border-plum-soft">
                    <span className="text-[10px] text-ink-muted block">{key}</span>
                    <span className="font-bold text-plum-deep">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
