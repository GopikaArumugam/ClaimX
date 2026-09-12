import React, { useEffect, useState } from 'react';
import { notificationService, ToastNotification } from '../../services/notificationService';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  if (notifications.length === 0) return null;

  const getIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-semantic-success flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-semantic-warning flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-semantic-danger flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-peach-primary flex-shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-semantic-success';
      case 'warning':
        return 'border-l-4 border-l-semantic-warning';
      case 'error':
        return 'border-l-4 border-l-semantic-danger';
      default:
        return 'border-l-4 border-l-peach-primary';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto bg-white rounded-xl shadow-modal border border-plum-soft p-4 flex items-start gap-3 transition-all animate-slide-up ${getBorderColor(
            n.type
          )}`}
        >
          {getIcon(n.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-plum-deep uppercase tracking-wider">{n.title}</h4>
              <span className="text-[10px] text-ink-muted">{n.timestamp}</span>
            </div>
            <p className="text-xs text-ink-primary mt-1 line-clamp-2">{n.message}</p>
          </div>
          <button
            onClick={() => notificationService.remove(n.id)}
            className="text-ink-muted hover:text-plum-deep p-0.5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
