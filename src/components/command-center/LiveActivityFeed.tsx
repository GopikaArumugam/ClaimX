import React from 'react';
import { ActivityEvent } from '../../types/claims';
import { Sparkles, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';

interface LiveActivityFeedProps {
  events: ActivityEvent[];
  onSelectClaim?: (claimId: string) => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ events, onSelectClaim }) => {
  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'success':
      case 'decision':
        return <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success" />;
      case 'alert':
        return <AlertCircle className="w-3.5 h-3.5 text-semantic-danger" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-semantic-warning" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-peach-primary" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-plum-soft/80 shadow-soft h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-plum-light">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-peach-primary animate-ping" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-deep">
            Real-Time Agent Activity Stream
          </h3>
        </div>
        <span className="text-[10px] text-ink-muted font-mono">Live Telemetry</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[290px]">
        {events.slice(0, 10).map((event) => (
          <div
            key={event.id}
            onClick={() => event.claimId && onSelectClaim?.(event.claimId)}
            className="p-2.5 rounded-xl bg-ivory-warm/60 border border-plum-soft/60 hover:bg-white hover:border-plum-secondary/30 transition-all text-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {getEventIcon(event.type)}
                <span className="font-bold text-plum-deep text-[11px]">
                  {event.agentName || 'System Orchestrator'}
                </span>
                {event.claimId && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-plum-light text-plum-deep">
                    {event.claimId}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-ink-muted font-mono">{event.timestamp}</span>
            </div>

            <p className="text-ink-secondary text-[11px] leading-relaxed group-hover:text-ink-primary transition-colors">
              {event.action}
            </p>

            <div className="flex items-center justify-between mt-1.5 text-[10px]">
              {event.confidence !== undefined && (
                <span className="font-mono text-plum-deep font-semibold">
                  Confidence: {event.confidence}%
                </span>
              )}
              {event.amount !== undefined && (
                <span className="font-mono text-semantic-success font-bold">
                  Amount: ₹{event.amount.toLocaleString('en-IN')}
                </span>
              )}
              {event.claimId && (
                <span className="ml-auto text-peach-primary font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Inspect <ArrowRight className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
