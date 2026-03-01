import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import api from '../../services/api';
import { toast } from 'sonner';
import { Activity, RefreshCw, Search, RotateCcw, Eye, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import rechargeService from '../../services/rechargeService';

const LiveTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const [txnRes, statsRes] = await Promise.all([
        api.recharge.getAll(500),
        api.recharge.getStats(),
      ]);
      setTransactions(txnRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (txnId) => {
    try {
      await api.recharge.retry(txnId);
      toast.success('Transaction retried');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Retry failed');
    }
  };

  const handleCheckStatus = async (txnId) => {
    try {
      const res = await api.recharge.checkStatus(txnId);
      toast.success(`Status: ${res.data.status?.toUpperCase()} - ${res.data.responseMessage || ''}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status check failed');
    }
  };

  const filtered = transactions.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.mobile?.includes(search) && !t.id?.includes(search)) return false;
    return true;
  });

  const statusColor = (s) => {
    switch(s) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'dispute': return 'bg-orange-100 text-orange-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const [changeStatusTxn, setChangeStatusTxn] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const handleChangeStatus = async () => {
    if (!changeStatusTxn || !newStatus) return;
    try {
      await api.recharge.changeStatus(changeStatusTxn.id, newStatus, statusNote);
      toast.success('Status updated successfully');
      setChangeStatusTxn(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change status');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="live-transactions">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Live Transactions</h2>
          <p className="text-muted-foreground">Monitor all recharge transactions in real-time</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh(!autoRefresh)} data-testid="auto-refresh-toggle">
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Auto Refresh'}
          </Button>
          <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.totalTransactions}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Today</p><p className="text-xl font-bold">{stats.todayTransactions}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Today Volume</p><p className="text-xl font-bold">₹{stats.todayVolume}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-yellow-600">{stats.pendingRecharges}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Success Rate</p><p className="text-xl font-bold text-accent">{stats.successRate}%</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search mobile/txn ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" data-testid="txn-search" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36" data-testid="txn-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="init">Init</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Txn ID</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Mobile</th>
                  <th className="text-left p-3 font-medium">Operator</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Provider Ref</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => (
                  <tr key={txn.id} className="border-b hover:bg-muted/50" data-testid={`txn-row-${txn.id}`}>
                    <td className="p-3 font-mono text-xs">{txn.id?.substring(0, 12)}...</td>
                    <td className="p-3 text-sm font-medium">{txn.userName || txn.userId}</td>
                    <td className="p-3 font-medium">{txn.mobile}</td>
                    <td className="p-3 text-sm">{txn.operatorName || txn.operatorId}</td>
                    <td className="p-3 font-semibold">₹{txn.amount}</td>
                    <td className="p-3"><Badge className={statusColor(txn.status)}>{txn.status?.toUpperCase()}</Badge></td>
                    <td className="p-3 text-xs font-mono">{txn.providerRef || '-'}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{new Date(txn.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTxn(txn)} data-testid={`view-txn-${txn.id}`}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { setChangeStatusTxn(txn); setNewStatus(''); setStatusNote(''); }} data-testid={`edit-status-${txn.id}`}><Edit className="w-4 h-4" /></Button>
                        {txn.status === 'failed' && (
                          <Button size="sm" variant="outline" onClick={() => handleRetry(txn.id)} data-testid={`retry-txn-${txn.id}`}><RotateCcw className="w-4 h-4" /></Button>
                        )}
                        {txn.status === 'pending' && (
                          <Button size="sm" variant="outline" className="text-yellow-600" onClick={() => handleCheckStatus(txn.id)} data-testid={`check-txn-${txn.id}`}><RefreshCw className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="9" className="text-center text-muted-foreground py-8">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTxn} onOpenChange={(open) => !open && setSelectedTxn(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transaction Details</DialogTitle></DialogHeader>
          {selectedTxn && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Transaction ID</p><p className="font-mono text-xs break-all">{selectedTxn.id}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Status</p><Badge className={statusColor(selectedTxn.status)}>{selectedTxn.status?.toUpperCase()}</Badge></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">User</p><p className="font-medium">{selectedTxn.userName || selectedTxn.userId}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Operator</p><p className="font-medium">{selectedTxn.operatorName || selectedTxn.operatorId}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Mobile</p><p className="font-medium">{selectedTxn.mobile}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-accent">₹{selectedTxn.amount}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Commission</p><p className="font-medium">₹{selectedTxn.commission || 0}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Provider Ref</p><p className="font-mono text-xs">{selectedTxn.providerRef || '-'}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Response Code</p><p className="font-mono">{selectedTxn.responseCode || '-'}</p></div>
                <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Response Message</p><p className="text-sm">{selectedTxn.responseMessage || '-'}</p></div>
              </div>
              <div className="p-3 bg-muted/50 rounded"><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(selectedTxn.createdAt).toLocaleString()}</p></div>
              {selectedTxn.status === 'failed' && (
                <Button className="w-full bg-accent hover:bg-accent-hover" onClick={() => { handleRetry(selectedTxn.id); setSelectedTxn(null); }}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Retry Transaction
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={!!changeStatusTxn} onOpenChange={(open) => !open && setChangeStatusTxn(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Change Transaction Status</DialogTitle></DialogHeader>
          {changeStatusTxn && (
            <div className="space-y-4" data-testid="change-status-dialog-live">
              <p className="text-sm">Txn: <span className="font-mono">{changeStatusTxn.id?.slice(0, 12)}...</span> | ₹{changeStatusTxn.amount} | Current: <Badge className={statusColor(changeStatusTxn.status)}>{changeStatusTxn.status}</Badge></p>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="live-select-new-status"><SelectValue placeholder="Select new status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Note</Label>
                <Textarea placeholder="Reason for status change..." value={statusNote} onChange={e => setStatusNote(e.target.value)} data-testid="live-admin-note" />
              </div>
              <Button onClick={handleChangeStatus} disabled={!newStatus} className="w-full" data-testid="live-confirm-status-btn">
                Confirm Status Change
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveTransactions;
