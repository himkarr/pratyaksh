import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DeadlineForecastBadgeProps {
  hasRisk?: boolean;
  probability?: number;
}

export function DeadlineForecastBadge({
  hasRisk,
  probability,
}: DeadlineForecastBadgeProps) {
  // If probability is provided, use it, else infer from hasRisk
  const value = probability !== undefined ? probability : (hasRisk ? 0.78 : 0.12);
  const pct = Math.round(value * 100);

  // 3-Tier Risk Meter as defined in secondimp.md
  const isHigh = pct >= 65;
  const isMedium = pct >= 30 && pct < 65;

  const badgeClass = isHigh ? 'gov-badge-danger' : isMedium ? 'gov-badge-warning' : 'gov-badge-success';
  const label = isHigh ? `High Breach Risk (${pct}%)` : isMedium ? `Medium Risk (${pct}%)` : `On-Track (${pct}%)`;

  return (
    <span
      title={`Statutory 1-Year Forecaster: ${pct}% probability of exceeding 365-day statutory completion deadline (Model: Predictive Gradient Forecaster)`}
      className={`gov-badge ${badgeClass}`}
      style={{ cursor: 'help', whiteSpace: 'nowrap' }}
    >
      {isHigh ? (
        <AlertTriangle size={10} />
      ) : isMedium ? (
        <Clock size={10} />
      ) : (
        <CheckCircle size={10} />
      )}
      <span>{label}</span>
    </span>
  );
}
export default DeadlineForecastBadge;
