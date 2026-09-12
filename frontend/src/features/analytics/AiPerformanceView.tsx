import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { FileCheck, Eye, ShieldAlert, Calculator, ShieldCheck, CheckCircle, Brain, Clock, Zap } from 'lucide-react';

export const AiPerformanceView: React.FC = () => {
  const agentPerformanceData = [
    { name: 'Document', accuracy: 97, latency: 1.2, claims: 1284, fill: '#351B36' },
    { name: 'Vision', accuracy: 93, latency: 2.8, claims: 1102, fill: '#F08A7E' },
    { name: 'Policy', accuracy: 99, latency: 0.8, claims: 1284, fill: '#542653' },
    { name: 'Fraud', accuracy: 91, latency: 1.5, claims: 1102, fill: '#C94B58' },
    { name: 'Estimation', accuracy: 94, latency: 1.1, claims: 980, fill: '#26966F' },
    { name: 'Decision', accuracy: 96, latency: 0.6, claims: 1284, fill: '#D99A3D' },
  ];

  const latencyWaterfall = [
    { stage: 'Document OCR', seconds: 1.2 },
    { stage: 'Damage Vision', seconds: 2.8 },
    { stage: 'Policy Checks', seconds: 0.8 },
    { stage: 'Fraud Screening', seconds: 1.5 },
    { stage: 'Pricing Engine', seconds: 1.1 },
    { stage: 'Final Adjudication', seconds: 0.6 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft">
        <span className="text-[11px] font-bold uppercase tracking-wider text-peach-primary">
          Model Observability
        </span>
        <h1 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans mt-0.5">
          Specialized AI Agent Performance Telemetry
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Precision benchmarking, model latency, confidence distribution, and fallback escalation ratios
        </p>
      </div>

      {/* Per-Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Document Agent */}
        <div className="bg-white p-5 rounded-2xl border border-plum-soft/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-plum-soft text-plum-deep">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success">
              97% Accuracy
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-plum-deep">Document Agent</h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">PaddleOCR + LayoutLMv3</p>
          </div>
          <div className="pt-2 border-t border-plum-light grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-ink-muted block text-[10px]">Avg Latency</span>
              <span className="font-mono font-bold text-plum-deep">1.2 sec</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Claims Processed</span>
              <span className="font-mono font-bold text-plum-deep">1,284</span>
            </div>
          </div>
        </div>

        {/* Vision Agent */}
        <div className="bg-white p-5 rounded-2xl border border-plum-soft/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-peach-light text-plum-deep">
              <Eye className="w-5 h-5 text-peach-primary" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success">
              93% Accuracy
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-plum-deep">Vision Agent</h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">YOLOv9 + SAM Segmentation</p>
          </div>
          <div className="pt-2 border-t border-plum-light grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-ink-muted block text-[10px]">Avg Latency</span>
              <span className="font-mono font-bold text-plum-deep">2.8 sec</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Claims Processed</span>
              <span className="font-mono font-bold text-plum-deep">1,102</span>
            </div>
          </div>
        </div>

        {/* Fraud Agent */}
        <div className="bg-white p-5 rounded-2xl border border-plum-soft/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-semantic-dangerBg text-semantic-danger">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success">
              91.2% Precision
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-plum-deep">Fraud Agent</h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">Graph Neural Net + EXIF Heuristics</p>
          </div>
          <div className="pt-2 border-t border-plum-light grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-ink-muted block text-[10px]">Avg Latency</span>
              <span className="font-mono font-bold text-plum-deep">1.5 sec</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Claims Intercepted</span>
              <span className="font-mono font-bold text-semantic-danger">43 flagged</span>
            </div>
          </div>
        </div>

        {/* Estimation Agent */}
        <div className="bg-white p-5 rounded-2xl border border-plum-soft/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-plum-soft text-plum-deep">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-plum-light text-plum-deep">
              MAE ₹2,850
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-plum-deep">Estimation Agent</h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">OEM Catalog + Labor Schedule</p>
          </div>
          <div className="pt-2 border-t border-plum-light grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-ink-muted block text-[10px]">Avg Latency</span>
              <span className="font-mono font-bold text-plum-deep">1.1 sec</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">Avg Error Band</span>
              <span className="font-mono font-bold text-semantic-success">2.4% variance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency & Accuracy Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
            Agent Accuracy Benchmark (%)
          </h3>
          <p className="text-xs text-ink-secondary mb-4">
            Ground-truth validation across audited claim files
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentPerformanceData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {agentPerformanceData.map((entry, index) => (
                    <Cell key={`acc-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
            Execution Latency Waterfall (Seconds)
          </h3>
          <p className="text-xs text-ink-secondary mb-4">
            End-to-end execution breakdown per specialized agent
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyWaterfall} layout="vertical">
                <XAxis type="number" unit="s" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="seconds" fill="#F08A7E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
