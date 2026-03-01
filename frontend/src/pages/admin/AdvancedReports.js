import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import api from '../../services/api';
import { toast } from 'sonner';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';

const AdvancedReports = () => {
  const [transactions, setTransactions] = useState([]);
  const [failedTxns, setFailedTxns] = useState([]);
  const [pendingTxns, setPendingTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txnsRes, failedRes, pendingRes] = await Promise.all([
        api.recharge.getAll(200),
        api.recharge.getFailed(100),
        api.recharge.getPending(100),
      ]);
      setTransactions(txnsRes.data);
      setFailedTxns(failedRes.data);
      setPendingTxns(pendingRes.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (txnId) => {
    try {
      await api.recharge.retry(txnId);
      toast.success('Transaction retry initiated');
      setTimeout(fetchData, 2000);
    } catch (error) {
      toast.error('Retry failed');
    }
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) return <div className="text-center py-12">Loading reports...</div>;

  const successRate = transactions.length > 0
    ? ((transactions.filter(t => t.status === 'success').length / transactions.length) * 100).toFixed(2)
    : 0;

  return (
    <div className="space-y-6" data-testid="advanced-reports">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Advanced Reports & Analytics</h2>
          <p className="text-muted-foreground">Transaction monitoring and reconciliation</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-accent">{successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Failed</p>
            <p className="text-2xl font-bold text-destructive">{failedTxns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingTxns.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedTxns.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTxns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <Button size="sm" onClick={() => exportToCSV(transactions, 'all-transactions')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Mobile</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Commission</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 50).map((txn) => (
                      <tr key={txn.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-xs">{txn.id.slice(0, 8)}...</td>
                        <td className="p-3 text-sm font-medium">{txn.userName || txn.userId}</td>
                        <td className="p-3">{txn.mobile}</td>
                        <td className="p-3 font-semibold">₹{txn.amount}</td>
                        <td className="p-3 text-accent">₹{txn.commission}</td>
                        <td className="p-3">
                          <Badge className={txn.status === 'success' ? 'bg-accent' : txn.status === 'failed' ? 'bg-destructive' : 'bg-yellow-600'}>
                            {txn.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span>Failed Transactions</span>
                </CardTitle>
                <Button size="sm" onClick={() => exportToCSV(failedTxns, 'failed-transactions')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Mobile</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Error</th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedTxns.map((txn) => (
                      <tr key={txn.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-xs">{txn.id.slice(0, 8)}...</td>
                        <td className="p-3">{txn.mobile}</td>
                        <td className="p-3 font-semibold">₹{txn.amount}</td>
                        <td className="p-3 text-sm text-destructive">{txn.responseMessage || 'N/A'}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Button size="sm" onClick={() => handleRetry(txn.id)}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {failedTxns.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No failed transactions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Transactions</CardTitle>
                <Button size="sm" onClick={() => exportToCSV(pendingTxns, 'pending-transactions')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Mobile</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Message</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTxns.map((txn) => (
                      <tr key={txn.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-xs">{txn.id.slice(0, 8)}...</td>
                        <td className="p-3">{txn.mobile}</td>
                        <td className="p-3 font-semibold">₹{txn.amount}</td>
                        <td className="p-3 text-sm text-yellow-600">{txn.responseMessage || 'Processing...'}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingTxns.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending transactions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedReports;
