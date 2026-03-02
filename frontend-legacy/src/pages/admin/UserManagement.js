import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import api from '../../services/api';
import { toast } from 'sonner';
import { Users, Shield, Ban, CheckCircle2, Edit, Wallet, Search, BookOpen } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [walletUser, setWalletUser] = useState(null);
  const [ledgerUser, setLedgerUser] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [editForm, setEditForm] = useState({});
  const [walletForm, setWalletForm] = useState({ amount: '', type: 'credit', remarks: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, walletsRes] = await Promise.all([
        api.users.getAll(),
        api.wallet.getAll(),
      ]);
      setUsers(usersRes.data);
      const walletMap = {};
      walletsRes.data.forEach(w => { walletMap[w.userId] = w.balance; });
      setWallets(walletMap);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await api.users.toggleStatus(userId);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setEditForm({ name: user.name, mobile: user.mobile, role: user.role, kycStatus: user.kycStatus });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.users.update(editUser.id, editForm);
      toast.success('User updated successfully');
      setEditUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const openWalletModal = (user) => {
    setWalletUser(user);
    setWalletForm({ amount: '', type: 'credit', remarks: '' });
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    if (!walletForm.amount || parseFloat(walletForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      const res = await api.users.adjustWallet(walletUser.id, {
        amount: parseFloat(walletForm.amount),
        type: walletForm.type,
        remarks: walletForm.remarks || `Manual ${walletForm.type} by admin`,
      });
      toast.success(res.data.message);
      setWalletUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust wallet');
    }
  };

  const openLedger = async (user) => {
    setLedgerUser(user);
    try {
      const res = await api.wallet.getUserLedger(user.id, 50);
      setLedgerEntries(res.data);
    } catch (error) {
      toast.error('Failed to fetch ledger');
      setLedgerEntries([]);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobile.includes(searchTerm)
  );

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="user-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage users, wallets, and access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Users</p><p className="text-2xl font-bold">{users.length}</p></div><Users className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Active</p><p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p></div><CheckCircle2 className="w-8 h-8 text-accent" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">KYC Verified</p><p className="text-2xl font-bold">{users.filter(u => u.kycStatus).length}</p></div><Shield className="w-8 h-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Balance</p><p className="text-2xl font-bold">₹{Object.values(wallets).reduce((a, b) => a + b, 0).toFixed(0)}</p></div><Wallet className="w-8 h-8 text-orange-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="user-search-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Mobile</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Balance</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-sm">{user.email}</td>
                    <td className="p-3">{user.mobile}</td>
                    <td className="p-3"><Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge></td>
                    <td className="p-3 font-semibold text-accent" data-testid={`user-balance-${user.id}`}>₹{(wallets[user.id] || 0).toFixed(2)}</td>
                    <td className="p-3">{user.isActive ? <Badge className="bg-accent">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(user)} title="Edit" data-testid={`edit-user-${user.id}`}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => openWalletModal(user)} title="Wallet" data-testid={`wallet-user-${user.id}`}><Wallet className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => openLedger(user)} title="Ledger" data-testid={`ledger-user-${user.id}`}><BookOpen className="w-4 h-4" /></Button>
                        <Button size="sm" variant={user.isActive ? "destructive" : "default"} onClick={() => toggleUserStatus(user.id)} data-testid={`toggle-user-${user.id}`}>
                          {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User - {editUser?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required data-testid="edit-user-name" />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={editForm.mobile || ''} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} required data-testid="edit-user-mobile" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role || ''} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger data-testid="edit-user-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="super_distributor">Super Distributor</SelectItem>
                  <SelectItem value="api_user">API User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="kycCheck" checked={editForm.kycStatus || false} onChange={(e) => setEditForm({ ...editForm, kycStatus: e.target.checked })} className="w-4 h-4" />
              <Label htmlFor="kycCheck">KYC Verified</Label>
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent-hover" data-testid="edit-user-submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Wallet Dialog */}
      <Dialog open={!!walletUser} onOpenChange={(open) => !open && setWalletUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Wallet - {walletUser?.name}</DialogTitle></DialogHeader>
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-accent">₹{(wallets[walletUser?.id] || 0).toFixed(2)}</p>
          </div>
          <form onSubmit={handleWalletSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={walletForm.type} onValueChange={(v) => setWalletForm({ ...walletForm, type: v })}>
                <SelectTrigger data-testid="wallet-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Add Money)</SelectItem>
                  <SelectItem value="debit">Debit (Deduct Money)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="1" step="0.01" placeholder="Enter amount" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} required data-testid="wallet-amount" />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea placeholder="Reason for adjustment..." value={walletForm.remarks} onChange={(e) => setWalletForm({ ...walletForm, remarks: e.target.value })} data-testid="wallet-remarks" />
            </div>
            <Button type="submit" className={`w-full ${walletForm.type === 'credit' ? 'bg-accent hover:bg-accent-hover' : 'bg-destructive hover:bg-destructive/90'}`} data-testid="wallet-submit">
              {walletForm.type === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ledger View Dialog */}
      <Dialog open={!!ledgerUser} onOpenChange={(open) => !open && setLedgerUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Account Ledger - {ledgerUser?.name}</DialogTitle></DialogHeader>
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-accent">₹{(wallets[ledgerUser?.id] || 0).toFixed(2)}</p>
          </div>
          {ledgerEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ledger entries</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Remark</th>
                    <th className="text-right p-2 font-medium">Debit</th>
                    <th className="text-right p-2 font-medium">Credit</th>
                    <th className="text-right p-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50" data-testid={`ledger-row-${i}`}>
                      <td className="p-2 text-xs whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                      <td className="p-2">{entry.remark}</td>
                      <td className="p-2 text-right text-destructive font-medium">{entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}</td>
                      <td className="p-2 text-right text-accent font-medium">{entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}</td>
                      <td className="p-2 text-right font-semibold">₹{entry.balanceAfter.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
