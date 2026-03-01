import React, { useState, useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import rechargeService from '../services/rechargeService';
import {
  Wallet, Send, CheckCircle, XCircle, Clock, RefreshCw,
  AlertTriangle, ArrowRight, Shield, GitBranch, Loader2
} from 'lucide-react';

const eventConfig = {
  wallet_debit:     { icon: Wallet,        color: 'bg-blue-500',   label: 'Wallet Debit' },
  txn_created:      { icon: Send,          color: 'bg-slate-500',  label: 'Transaction Created' },
  routing:          { icon: GitBranch,     color: 'bg-purple-500', label: 'Routing' },
  api_call:         { icon: ArrowRight,    color: 'bg-indigo-500', label: 'API Call' },
  api_response:     { icon: RefreshCw,     color: 'bg-cyan-500',   label: 'API Response' },
  api_error:        { icon: XCircle,       color: 'bg-red-400',    label: 'API Error' },
  txn_success:      { icon: CheckCircle,   color: 'bg-green-500',  label: 'Success' },
  txn_failed:       { icon: XCircle,       color: 'bg-red-500',    label: 'Failed' },
  txn_pending:      { icon: Clock,         color: 'bg-yellow-500', label: 'Pending' },
  commission_credit:{ icon: Wallet,        color: 'bg-green-400',  label: 'Commission' },
  refund:           { icon: Wallet,        color: 'bg-orange-400', label: 'Refund' },
  status_check:     { icon: RefreshCw,     color: 'bg-blue-400',   label: 'Status Check' },
  status_resolved:  { icon: CheckCircle,   color: 'bg-green-500',  label: 'Resolved' },
  status_still_pending: { icon: Clock,     color: 'bg-yellow-400', label: 'Still Pending' },
  webhook_received: { icon: ArrowRight,    color: 'bg-teal-500',   label: 'Webhook' },
  dispute_created:  { icon: AlertTriangle, color: 'bg-orange-500', label: 'Dispute' },
  admin_status_change: { icon: Shield,     color: 'bg-violet-500', label: 'Admin Action' },
};

const statusBadgeColor = (status) => {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800';
    case 'failed':  return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'dispute': return 'bg-orange-100 text-orange-800';
    default:        return 'bg-gray-100 text-gray-800';
  }
};

const TransactionTimeline = ({ txnId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!txnId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await rechargeService.getTimeline(txnId);
        setEvents(res.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [txnId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="timeline-loading">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading timeline...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6 text-sm" data-testid="timeline-empty">
        No timeline events recorded for this transaction.
      </div>
    );
  }

  return (
    <div className="relative" data-testid="transaction-timeline">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-0">
        {events.map((evt, idx) => {
          const cfg = eventConfig[evt.event] || { icon: Clock, color: 'bg-gray-400', label: evt.event };
          const Icon = cfg.icon;
          const isLast = idx === events.length - 1;
          const time = new Date(evt.createdAt);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div key={evt.id || idx} className="relative flex items-start gap-4 pb-4" data-testid={`timeline-event-${evt.event}`}>
              {/* Node */}
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${cfg.color} text-white shrink-0 shadow-sm ${isLast ? 'ring-2 ring-offset-2 ring-offset-background ring-current' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{cfg.label}</span>
                  {evt.status && <Badge className={`text-[10px] px-1.5 py-0 ${statusBadgeColor(evt.status)}`}>{evt.status}</Badge>}
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{dateStr} {timeStr}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{evt.description}</p>
                {evt.meta && Object.keys(evt.meta).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Object.entries(evt.meta).filter(([k]) => k !== 'webhookData').map(([k, v]) => (
                      <span key={k} className="inline-flex items-center text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                        {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionTimeline;
