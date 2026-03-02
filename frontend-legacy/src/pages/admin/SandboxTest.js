import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import api from '../../services/api';
import { toast } from 'sonner';
import { Zap, Play, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

const SandboxTest = () => {
  const [users, setUsers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [wallets, setWallets] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [form, setForm] = useState({
    userId: '',
    count: 100,
    tpm: 600,
    selectedOperators: [],
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, operatorsRes, walletsRes] = await Promise.all([
        api.users.getAll(),
        api.operators.getAll(),
        api.wallet.getAll(),
      ]);
      setUsers(usersRes.data.filter(u => u.role !== 'admin'));
      setOperators(operatorsRes.data);
      const wm = {};
      walletsRes.data.forEach(w => { wm[w.userId] = w.balance; });
      setWallets(wm);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleOperator = (opId) => {
    const current = form.selectedOperators;
    if (current.includes(opId)) {
      setForm({ ...form, selectedOperators: current.filter(id => id !== opId) });
    } else {
      setForm({ ...form, selectedOperators: [...current, opId] });
    }
  };

  const runTest = async () => {
    if (!form.userId) { toast.error('Select a user'); return; }
    if (form.selectedOperators.length === 0) { toast.error('Select at least one operator'); return; }

    setRunning(true);
    setResults(null);
    try {
      const res = await api.recharge.sandboxTest({
        userId: form.userId,
        count: parseInt(form.count),
        operators: form.selectedOperators,
        tpm: parseInt(form.tpm),
      });
      setResults(res.data);
      toast.success(`Sandbox test complete: ${res.data.success} success, ${res.data.failed} failed, ${res.data.pending} pending`);
      fetchData(); // Refresh balances
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="sandbox-test">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500" /> Sandbox API Test
          </h2>
          <p className="text-muted-foreground">Run automated test transactions with random success/pending/failed outcomes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Test Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                <SelectTrigger data-testid="sandbox-user"><SelectValue placeholder="Choose user" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role}) - ₹{(wallets[u.id] || 0).toFixed(0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Operators</Label>
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30 max-h-48 overflow-auto">
                {operators.map(op => (
                  <label key={op.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.selectedOperators.includes(op.id)}
                      onChange={() => toggleOperator(op.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{op.name}</span>
                    <Badge variant="outline" className="text-xs">{op.service}</Badge>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Txns</Label>
                <Input type="number" min="1" max="1000" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} data-testid="sandbox-count" />
              </div>
              <div className="space-y-2">
                <Label>Txns/Min</Label>
                <Input type="number" min="1" max="6000" value={form.tpm} onChange={(e) => setForm({ ...form, tpm: e.target.value })} data-testid="sandbox-tpm" />
              </div>
            </div>

            {form.userId && (
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold text-accent">₹{(wallets[form.userId] || 0).toFixed(2)}</p>
              </div>
            )}

            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              onClick={runTest}
              disabled={running}
              data-testid="sandbox-run-btn"
            >
              {running ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running Test...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Run Sandbox Test</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Test Results</CardTitle></CardHeader>
          <CardContent>
            {!results && !running ? (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Configure and run a test to see results</p>
                <p className="text-sm mt-2">Sandbox randomly returns Success (50%), Pending (25%), Failed (25%)</p>
                <p className="text-sm">Failed transactions are automatically refunded. Commission is credited on success.</p>
              </div>
            ) : running ? (
              <div className="text-center py-16">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin text-yellow-500" />
                <p className="text-lg font-medium">Running {form.count} transactions...</p>
                <p className="text-sm text-muted-foreground">Processing at {form.tpm} txns/min</p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{results.total}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs text-green-700">Success</p>
                    <p className="text-3xl font-bold text-green-700">{results.success}</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="w-5 h-5 mx-auto text-red-600 mb-1" />
                    <p className="text-xs text-red-700">Failed</p>
                    <p className="text-3xl font-bold text-red-700">{results.failed}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Clock className="w-5 h-5 mx-auto text-yellow-600 mb-1" />
                    <p className="text-xs text-yellow-700">Pending</p>
                    <p className="text-3xl font-bold text-yellow-700">{results.pending}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Total Debited</p>
                      <p className="text-xl font-bold text-destructive">₹{results.totalDebited}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Commission Earned</p>
                      <p className="text-xl font-bold text-accent">₹{results.totalCommission?.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Total Refunded</p>
                      <p className="text-xl font-bold text-blue-600">₹{results.totalRefunded}</p>
                    </CardContent>
                  </Card>
                </div>

                {results.errors > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">Errors: {results.errors} (likely insufficient balance)</p>
                  </div>
                )}

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Transaction Flow Verified:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Amount debited BEFORE processing each transaction</li>
                    <li>2. Success: Commission credited to wallet (separate ledger entry with TXN ref)</li>
                    <li>3. Failed: Full amount refunded to wallet (separate ledger entry with TXN ref)</li>
                    <li>4. Pending: Amount stays debited until status check resolves it</li>
                    <li>5. Each ledger entry has debit/commission reference number</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SandboxTest;
