import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { toast } from 'sonner';
import { DollarSign, Plus, Trash2, Percent, Edit } from 'lucide-react';

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    role: 'retailer',
    operatorId: '',
    service: '',
    commissionType: 'percentage',
    commissionValue: 0,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [commissionsRes, operatorsRes] = await Promise.all([
        api.commission.getAll(),
        api.operators.getAll(),
      ]);
      setCommissions(commissionsRes.data);
      setOperators(operatorsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, commissionValue: parseFloat(form.commissionValue) };
      if (!payload.service) delete payload.service;
      if (editing) {
        await api.commission.update(editing.id, payload);
        toast.success('Commission updated');
      } else {
        await api.commission.create(payload);
        toast.success('Commission created');
      }
      setShowDialog(false);
      setEditing(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (comm) => {
    setEditing(comm);
    setForm({
      role: comm.role,
      operatorId: comm.operatorId,
      service: comm.service || '',
      commissionType: comm.commissionType,
      commissionValue: comm.commissionValue,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this commission rule?')) return;
    try {
      await api.commission.delete(id);
      toast.success('Commission deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setForm({ role: 'retailer', operatorId: '', service: '', commissionType: 'percentage', commissionValue: 0 });
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="commission-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Commission Settings</h2>
          <p className="text-muted-foreground">Define commission by User Type + Operator + Service</p>
        </div>
        <Button className="bg-accent hover:bg-accent-hover" onClick={() => { setEditing(null); resetForm(); setShowDialog(true); }} data-testid="add-commission-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Commission
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Rules</p><p className="text-2xl font-bold">{commissions.length}</p></div><DollarSign className="w-8 h-8 text-accent" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Percentage Rules</p><p className="text-2xl font-bold">{commissions.filter(c => c.commissionType === 'percentage').length}</p></div><Percent className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Flat Rules</p><p className="text-2xl font-bold">{commissions.filter(c => c.commissionType === 'flat').length}</p></div><DollarSign className="w-8 h-8 text-green-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Commission Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User Type</th>
                  <th className="text-left p-3 font-medium">Operator</th>
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Value</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((comm) => {
                  const operator = operators.find(o => o.id === comm.operatorId);
                  return (
                    <tr key={comm.id} className="border-b hover:bg-muted/50" data-testid={`commission-row-${comm.id}`}>
                      <td className="p-3"><Badge variant="outline" className="capitalize">{comm.role.replace('_', ' ')}</Badge></td>
                      <td className="p-3 font-medium">{operator?.name || 'N/A'}</td>
                      <td className="p-3"><Badge variant="secondary" className="uppercase">{comm.service || 'All'}</Badge></td>
                      <td className="p-3"><Badge>{comm.commissionType === 'percentage' ? '%' : 'Flat'}</Badge></td>
                      <td className="p-3 font-semibold text-accent">
                        {comm.commissionType === 'percentage' ? `${comm.commissionValue}%` : `₹${comm.commissionValue}`}
                      </td>
                      <td className="p-3">{comm.isActive !== false ? <Badge className="bg-accent">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(comm)} data-testid={`edit-commission-${comm.id}`}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(comm.id)} data-testid={`delete-commission-${comm.id}`}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {commissions.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted-foreground py-8">No commission rules configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Commission Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Commission Rule' : 'Add Commission Rule'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>User Type</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="commission-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="super_distributor">Super Distributor</SelectItem>
                  <SelectItem value="api_user">API User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Select value={form.operatorId} onValueChange={(v) => setForm({ ...form, operatorId: v })}>
                <SelectTrigger data-testid="commission-operator"><SelectValue placeholder="Select operator" /></SelectTrigger>
                <SelectContent>
                  {operators.map(op => <SelectItem key={op.id} value={op.id}>{op.name} ({op.service})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service (Optional)</Label>
              <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                <SelectTrigger data-testid="commission-service"><SelectValue placeholder="All services" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Services</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="dth">DTH</SelectItem>
                  <SelectItem value="bill_payment">Bill Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission Type</Label>
                <Select value={form.commissionType} onValueChange={(v) => setForm({ ...form, commissionType: v })}>
                  <SelectTrigger data-testid="commission-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" step="0.01" min="0" value={form.commissionValue} onChange={(e) => setForm({ ...form, commissionValue: e.target.value })} required data-testid="commission-value" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent-hover" data-testid="commission-submit">
              {editing ? 'Update' : 'Create'} Commission Rule
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionManagement;
