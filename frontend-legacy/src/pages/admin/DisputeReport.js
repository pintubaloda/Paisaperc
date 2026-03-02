import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import adminService from '../../services/adminService';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const DisputeReport = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [action, setAction] = useState('');
  const [note, setNote] = useState('');
  const [showAll, setShowAll] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = showAll ? await adminService.getDisputes() : await adminService.getUnresolvedDisputes();
      setDisputes(res.data);
    } catch {}
    setLoading(false);
  }, [showAll]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleResolve = async () => {
    if (!selectedDispute || !action) return;
    try {
      await adminService.resolveDispute(selectedDispute.id, { action, note });
      setResolveDialog(false);
      fetchDisputes();
    } catch {}
  };

  const openResolve = (d) => {
    setSelectedDispute(d);
    setAction('');
    setNote('');
    setResolveDialog(true);
  };

  return (
    <div className="space-y-6" data-testid="dispute-report-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="dispute-report-title">
            <AlertTriangle className="w-6 h-6 text-orange-500" /> Dispute Report
          </h1>
          <p className="text-muted-foreground text-sm">Failed transactions that received success webhook — admin manual decision required</p>
        </div>
        <div className="flex gap-2">
          <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll(!showAll)} data-testid="toggle-all-disputes">
            {showAll ? 'Show Unresolved' : 'Show All'}
          </Button>
          <Button variant="outline" onClick={fetchDisputes} disabled={loading} data-testid="refresh-disputes-btn">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full" data-testid="disputes-table">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-sm">Txn ID</th>
              <th className="text-left p-3 font-medium text-sm">Mobile</th>
              <th className="text-left p-3 font-medium text-sm">Operator</th>
              <th className="text-left p-3 font-medium text-sm">Amount</th>
              <th className="text-left p-3 font-medium text-sm">Our Status</th>
              <th className="text-left p-3 font-medium text-sm">Webhook</th>
              <th className="text-left p-3 font-medium text-sm">Resolved</th>
              <th className="text-left p-3 font-medium text-sm">Date</th>
              <th className="text-left p-3 font-medium text-sm">Actions</th>
            </tr></thead>
            <tbody>
              {disputes.map(d => (
                <tr key={d.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{d.txnId?.slice(0, 8)}...</td>
                  <td className="p-3 font-medium">{d.mobile}</td>
                  <td className="p-3 text-sm">{d.operatorName}</td>
                  <td className="p-3 font-semibold">₹{d.amount}</td>
                  <td className="p-3"><Badge variant="destructive">{d.originalStatus}</Badge></td>
                  <td className="p-3"><Badge className="bg-green-100 text-green-800">{d.webhookStatus}</Badge></td>
                  <td className="p-3">
                    {d.resolved ? (
                      <Badge variant="outline" className="text-green-600">{d.adminAction}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">Pending</Badge>
                    )}
                  </td>
                  <td className="p-3 text-xs">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    {!d.resolved && (
                      <Button size="sm" onClick={() => openResolve(d)} data-testid={`resolve-dispute-${d.id}`}>
                        Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {disputes.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted-foreground py-8">
                  {showAll ? 'No disputes found' : 'No unresolved disputes'}
                </td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Resolve Dispute Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Resolve Dispute</DialogTitle></DialogHeader>
          {selectedDispute && (
            <div className="space-y-4" data-testid="resolve-dispute-dialog">
              <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm">
                <p><strong>Transaction:</strong> {selectedDispute.txnId}</p>
                <p><strong>Mobile:</strong> {selectedDispute.mobile} | <strong>Amount:</strong> ₹{selectedDispute.amount}</p>
                <p><strong>Our Record:</strong> <span className="text-red-600 font-semibold">{selectedDispute.originalStatus}</span></p>
                <p><strong>Webhook Says:</strong> <span className="text-green-600 font-semibold">{selectedDispute.webhookStatus}</span></p>
              </div>
              <div className="space-y-2">
                <Label>Decision</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger data-testid="dispute-action-select"><SelectValue placeholder="Select action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept_success">Accept as Success (mark success, debit refund back, credit commission)</SelectItem>
                    <SelectItem value="reject_keep_failed">Reject (keep as failed, user keeps refund)</SelectItem>
                    <SelectItem value="manual_credit">Manual Credit (keep status, credit amount separately)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Note</Label>
                <Textarea placeholder="Reason for decision..." value={note} onChange={e => setNote(e.target.value)} data-testid="dispute-note-input" />
              </div>
              <Button onClick={handleResolve} disabled={!action} className="w-full" data-testid="confirm-resolve-btn">
                Confirm Resolution
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisputeReport;
