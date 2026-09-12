import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  FileCheck,
  Eye,
  CreditCard,
  Lock,
  Mail,
  User,
  UserPlus,
  Car,
} from 'lucide-react';

export type AuthMode = 'login-user' | 'login-officer' | 'register-user';

interface SplitLoginViewProps {
  onLoginSuccess: (role?: 'officer' | 'customer') => void;
  initialMode?: AuthMode;
}

export const SplitLoginView: React.FC<SplitLoginViewProps> = ({
  onLoginSuccess,
  initialMode = 'login-user',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form states for Login User
  const [userEmail, setUserEmail] = useState('arun.kumar@gmail.com');
  const [userPassword, setUserPassword] = useState('••••••••••••');

  // Form states for Login Officer
  const [officerEmail, setOfficerEmail] = useState('anand.officer@aiclaims.internal');
  const [officerPassword, setOfficerPassword] = useState('••••••••••••');

  // Form states for Register as New User
  const [regName, setRegName] = useState('Priya Sharma');
  const [regEmail, setRegEmail] = useState('priya.sharma@example.com');
  const [regPolicy, setRegPolicy] = useState('POL-992310 (KA-05-MH-2024)');
  const [regPassword, setRegPassword] = useState('••••••••••••');
  const [regTerms, setRegTerms] = useState(true);

  // Submissions
  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess('customer');
  };

  const handleOfficerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess('officer');
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess('customer');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-ivory-warm">
      {/* Left Column: Brand & Miniature Adaptive Workflow (Deep Forest Slate) */}
      <div className="lg:w-1/2 bg-plum-deep text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-peach-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-plum-secondary/50 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-peach-primary text-plum-deep flex items-center justify-center font-black shadow-glow-peach">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight font-sans text-white">AI CLAIMS</h2>
              <p className="text-xs text-plum-soft">Intelligent Claims Operating System</p>
            </div>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black font-sans tracking-tight text-white leading-tight max-w-lg">
            From claim to settlement — powered by <span className="text-peach-primary">adaptive AI</span>.
          </h1>

          <p className="text-base text-plum-soft mt-4 max-w-md font-medium leading-relaxed">
            AI that knows when to act, when to ask, and when to escalate.
          </p>
        </div>

        {/* Miniature Workflow Visualizer */}
        <div className="my-8 relative z-10 bg-plum-secondary/70 p-5 rounded-2xl border border-plum-soft/20 backdrop-blur-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-peach-primary block mb-3">
            Autonomous Coordination Loop
          </span>

          <div className="flex items-center justify-between text-xs font-semibold gap-2">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-plum-deep text-plum-soft flex items-center justify-center border border-plum-soft/30">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 text-plum-soft">Claim</span>
            </div>

            <span className="text-peach-primary text-xs">→</span>

            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-peach-primary text-plum-deep flex items-center justify-center shadow-glow-peach ring-2 ring-peach-primary/30">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 font-bold text-white">Orchestrator</span>
            </div>

            <span className="text-peach-primary text-xs">→</span>

            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-plum-deep text-plum-soft flex items-center justify-center border border-plum-soft/30">
                <Eye className="w-4 h-4 text-peach-primary" />
              </div>
              <span className="text-[10px] mt-1 text-plum-soft">Agents</span>
            </div>

            <span className="text-peach-primary text-xs">→</span>

            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-plum-deep text-plum-soft flex items-center justify-center border border-plum-soft/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 text-plum-soft">Decision</span>
            </div>

            <span className="text-peach-primary text-xs">→</span>

            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-semantic-success text-white flex items-center justify-center shadow-soft">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 text-semantic-success font-bold">Settlement</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-plum-soft/60 relative z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-peach-primary" />
          <span>Slate Emerald & Fresh Mint • Role-Based Authentication</span>
        </div>
      </div>

      {/* Right Column: Strict 3-Choice Sign In Portal */}
      <div className="lg:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-xl mx-auto w-full">
        <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-3xl border border-plum-soft/80 shadow-modal">
          
          {/* Top 3-Way Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-ivory-warm border border-plum-soft mb-6">
            <button
              type="button"
              onClick={() => setMode('login-user')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                mode === 'login-user'
                  ? 'bg-peach-primary text-plum-deep shadow-glow-peach font-extrabold'
                  : 'text-ink-secondary hover:text-plum-deep hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Login User</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('login-officer')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                mode === 'login-officer'
                  ? 'bg-plum-deep text-white shadow-soft ring-1 ring-plum-secondary font-extrabold'
                  : 'text-ink-secondary hover:text-plum-deep hover:bg-white/60'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 flex-shrink-0 ${mode === 'login-officer' ? 'text-peach-primary' : ''}`} />
              <span className="truncate">Login Claim Officer</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('register-user')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                mode === 'register-user'
                  ? 'bg-peach-primary text-plum-deep shadow-glow-peach font-extrabold'
                  : 'text-ink-secondary hover:text-plum-deep hover:bg-white/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Register New User</span>
            </button>
          </div>

          {/* OPTION 1: LOGIN USER */}
          {mode === 'login-user' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-peach-light text-plum-deep font-bold text-[11px] mb-2 border border-peach-primary/30">
                  <User className="w-3 h-3 text-peach-primary" />
                  <span>Policyholder Portal</span>
                </div>
                <h2 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans">
                  Login User
                </h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Sign in to view your claims, upload photo evidence, and track instant payouts.
                </p>
              </div>

              <form onSubmit={handleUserLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-plum-deep mb-1.5">
                    User Email or Policy ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="arun.kumar@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-plum-deep">
                      Password
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => e.preventDefault()}
                      className="text-[11px] text-peach-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                {/* Pre-configured Demo Credential Prompt */}
                <div className="p-2.5 rounded-xl bg-peach-light/40 border border-peach-primary/20 flex items-center justify-between text-[11px]">
                  <span className="text-ink-secondary font-medium">
                    Demo User: <strong className="text-plum-deep">Arun Kumar</strong> (#POL-882910)
                  </span>
                  <span className="font-bold text-peach-primary">Verified</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-peach-primary hover:bg-peach-hover text-plum-deep font-extrabold text-xs shadow-glow-peach transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <User className="w-4 h-4" />
                  <span>Login User</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Alternative Quick Links */}
              <div className="pt-3 border-t border-plum-light flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-secondary">
                <button
                  type="button"
                  onClick={() => setMode('register-user')}
                  className="text-plum-deep hover:text-peach-primary font-semibold transition-colors"
                >
                  Need an account? <span className="text-peach-primary underline font-bold">Register as new user</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login-officer')}
                  className="text-ink-muted hover:text-plum-deep font-medium transition-colors"
                >
                  Staff? <span className="underline">Login claim officer</span>
                </button>
              </div>
            </div>
          )}

          {/* OPTION 2: LOGIN CLAIM OFFICER */}
          {mode === 'login-officer' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-plum-deep text-peach-primary font-bold text-[11px] mb-2 border border-plum-secondary">
                  <ShieldCheck className="w-3 h-3 text-peach-primary" />
                  <span>Claims Assessor Portal</span>
                </div>
                <h2 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans">
                  Login Claim Officer
                </h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Sign in to access the Claims Operations Cockpit, Live AI Orchestrator, and Human Review Queue.
                </p>
              </div>

              <form onSubmit={handleOfficerLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-plum-deep mb-1.5">
                    Officer Internal Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={officerEmail}
                      onChange={(e) => setOfficerEmail(e.target.value)}
                      placeholder="anand.officer@aiclaims.internal"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-plum-deep">
                      Password
                    </label>
                    <span className="text-[10px] text-ink-muted">Clearance: Level 3</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                {/* Officer Credential Prompt */}
                <div className="p-2.5 rounded-xl bg-ivory-warm border border-plum-soft/80 flex items-center justify-between text-[11px]">
                  <span className="text-ink-secondary font-medium">
                    Demo Officer: <strong className="text-plum-deep">Anand Officer</strong> (Sr. Assessor)
                  </span>
                  <span className="font-mono text-[10px] text-plum-deep font-bold bg-white px-2 py-0.5 rounded border border-plum-soft">
                    INTERNAL
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-plum-deep hover:bg-plum-secondary text-white font-extrabold text-xs shadow-soft transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <ShieldCheck className="w-4 h-4 text-peach-primary" />
                  <span>Login Claim Officer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Alternative Quick Links */}
              <div className="pt-3 border-t border-plum-light flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-secondary">
                <button
                  type="button"
                  onClick={() => setMode('login-user')}
                  className="text-plum-deep hover:text-peach-primary font-semibold transition-colors"
                >
                  Are you a customer? <span className="text-peach-primary underline font-bold">Login user</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register-user')}
                  className="text-ink-muted hover:text-plum-deep font-medium transition-colors"
                >
                  New customer? <span className="underline">Register as new user</span>
                </button>
              </div>
            </div>
          )}

          {/* OPTION 3: REGISTER AS NEW USER */}
          {mode === 'register-user' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-peach-light text-plum-deep font-bold text-[11px] mb-2 border border-peach-primary/30">
                  <UserPlus className="w-3 h-3 text-peach-primary" />
                  <span>New Customer Registration</span>
                </div>
                <h2 className="text-2xl font-extrabold text-plum-deep tracking-tight font-sans">
                  Register as New User
                </h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Create your verified policyholder account to submit AI claims and track direct settlements.
                </p>
              </div>

              <form onSubmit={handleRegisterUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-plum-deep mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-plum-deep mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="priya.sharma@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-plum-deep mb-1">
                    Policy Number / Vehicle Reg
                  </label>
                  <div className="relative">
                    <Car className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regPolicy}
                      onChange={(e) => setRegPolicy(e.target.value)}
                      placeholder="POL-992310 or KA-05-MH-2024"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-plum-deep mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-ivory-warm border border-plum-soft text-ink-primary font-medium focus:outline-none focus:border-peach-primary focus:ring-1 focus:ring-peach-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={regTerms}
                    onChange={(e) => setRegTerms(e.target.checked)}
                    className="rounded accent-peach-primary text-plum-deep"
                    required
                  />
                  <label htmlFor="terms" className="text-[11px] text-ink-secondary">
                    I agree to automated AI claim intake and policy verification terms
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-peach-primary hover:bg-peach-hover text-plum-deep font-extrabold text-xs shadow-glow-peach transition-all flex items-center justify-center gap-2 hover:scale-[1.01] mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register as New User</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Alternative Quick Links */}
              <div className="pt-3 border-t border-plum-light flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-secondary">
                <button
                  type="button"
                  onClick={() => setMode('login-user')}
                  className="text-plum-deep hover:text-peach-primary font-semibold transition-colors"
                >
                  Already registered? <span className="text-peach-primary underline font-bold">Login user</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login-officer')}
                  className="text-ink-muted hover:text-plum-deep font-medium transition-colors"
                >
                  Staff? <span className="underline">Login claim officer</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
