import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import adminService from '../../services/adminService';
import apiClient from '../../services/apiClient';
import { toast } from 'sonner';
import { RefreshCw, Upload, AlertTriangle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const ReconciliationPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await adminService.getReconciliationReport();
      setReport(res.data);
    } catch {
      toast.error('Failed to fetch reconciliation report');
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    setRunning(true);
    try {
      await adminService.runReconciliation();
      toast.success('Reconciliation completed');
      fetchReport();
    } catch {
      toast.error('Failed to run reconciliation');
    } finally {
      setRunning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!file.name.endsWith('.csv') && !validTypes.includes(file.type)) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/reconciliation/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      toast.success(`Report imported: ${res.data.matched} matched, ${res.data.mismatched} mismatched`);
    } catch {
      toast.error('Failed to import report');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="reconciliation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6" /> Reconciliation
          </h1>
          <p className="text-muted-foreground text-sm">Monitor transaction health and import provider reports</p>
        </div>
        <Button onClick={runReconciliation} disabled={running} data-testid="run-reconciliation-btn">
          <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running...' : 'Run Now'}
        </Button>
      </div>

      {/* Stats Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-yellow-500" /> Total Pending
              </div>
              <div className="text-2xl font-bold" data-testid="total-pending">{report.totalPending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Stale (&gt;30m)
              </div>
              <div className="text-2xl font-bold text-orange-600" data-testid="stale-pending">{report.stalePending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" /> Today Success
              </div>
              <div className="text-2xl font-bold text-green-600" data-testid="today-success">{report.todaySuccess}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <XCircle className="w-4 h-4 text-red-500" /> Today Failed
              </div>
              <div className="text-2xl font-bold text-red-600" data-testid="today-failed">{report.todayFailed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Today Volume</div>
              <div className="text-xl font-bold">₹{report.todayVolume?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Today Commission</div>
              <div className="text-xl font-bold">₹{report.todayCommission?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Disputes</div>
              <div className="text-xl font-bold text-purple-600">{report.todayDisputes}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Report Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" /> Import Provider Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file from your recharge provider to reconcile transactions.
            The CSV should have columns: <code className="bg-muted px-1 rounded">txnId/transaction_id</code>,
            <code className="bg-muted px-1 rounded">status</code>,
            <code className="bg-muted px-1 rounded">amount</code>,
            <code className="bg-muted px-1 rounded">providerRef/ReferenceID</code>
          </p>
          <div className="flex items-center gap-4">
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload CSV'}</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
              </div>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
                data-testid="csv-upload-input"
              />
            </Label>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="border rounded-lg p-4 space-y-3" data-testid="import-results">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Import Results: {importResult.fileName}
              </h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-muted rounded p-2">
                  <div className="text-lg font-bold">{importResult.totalRows}</div>
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="text-lg font-bold text-green-600">{importResult.matched}</div>
                  <div className="text-xs text-green-700">Matched</div>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <div className="text-lg font-bold text-red-600">{importResult.mismatched}</div>
                  <div className="text-xs text-red-700">Mismatched</div>
                </div>
                <div className="bg-yellow-50 rounded p-2">
                  <div className="text-lg font-bold text-yellow-600">{importResult.notFound}</div>
                  <div className="text-xs text-yellow-700">Not Found</div>
                </div>
              </div>

              {importResult.mismatchedDetails?.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-red-700 mb-2">Mismatched Transactions</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1 px-2">Txn ID</th>
                          <th className="text-left py-1 px-2">Our Status</th>
                          <th className="text-left py-1 px-2">Provider Status</th>
                          <th className="text-right py-1 px-2">Our Amount</th>
                          <th className="text-right py-1 px-2">Provider Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.mismatchedDetails.map((m, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-1 px-2 font-mono">{m.txnId?.substring(0, 12)}...</td>
                            <td className="py-1 px-2"><Badge variant="outline">{m.ourStatus}</Badge></td>
                            <td className="py-1 px-2"><Badge variant="destructive">{m.providerStatus}</Badge></td>
                            <td className="text-right py-1 px-2">₹{m.ourAmount}</td>
                            <td className="text-right py-1 px-2">₹{m.providerAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {report && (
        <p className="text-xs text-muted-foreground text-right">
          Last reconciliation: {new Date(report.lastRun).toLocaleString()} | Auto-runs every 10 minutes
        </p>
      )}
    </div>
  );
};

export default ReconciliationPage;
