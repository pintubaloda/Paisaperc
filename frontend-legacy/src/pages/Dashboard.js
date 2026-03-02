import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Wallet, TrendingUp, Activity, DollarSign } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, txnRes] = await Promise.all([
        api.reports.getDashboardStats(),
        api.recharge.getMy(5),
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
      title: 'Wallet Balance',
      value: `₹${stats?.walletBalance?.toFixed(2) || '0.00'}`,
      icon: <Wallet className="w-8 h-8 text-accent" />,
      bg: 'bg-accent/10',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      icon: <Activity className="w-8 h-8 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Volume',
      value: `₹${stats?.totalVolume?.toFixed(2) || '0.00'}`,
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      title: 'Today Volume',
      value: `₹${stats?.todayVolume?.toFixed(2) || '0.00'}`,
      icon: <DollarSign className="w-8 h-8 text-green-600" />,
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6" data-testid="user-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${index}`}>
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
            <div className="space-y-4">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`transaction-${txn.id}`}
                >
                  <div>
                    <p className="font-medium">{txn.mobile}</p>
                    <p className="text-sm text-muted-foreground">{new Date(txn.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{txn.amount}</p>
                    <p className={`text-sm ${
                      txn.status === 'success' ? 'text-accent' :
                      txn.status === 'failed' ? 'text-destructive' : 'text-yellow-600'
                    }`}>
                      {txn.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
