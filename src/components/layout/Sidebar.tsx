import React from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  UserCheck,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Cpu,
  Settings,
  Workflow,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export type NavigationTab =
  | 'command-center'
  | 'claims'
  | 'new-claim'
  | 'live-orchestration'
  | 'human-review'
  | 'payments'
  | 'analytics'
  | 'fraud-intel'
  | 'ai-performance'
  | 'customer-portal'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingReviewCount: number;
  userRole: 'officer' | 'customer';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  pendingReviewCount,
  userRole,
}) => {
  // Officer Navigation Items
  const officerNavItems = [
    { id: 'command-center' as NavigationTab, label: 'Command Center', icon: LayoutDashboard },
    { id: 'live-orchestration' as NavigationTab, label: 'Live AI Orchestrator', icon: Workflow, isHero: true },
    { id: 'claims' as NavigationTab, label: 'Claims Registry', icon: FileText },
    { id: 'new-claim' as NavigationTab, label: 'New Claim Intake', icon: PlusCircle },
    {
      id: 'human-review' as NavigationTab,
      label: 'Human Review',
      icon: UserCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    { id: 'payments' as NavigationTab, label: 'Payments & Settlement', icon: CreditCard },
  ];

  const officerIntelligenceItems = [
    { id: 'analytics' as NavigationTab, label: 'Analytics', icon: BarChart3 },
    { id: 'fraud-intel' as NavigationTab, label: 'Fraud Intelligence', icon: ShieldAlert },
    { id: 'ai-performance' as NavigationTab, label: 'AI Performance', icon: Cpu },
  ];

  // Customer Navigation Items
  const customerNavItems = [
    { id: 'customer-portal' as NavigationTab, label: 'My Claims & Tracker', icon: Clock },
    { id: 'new-claim' as NavigationTab, label: 'File a New Claim', icon: PlusCircle, isHero: true },
    { id: 'payments' as NavigationTab, label: 'Payouts & Transfers', icon: CreditCard },
  ];

  return (
    <aside
      className={`relative bg-plum-deep text-ivory-warm flex flex-col transition-all duration-300 z-30 flex-shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-plum-secondary flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-peach-primary flex items-center justify-center text-plum-deep font-black shadow-glow-peach flex-shrink-0">
            <Sparkles className="w-5 h-5 text-plum-deep animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                AI CLAIMS
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-peach-primary/20 text-peach-primary border border-peach-primary/30">
                  {userRole === 'customer' ? 'Customer' : 'Officer'}
                </span>
              </h1>
              <p className="text-xs text-plum-soft/70 truncate font-medium">
                {userRole === 'customer' ? 'Policyholder Self-Service' : 'Intelligent Claims Platform'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg hover:bg-plum-secondary text-plum-soft transition-colors hidden md:flex items-center justify-center"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {userRole === 'officer' ? (
          <>
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-plum-soft/50 mb-2 font-mono">
                  Claims Operations
                </p>
              )}
              <nav className="space-y-1">
                {officerNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative group ${
                        isActive
                          ? 'bg-peach-primary text-plum-deep font-bold shadow-glow-peach'
                          : 'text-plum-soft/80 hover:text-white hover:bg-plum-secondary'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-plum-deep' : item.isHero ? 'text-peach-primary' : 'text-plum-soft'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {item.badge && !isCollapsed && (
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-semantic-danger text-white">
                          {item.badge}
                        </span>
                      )}
                      {item.isHero && !isCollapsed && !isActive && (
                        <span className="ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-peach-primary/20 text-peach-primary border border-peach-primary/30">
                          Live
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-plum-soft/50 mb-2 font-mono">
                  Intelligence
                </p>
              )}
              <nav className="space-y-1">
                {officerIntelligenceItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative group ${
                        isActive
                          ? 'bg-peach-primary text-plum-deep font-bold shadow-glow-peach'
                          : 'text-plum-soft/80 hover:text-white hover:bg-plum-secondary'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-plum-deep' : 'text-plum-soft'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <nav className="space-y-1">
                <button
                  onClick={() => onSelectTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    currentTab === 'settings'
                      ? 'bg-peach-primary text-plum-deep font-bold shadow-glow-peach'
                      : 'text-plum-soft/80 hover:text-white hover:bg-plum-secondary'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? 'Settings' : undefined}
                >
                  <Settings className="w-4 h-4 flex-shrink-0 text-plum-soft" />
                  {!isCollapsed && <span>Settings & Thresholds</span>}
                </button>
              </nav>
            </div>
          </>
        ) : (
          /* Customer Portal Navigation */
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-plum-soft/50 mb-2 font-mono">
                My Insurance
              </p>
            )}
            <nav className="space-y-1.5">
              {customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative group ${
                      isActive
                        ? 'bg-peach-primary text-plum-deep font-bold shadow-glow-peach'
                        : 'text-plum-soft/80 hover:text-white hover:bg-plum-secondary'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-plum-deep' : item.isHero ? 'text-peach-primary' : 'text-plum-soft'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Current Active Persona Info (Session Locked) */}
      <div className="p-3 border-t border-plum-secondary bg-plum-deep/90">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-full bg-peach-primary text-plum-deep font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-glow-peach">
            {userRole === 'officer' ? 'AO' : 'AK'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold text-white truncate">
                  {userRole === 'officer' ? 'Anand Officer' : 'Arun Kumar'}
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-peach-primary animate-pulse" />
              </div>
              <p className="text-[10px] text-plum-soft/70 truncate">
                {userRole === 'officer' ? 'Claims Assessor (L3)' : 'Policyholder #POL-882910'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
