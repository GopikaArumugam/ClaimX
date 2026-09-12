export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  claimId?: string;
}

type NotificationListener = (notifications: ToastNotification[]) => void;

class NotificationService {
  private notifications: ToastNotification[] = [];
  private listeners: Set<NotificationListener> = new Set();

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    listener(this.notifications);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  add(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', claimId?: string) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      claimId,
    };

    this.notifications = [newToast, ...this.notifications.slice(0, 4)];
    this.notify();

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }
}

export const notificationService = new NotificationService();
