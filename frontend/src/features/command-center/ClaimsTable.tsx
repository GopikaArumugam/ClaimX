import React, { useState, useMemo } from 'react';
import { Claim } from '../../types/claims';
import { StatusBadge, RiskBadge, ConfidenceMeter } from '@/components/ui';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Workflow,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

interface ClaimsTableProps {
  claims: Claim[];
  stageFilter: string | null;
  onViewClaim: (claimId: string) => void;
  onLiveOrchestration: (claimId: string) => void;
  onHumanReview: (claimId: string) => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({
  claims,
  stageFilter,
  onViewClaim,
  onLiveOrchestration,
  onHumanReview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'Low' | 'Medium' | 'High'>('ALL');
  const [sortField, setSortField] = useState<'claimId' | 'customer' | 'claimedAmount' | 'overallConfidence'>('claimId');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Pipeline stage filter
      if (stageFilter && stageFilter !== 'ALL') {
        if (stageFilter === 'PROCESSING') {
          if (!['PROCESSING', 'ORCHESTRATING', 'ASSESSING'].includes(claim.status)) return false;
        } else if (claim.status !== stageFilter) {
          return false;
        }
      }

      // Risk filter
      if (riskFilter !== 'ALL' && claim.risk !== riskFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = claim.claimId.toLowerCase().includes(q);
        const matchesCustomer = claim.customer.name.toLowerCase().includes(q);
        const matchesPolicy = claim.policyNumber.toLowerCase().includes(q);
        const matchesVehicle = claim.vehicleNumber.toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesPolicy && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [claims, stageFilter, riskFilter, searchTerm]);

  const sortedClaims = useMemo(() => {
    return [...filteredClaims].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'customer') {
        valA = a.customer.name;
        valB = b.customer.name;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredClaims, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedClaims.length / pageSize));
  const paginatedClaims = sortedClaims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-plum-soft/80 shadow-soft overflow-hidden">
      {/* Table Top Controls */}
      <div className="p-5 border-b border-plum-light flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-plum-deep">
            Active Claims Registry
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Showing {filteredClaims.length} of {claims.length} claims in system
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary placeholder-ink-muted focus:outline-none focus:border-peach-primary"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-ink-secondary" />
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary focus:outline-none focus:border-peach-primary font-medium"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="Low">Low Risk Only</option>
              <option value="Medium">Medium Risk Only</option>
              <option value="High">High Risk Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ivory-warm/70 border-b border-plum-soft text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              <th
                onClick={() => handleSort('claimId')}
                className="py-3 px-4 cursor-pointer hover:text-plum-deep select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Claim ID</span>
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </th>
              <th
                onClick={() => handleSort('customer')}
                className="py-3 px-4 cursor-pointer hover:text-plum-deep select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer & Policy</span>
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </th>
              <th className="py-3 px-4">Claim Type</th>
              <th
                onClick={() => handleSort('claimedAmount')}
                className="py-3 px-4 cursor-pointer hover:text-plum-deep select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </th>
              <th className="py-3 px-4">Risk</th>
              <th
                onClick={() => handleSort('overallConfidence')}
                className="py-3 px-4 cursor-pointer hover:text-plum-deep select-none min-w-[130px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>AI Confidence</span>
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </th>
              <th className="py-3 px-4">Current Agent</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-light text-xs">
            {paginatedClaims.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-ink-secondary">
                  <p className="text-sm font-semibold text-plum-deep mb-1">No claims found</p>
                  <p className="text-xs">Adjust your search or filter criteria to see claims</p>
                </td>
              </tr>
            ) : (
              paginatedClaims.map((claim) => (
                <tr
                  key={claim.claimId}
                  className="hover:bg-plum-soft/20 transition-colors group cursor-pointer"
                  onClick={() => onViewClaim(claim.claimId)}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-plum-deep">
                    {claim.claimId}
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-bold text-ink-primary block leading-tight">
                        {claim.customer.name}
                      </span>
                      <span className="text-[11px] text-ink-secondary font-mono">
                        {claim.policyNumber} • {claim.vehicleNumber}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-plum-light text-plum-deep text-[11px] font-medium">
                      {claim.claimType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-plum-deep">
                    ₹{claim.claimedAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <RiskBadge risk={claim.risk} score={claim.fraudRisk} />
                  </td>
                  <td className="py-3.5 px-4 min-w-[130px]">
                    <ConfidenceMeter confidence={claim.overallConfidence} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-plum-deep capitalize text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-peach-primary" />
                      {claim.currentAgent}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={claim.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewClaim(claim.claimId)}
                        className="px-2.5 py-1 rounded-lg bg-plum-soft/60 hover:bg-plum-soft text-plum-deep font-semibold text-[11px] transition-colors"
                        title="View Full Claim Workspace"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onLiveOrchestration(claim.claimId)}
                        className="p-1 rounded-lg bg-peach-light hover:bg-peach-primary text-plum-deep transition-all"
                        title="Open Live AI Orchestrator"
                      >
                        <Workflow className="w-3.5 h-3.5" />
                      </button>
                      {claim.status === 'HUMAN_REVIEW' && (
                        <button
                          onClick={() => onHumanReview(claim.claimId)}
                          className="px-2 py-1 rounded-lg bg-semantic-danger text-white font-bold text-[10px] hover:bg-red-700 transition-colors shadow-soft"
                          title="Review Escalated Claim"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-plum-light bg-ivory-warm/40 flex items-center justify-between text-xs text-ink-secondary">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-plum-soft text-ink-secondary hover:text-plum-deep hover:bg-white disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-plum-soft text-ink-secondary hover:text-plum-deep hover:bg-white disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
