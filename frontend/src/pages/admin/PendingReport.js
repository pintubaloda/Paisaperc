import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import rechargeService from '../../services/rechargeService';
import { RefreshCw, Eye, RotateCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PendingReport = () => {
  const [pendingTxns, setPendingTxns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retryDialog, setRetryDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rechargeService.getPendingTransactions();
      setPendingTxns(res.data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleBulkResolve = async () => {
    setBulkLoading(true);
    try {
      const res = await rechargeService.bulkResolve();
      setBulkResult(res.data);
      fetchPending();
    } catch { }
    setBulkLoading(false);
  };

  const handleViewDetail = async (txnId) => {
    setDetailLoading(true);
    try {
      const res = await rechargeService.getTransactionDetail(txnId);
      setSelectedTxn(res.data);
      setRetryDialog(true);
    } catch { }
    setDetailLoading(false);
  };

  const handleCheckStatus = async (txnId) => {
    try {
      await rechargeService.checkStatus(txnId);
      fetchPending();
    } catch { }
  };

  const handleRetryWithApi = async () => {
    if (!selectedTxn || !selectedApiId) return;
    try {
      await rechargeService.retryWithApi(selectedTxn.id, selectedApiId);
      setRetryDialog(false);
      fetchPending();
    } catch { }
  };

  const handleChangeStatus = async () => {
    if (!selectedTxn || !newStatus) return;
    try {
      await rechargeService.changeStatus(selectedTxn.id, newStatus, statusNote);
      setStatusDialog(false);
      fetchPending();
    } catch { }
  };

  const openStatusDialog = (txn) => {
    setSelectedTxn(txn);
    setNewStatus('');
    setStatusNote('');
    setStatusDialog(true);
  };

  const filtered = pendingTxns.filter(t =>
    !search || t.mobile?.includes(search) || t.id?.includes(search) || t.operatorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="pending-report-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="pending-report-title">Pending Transactions</h1>
          <p className="text-muted-foreground text-sm">{pendingTxns.length} pending transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPending} disabled={loading} data-testid="refresh-pending-btn">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={handleBulkResolve} disabled={bulkLoading || pendingTxns.length === 0} data-testid="bulk-resolve-btn">
            {bulkLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
            Bulk Resolve All
          </Button>
        </div>
      </div>

      {bulkResult && (
        <Card className="bg-blue-50 border-blue-200" data-testid="bulk-result-card">
          <CardContent className="p-4 flex gap-6 text-sm">
            <span>Total: <strong>{bulkResult.total}</strong></span>
            <span className="text-green-600">Resolved: <strong>{bulkResult.resolved}</strong></span>
            <span className="text-red-600">Failed: <strong>{bulkResult.failed}</strong></span>
            <span className="text-yellow-600">Still Pending: <strong>{bulkResult.stillPending}</strong></span>
          </CardContent>
        </Card>
      )}

      <Input placeholder="Search by mobile, txn ID, operator..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" data-testid="pending-search" />

      <Card>
        <CardContent className="p-0">
          <table className="w-full" data-testid="pending-table">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-sm">Txn ID</th>
              <th className="text-left p-3 font-medium text-sm">User</th>
              <th className="text-left p-3 font-medium text-sm">Mobile</th>
              <th className="text-left p-3 font-medium text-sm">Operator</th>
              <th className="text-left p-3 font-medium text-sm">Amount</th>
              <th className="text-left p-3 font-medium text-sm">Message</th>
              <th className="text-left p-3 font-medium text-sm">Date</th>
              <th className="text-left p-3 font-medium text-sm">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(txn => (
                <tr key={txn.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{txn.id?.slice(0, 8)}...</td>
                  <td className="p-3 text-sm">{txn.userName || txn.userId?.slice(0, 8)}</td>
                  <td className="p-3 font-medium">{txn.mobile}</td>
                  <td className="p-3 text-sm">{txn.operatorName || txn.operatorId}</td>
                  <td className="p-3 font-semibold">₹{txn.amount}</td>
                  <td className="p-3 text-xs text-muted-foreground">{txn.responseMessage}</td>
                  <td className="p-3 text-xs">{new Date(txn.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetail(txn.id)} data-testid={`view-detail-${txn.id}`}>
                        <Eye className="w-3 h-3 mr-1" /> Detail
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCheckStatus(txn.id)} data-testid={`check-status-${txn.id}`}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Check
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openStatusDialog(txn)} data-testid={`change-status-${txn.id}`}>
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted-foreground py-8">No pending transactions</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Retry Dialog with Transaction Detail */}
      <Dialog open={retryDialog} onOpenChange={setRetryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Transaction Detail & Retry</DialogTitle></DialogHeader>
          {selectedTxn && (
            <div className="space-y-4" data-testid="retry-dialog">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Txn ID</p><p className="font-mono text-xs">{selectedTxn.id}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Status</p><Badge variant={selectedTxn.status === 'pending' ? 'outline' : 'default'}>{selectedTxn.status}</Badge></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Mobile</p><p className="font-medium">{selectedTxn.mobile}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Operator</p><p className="font-medium">{selectedTxn.operatorName || selectedTxn.operatorId}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Amount</p><p className="font-semibold">₹{selectedTxn.amount}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Provider Ref</p><p className="text-sm">{selectedTxn.providerRef || 'N/A'}</p></div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">API Request</Label>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-32" data-testid="api-request-detail">
                  {selectedTxn.apiRequest ? JSON.stringify(JSON.parse(selectedTxn.apiRequest), null, 2) : 'N/A (Sandbox)'}
                </pre>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">API Response</Label>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-32" data-testid="api-response-detail">
                  {selectedTxn.apiResponse ? JSON.stringify(JSON.parse(selectedTxn.apiResponse), null, 2) : 'N/A (Sandbox)'}
                </pre>
              </div>

              {selectedTxn.availableApis?.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="font-semibold">Retry with Different API</Label>
                  <Select value={selectedApiId} onValueChange={setSelectedApiId}>
                    <SelectTrigger data-testid="select-retry-api"><SelectValue placeholder="Select API for retry" /></SelectTrigger>
                    <SelectContent>
                      {selectedTxn.availableApis.filter(a => a.isActive).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.apiType})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleRetryWithApi} disabled={!selectedApiId} className="w-full" data-testid="retry-with-api-btn">
                    <RotateCcw className="w-4 h-4 mr-2" /> Retry Transaction
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Change Status Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Change Transaction Status</DialogTitle></DialogHeader>
          {selectedTxn && (
            <div className="space-y-4" data-testid="change-status-dialog">
              <p className="text-sm">Txn: <span className="font-mono">{selectedTxn.id?.slice(0, 12)}...</span> | ₹{selectedTxn.amount} | {selectedTxn.mobile}</p>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-new-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Note</Label>
                <Textarea placeholder="Reason for status change..." value={statusNote} onChange={e => setStatusNote(e.target.value)} data-testid="admin-note-input" />
              </div>
              <Button onClick={handleChangeStatus} disabled={!newStatus} className="w-full" data-testid="confirm-status-change-btn">
                Confirm Status Change
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingReport;
