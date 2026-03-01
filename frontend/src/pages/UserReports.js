import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../services/api';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, Activity, CheckCircle2 } from 'lucide-react';

const UserReports = () => {
  const [transactions, setTransactions] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [txnRes, ledgerRes, statsRes] = await Promise.all([
        api.recharge.getMy(200),
        api.wallet.getLedger(200),
        api.reports.getDashboardStats(),
      ]);
      setTransactions(txnRes.data);
      setLedger(ledgerRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = filter === 'all' ? transactions : transactions.filter(t => t.status === filter);

  const statusColor = (s) => {
    switch(s) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  const successCount = transactions.filter(t => t.status === 'success').length;
  const failedCount = transactions.filter(t => t.status === 'failed').length;

  return (
    <div className="space-y-6" data-testid="user-reports">
      <h2 className="text-3xl font-heading font-bold">Reports</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Txns</p><p className="text-2xl font-bold">{transactions.length}</p></div><Activity className="w-7 h-7 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Success</p><p className="text-2xl font-bold text-accent">{successCount}</p></div><CheckCircle2 className="w-7 h-7 text-accent" /></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Failed</p><p className="text-2xl font-bold text-destructive">{failedCount}</p></div><TrendingUp className="w-7 h-7 text-destructive" /></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Balance</p><p className="text-2xl font-bold">₹{stats?.walletBalance?.toFixed(0) || 0}</p></div><DollarSign className="w-7 h-7 text-orange-500" /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="ledger" data-testid="tab-ledger">Wallet Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-36" data-testid="report-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left p-3">Date</th><th className="text-left p-3">Mobile</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Commission</th></tr></thead>
                  <tbody>
                    {filteredTxns.map(txn => (
                      <tr key={txn.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-xs whitespace-nowrap">{new Date(txn.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-medium">{txn.mobile}</td>
                        <td className="p-3 font-semibold">₹{txn.amount}</td>
                        <td className="p-3"><Badge className={statusColor(txn.status)}>{txn.status?.toUpperCase()}</Badge></td>
                        <td className="p-3 text-accent">₹{txn.commission || 0}</td>
                      </tr>
                    ))}
                    {filteredTxns.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No transactions</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader><CardTitle>Wallet Ledger</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left p-3">Date</th><th className="text-left p-3">Remark</th><th className="text-right p-3">Debit</th><th className="text-right p-3">Credit</th><th className="text-right p-3">Balance</th></tr></thead>
                  <tbody>
                    {ledger.map((entry, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-xs whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="p-3">{entry.remark}</td>
                        <td className="p-3 text-right text-destructive">{entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}</td>
                        <td className="p-3 text-right text-accent">{entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}</td>
                        <td className="p-3 text-right font-semibold">₹{entry.balanceAfter.toFixed(2)}</td>
                      </tr>
                    ))}
                    {ledger.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No entries</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserReports;
