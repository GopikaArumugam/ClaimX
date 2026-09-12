import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  subtext?: string;
  trend?: string;
  trendPositive?: boolean;
  icon: LucideIcon;
  badgeText?: string;
  accent?: 'default' | 'peach' | 'plum' | 'warning' | 'danger' | 'success';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  format = 'number',
  subtext,
  trend,
  trendPositive = true,
  icon: Icon,
  badgeText,
  accent = 'default',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const formattedValue = () => {
    if (format === 'currency') {
      return `₹${displayValue.toLocaleString('en-IN')}`;
    }
    if (format === 'percent') {
      return `${displayValue}%`;
    }
    return displayValue.toLocaleString('en-IN');
  };

  const getAccentStyles = () => {
    switch (accent) {
      case 'peach':
        return {
          iconBg: 'bg-peach-light text-peach-primary border border-peach-primary/30',
          borderHover: 'hover:border-peach-primary/60',
        };
      case 'plum':
        return {
          iconBg: 'bg-plum-soft text-plum-deep border border-plum-secondary/30',
          borderHover: 'hover:border-plum-deep/50',
        };
      case 'danger':
        return {
          iconBg: 'bg-semantic-dangerBg text-semantic-danger border border-semantic-danger/30',
          borderHover: 'hover:border-semantic-danger/50',
        };
      case 'warning':
        return {
          iconBg: 'bg-semantic-warningBg text-semantic-warning border border-semantic-warning/30',
          borderHover: 'hover:border-semantic-warning/50',
        };
      case 'success':
        return {
          iconBg: 'bg-semantic-successBg text-semantic-success border border-semantic-success/30',
          borderHover: 'hover:border-semantic-success/50',
        };
      default:
        return {
          iconBg: 'bg-plum-soft/50 text-plum-secondary border border-plum-soft',
          borderHover: 'hover:border-plum-secondary/40',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      className={`relative bg-white rounded-xl p-5 border border-plum-soft/80 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 ${styles.borderHover}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl lg:text-3xl font-bold font-sans tracking-tight text-plum-deep">
              {formattedValue()}
            </h3>
            {badgeText && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-plum-light text-plum-deep border border-plum-soft">
                {badgeText}
              </span>
            )}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-secondary pt-2 border-t border-plum-light">
        {trend && (
          <span
            className={`font-semibold flex items-center gap-0.5 ${
              trendPositive ? 'text-semantic-success' : 'text-semantic-danger'
            }`}
          >
            {trend}
          </span>
        )}
        {subtext && <span className="text-ink-secondary">{subtext}</span>}
      </div>
    </div>
  );
};
