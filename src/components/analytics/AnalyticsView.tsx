import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Clock, Zap, ShieldCheck, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  // Mock analytics dataset
  const volumeData = [
    { month: 'Apr', volume: 680, autoApproved: 460 },
    { month: 'May', volume: 790, autoApproved: 540 },
    { month: 'Jun', volume: 920, autoApproved: 670 },
    { month: 'Jul', volume: 1040, autoApproved: 780 },
    { month: 'Aug', volume: 1180, autoApproved: 910 },
    { month: 'Sep', volume: 1284, autoApproved: 1041 },
  ];

  const statusDistribution = [
    { name: 'Auto Approved', value: 742, color: '#26966F' },
    { name: 'Human Review', value: 119, color: '#C94B58' },
    { name: 'Awaiting Info', value: 83, color: '#D99A3D' },
    { name: 'Rejected', value: 94, color: '#542653' },
  ];

  const fraudDistribution = [
    { range: '0-20 (Low)', claims: 840, fill: '#26966F' },
    { range: '21-40 (Normal)', claims: 280, fill: '#827580' },
    { range: '41-70 (Moderate)', claims: 121, fill: '#D99A3D' },
    { range: '71-100 (High Risk)', claims: 43, fill: '#C94B58' },
  ];

  const claimTypeAvgPayout = [
    { type: 'Collision', amount: 48500 },
    { type: 'Windshield', amount: 16800 },
    { type: 'Side Scrape', amount: 28400 },
    { type: 'Total Loss', amount: 380000 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-plum-soft/80 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-peach-primary">
            Executive Intelligence
          </span>
          <h1 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans mt-0.5">
            Claims Automation & Operations Analytics
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Real-time throughput, cycle times, auto-approval ratios, and fraud risk metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-ivory-warm border border-plum-soft text-xs font-semibold text-plum-deep">
            Past 6 Months
          </span>
        </div>
      </div>

      {/* Speed Comparison Hero Card */}
      <div className="bg-plum-deep text-white rounded-2xl p-6 border border-plum-secondary shadow-modal">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-peach-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-peach-primary">
            Cycle Time Transformation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-plum-secondary/80 border border-plum-soft/20 space-y-1">
            <span className="text-[10px] uppercase font-bold text-plum-soft block">
              Traditional Manual Process
            </span>
            <div className="text-2xl lg:text-3xl font-bold font-sans text-plum-soft">
              3 – 7 Business Days
            </div>
            <p className="text-[11px] text-plum-soft/70">
              Manual surveyor appointments, paper invoice verification, and multi-tier sign-offs
            </p>
          </div>

          <div className="p-4 rounded-xl bg-peach-light/20 border border-peach-primary/40 space-y-1 shadow-glow-peach">
            <span className="text-[10px] uppercase font-extrabold text-peach-primary block">
              AI-Native Orchestrated Process
            </span>
            <div className="text-2xl lg:text-3xl font-black font-sans text-white">
              4.2 Minutes
            </div>
            <p className="text-[11px] text-plum-soft">
              Real-time OCR extraction, instant damage segmentation, and automated NEFT disbursement
            </p>
          </div>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-plum-soft/80 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-ink-secondary block">
            Auto-Approval Ratio
          </span>
          <span className="text-2xl font-bold font-sans text-semantic-success mt-1 block">
            71.3%
          </span>
          <span className="text-[10px] text-ink-muted">742 claims settled autonomously</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-plum-soft/80 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-ink-secondary block">
            Human Escalation Rate
          </span>
          <span className="text-2xl font-bold font-sans text-semantic-warning mt-1 block">
            11.4%
          </span>
          <span className="text-[10px] text-ink-muted">Only 119 complex cases escalated</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-plum-soft/80 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-ink-secondary block">
            Fraud Detection Precision
          </span>
          <span className="text-2xl font-bold font-sans text-semantic-danger mt-1 block">
            91.2%
          </span>
          <span className="text-[10px] text-ink-muted">43 suspicious claims intercepted</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-plum-soft/80 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-ink-secondary block">
            Average Settlement
          </span>
          <span className="text-2xl font-bold font-sans text-plum-deep mt-1 block font-mono">
            ₹44,800
          </span>
          <span className="text-[10px] text-ink-muted">Benchmark variance &lt;3%</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Claims Volume Over Time (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
            Claims Volume & Automated Throughput
          </h3>
          <p className="text-xs text-ink-secondary mb-4">
            Total claims submitted vs autonomous completions
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#351B36" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#351B36" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="autoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F08A7E" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#F08A7E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="volume"
                  name="Total Ingested"
                  stroke="#351B36"
                  fillOpacity={1}
                  fill="url(#volGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="autoApproved"
                  name="AI Auto-Approved"
                  stroke="#F08A7E"
                  fillOpacity={1}
                  fill="url(#autoGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
            Claims Adjudication Distribution
          </h3>
          <p className="text-xs text-ink-secondary mb-4">
            Proportion of auto-approvals, escalations, and clarifications
          </p>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Risk Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
            Fraud Risk Score Distribution (0-100)
          </h3>
          <p className="text-xs text-ink-secondary mb-4">
            Claims categorization by AI fraud score bands
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="claims" radius={[6, 6, 0, 0]}>
                  {fraudDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Payout by Claim Type (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep mb-1">
            Average Payout by Claim Type
          </h3>
          <p className="text-xs text-ink-secondary mb-4">
            Baseline financial settlements across damage categories
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claimTypeAvgPayout}>
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="amount" fill="#542653" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
