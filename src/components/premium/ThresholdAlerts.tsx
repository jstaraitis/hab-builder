import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import type { ThresholdAlert, AlertSeverity } from '../../types/thresholds';

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: React.ReactNode;
  borderClass: string;
  bgClass: string;
  titleClass: string;
  iconClass: string;
}> = {
  urgent: {
    icon: <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />,
    borderClass: 'border-red-500/30',
    bgClass: 'bg-red-500/8',
    titleClass: 'text-red-300',
    iconClass: 'text-red-400',
  },
  warning: {
    icon: <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />,
    borderClass: 'border-amber-400/30',
    bgClass: 'bg-amber-500/8',
    titleClass: 'text-amber-300',
    iconClass: 'text-amber-400',
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />,
    borderClass: 'border-blue-400/30',
    bgClass: 'bg-blue-500/8',
    titleClass: 'text-blue-300',
    iconClass: 'text-blue-400',
  },
};

function AlertCard({ alert }: { alert: ThresholdAlert }) {
  const navigate = useNavigate();
  const config = SEVERITY_CONFIG[alert.severity];

  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${config.borderClass} ${config.bgClass}`}>
      {config.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${config.titleClass}`}>{alert.title}</p>
        <p className="text-xs text-muted mt-1 leading-relaxed">{alert.body}</p>
        {alert.actionLabel && alert.actionPath && (
          <button
            type="button"
            onClick={() => navigate(alert.actionPath!)}
            className={`mt-2 flex items-center gap-1 text-xs font-medium active:opacity-70 transition-opacity ${config.titleClass}`}
          >
            {alert.actionLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ThresholdAlertsProps {
  alerts: ThresholdAlert[];
}

export function ThresholdAlerts({ alerts }: ThresholdAlertsProps) {
  return (
    <div className="bg-card border border-divider rounded-2xl overflow-hidden mx-4">
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-3">
        <AlertCircle className="w-4 h-4 text-accent" />
        <h3 className="text-med font-bold text-white">Health Alerts</h3>
        {alerts.length > 0 && (
          <span className="ml-auto text-xs font-medium text-muted">
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
          </span>
        )}
      </div>

      <div className="px-4 pb-4 space-y-2">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2.5 py-2">
            <p className="text-sm text-muted">No health concerns detected! Keep up the good work :)</p>
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}
