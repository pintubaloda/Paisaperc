import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import adminService from '../../services/adminService';
import { Activity, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const ReconciliationPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReconciliationReport();
      setReport(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const runReconciliation = async () => {
    setRunning(true);
    try {
      await adminService.runReconciliation();
      fetchReport();
    } catch {}
    setRunning(false);
  };

  return (
    <div className="space-y-6" data-testid="reconciliation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="reconciliation-title">
            <Activity className="w-6 h-6" /> Reconciliation
          </h1>
          <p className="text-muted-foreground text-sm">Auto-checks pending transactions and detects mismatches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReport} disabled={loading}><RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
          <Button onClick={runReconciliation} disabled={running} data-testid="run-reconciliation-btn">
            {running ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Activity className="w-4 h-4 mr-1" />} Run Now
          </Button>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total-pending">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{report.totalPending}</p>
              <p className="text-xs text-muted-foreground">Total Pending</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-stale-pending">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{report.stalePending}</p>
              <p className="text-xs text-muted-foreground">Stale (&gt;30min)</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-today-success">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{report.todaySuccess}</p>
              <p className="text-xs text-muted-foreground">Today Success</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-today-failed">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{report.todayFailed}</p>
              <p className="text-xs text-muted-foreground">Today Failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {report && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Today's Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Volume: <strong>₹{report.todayVolume?.toLocaleString()}</strong></p>
            <p>Commission: <strong>₹{report.todayCommission?.toLocaleString()}</strong></p>
            <p>Disputes: <strong>{report.todayDisputes}</strong></p>
            <p className="text-xs text-muted-foreground">Auto-reconciliation runs every 10 minutes</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReconciliationPage;
