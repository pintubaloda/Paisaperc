import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Activity, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, txnRes] = await Promise.all([
        api.reports.getAdminDashboard(),
        api.recharge.getAll(10),
      ]);
      setStats(statsRes.data);
      setTransactions(txnRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <Users className="w-8 h-8 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      icon: <Activity className="w-8 h-8 text-accent" />,
      bg: 'bg-accent/10',
    },
    {
      title: 'Total Volume',
      value: `₹${stats?.totalVolume?.toFixed(2) || '0.00'}`,
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      title: 'Pending Recharges',
      value: stats?.pendingRecharges || 0,
      icon: <AlertCircle className="w-8 h-8 text-yellow-600" />,
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} data-testid={`admin-stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold font-heading">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User ID</th>
                    <th className="text-left p-3 font-medium">Mobile</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b hover:bg-muted/50" data-testid={`admin-txn-${txn.id}`}>
                      <td className="p-3 font-mono text-sm">{txn.userId.slice(0, 8)}...</td>
                      <td className="p-3">{txn.mobile}</td>
                      <td className="p-3 font-semibold">₹{txn.amount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          txn.status === 'success' ? 'bg-accent/10 text-accent' :
                          txn.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {txn.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(txn.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
