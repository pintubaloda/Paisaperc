import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import api from '../../services/api';
import { toast } from 'sonner';
import { BookOpen, Download, Search } from 'lucide-react';

const LedgerReport = () => {
  const [report, setReport] = useState([]);
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userId: '', startDate: '', endDate: '' });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.users.getAll();
        setUsers(res.data);
        const map = {};
        res.data.forEach(u => { map[u.id] = u.name; });
        setUserMap(map);
      } catch { }
    };
    loadUsers();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.wallet.getLedgerReport(filters);
      setReport(res.data);
    } catch (err) {
      toast.error('Failed to load ledger report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const exportCSV = () => {
    if (report.length === 0) return;
    const headers = ['S.No', 'User Name', 'Date Time', 'Txn ID', 'Mobile No', 'Opening Bal', 'Amount (Net)', 'Closing Bal', 'Remark'];
    const rows = report.map(r => [
      r.sNo, userMap[r.userId] || r.userId,
      new Date(r.dateTime).toLocaleString(),
      r.txnId, r.mobile, r.openingBal, r.netAmount, r.closingBal, r.remark,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6" data-testid="ledger-report">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-accent" /> Ledger Report
          </h2>
          <p className="text-muted-foreground">Consolidated transaction ledger with opening/closing balances</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={report.length === 0} data-testid="export-csv-btn">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 w-48">
              <Label className="text-xs">User</Label>
              <Select value={filters.userId} onValueChange={(v) => setFilters({ ...filters, userId: v === 'all' ? '' : v })}>
                <SelectTrigger data-testid="ledger-user-filter"><SelectValue placeholder="All Users" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-40">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} data-testid="ledger-start-date" />
            </div>
            <div className="space-y-1 w-40">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} data-testid="ledger-end-date" />
            </div>
            <Button onClick={fetchReport} className="bg-accent hover:bg-accent-hover" data-testid="ledger-search-btn">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ledger Entries ({report.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">S.No</th>
                    <th className="text-left p-3 font-medium">User Name</th>
                    <th className="text-left p-3 font-medium">Date Time</th>
                    <th className="text-left p-3 font-medium">Txn ID</th>
                    <th className="text-left p-3 font-medium">Mobile No</th>
                    <th className="text-right p-3 font-medium">Opening Bal</th>
                    <th className="text-right p-3 font-medium">Amount (Net)</th>
                    <th className="text-right p-3 font-medium">Closing Bal</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.sNo} className="border-b hover:bg-muted/50" data-testid={`ledger-row-${row.sNo}`}>
                      <td className="p-3 text-muted-foreground">{row.sNo}</td>
                      <td className="p-3 font-medium">{userMap[row.userId] || row.userId}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{new Date(row.dateTime).toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs">{row.txnId.substring(0, 12)}...</td>
                      <td className="p-3">{row.mobile}</td>
                      <td className="p-3 text-right">₹{row.openingBal.toFixed(2)}</td>
                      <td className={`p-3 text-right font-semibold ${row.netAmount >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {row.netAmount >= 0 ? '+' : ''}₹{row.netAmount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold">₹{row.closingBal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {report.length === 0 && (
                    <tr><td colSpan="8" className="text-center text-muted-foreground py-12">No ledger entries found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LedgerReport;
